import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import type {
  ParsedModel,
  UmlElement,
  UmlRelationship,
  ClassStat,
  SearchIndexItem,
  DiagramInfo,
  Metrics,
} from "@/types/model";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
});

const idToName: Record<string, string> = {};

// Utility
function asArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function countIn(subtree: any, wanted: string, wantedKey?: string): number {
  let n = 0;
  function walk(node: any) {
    if (!node || typeof node !== "object") return;
    const t = node["xmi:type"] ?? node["type"];
    if (t === wanted) n++;

    if (wantedKey && Object.prototype.hasOwnProperty.call(node, wantedKey)) {
      const val = node[wantedKey];
      n += Array.isArray(val) ? val.length : 1;
    }

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === "object") walk(v);
    }
  }
  walk(subtree);
  return n;
}

function isMaybeBlock(node: any): boolean {
  const ster = String(
    node?.appliedStereotype ?? node?.stereotype ?? ""
  ).toLowerCase();
  if (ster.includes("block")) return true;
  return (
    countIn(node, "uml:Port", "uml:Port") > 0 ||
    countIn(node, "uml:Connector", "uml:Connector") > 0
  );
}

// ------------------------------------------------------------
// 🆕 NEW: Kleine Hilfsparser für Ports & Attribute
// ------------------------------------------------------------

function parseAttributes(pe: any) {
  const attrs: any[] = [];
  const list = asArray(pe.ownedAttribute);

  for (const a of list) {
    if (!a) continue;
    if (a["xmi:type"] === "uml:Property") {
      attrs.push({
        id: a["xmi:id"],
        name: a["name"] ?? "",
        type: idToName[a["type"]] ?? a["type"] ?? "",
        default: a?.defaultValue?.value ?? "",
      });
    }
  }

  return attrs;
}

function parsePorts(pe: any) {
  const ports: any[] = [];
  const list = asArray(pe.ownedAttribute);

  for (const p of list) {
    if (p["xmi:type"] === "uml:Port") {
      ports.push({
        id: p["xmi:id"],
        name: p["name"] ?? "",
        type: idToName[p["type"]] ?? p["type"] ?? "",
        direction: p["direction"] ?? "inout",
        multiplicity: p?.lowerValue?.value
          ? `${p.lowerValue.value}..${p.upperValue?.value ?? "*"}`
          : 1,
      });
    }
  }

  return ports;
}

export function parseXmiFromString(xmiText: string): ParsedModel {
  const json = parser.parse(xmiText);

  const xmi = json["xmi:XMI"] ?? json["XMI"] ?? json;
  const model = xmi["uml:Model"] ?? xmi["Model"] ?? xmi;

  // ------------------------------------------------------------
  // 🔍 STEREOTYPE MAPPING AUS XMI:Extension EXTRAHIEREN
  // ------------------------------------------------------------

  // Mapping: Class-ID → Stereotyp-Name
  const classToStereotype: Record<string, string> = {};

  const extensions = asArray(xmi["xmi:Extension"]);

  for (const ext of extensions) {
    const block = ext?.stereotypesHREFS;
    if (!block) continue;

    const stereotypes = asArray(block.stereotype);

    for (const st of stereotypes) {
      const name = st.name?.split(":")[1];
      const href = st.stereotypeHREF;
      if (!name || !href) continue;

      // MagicDraw HREF endet mit #<class-id>
      const match = href.match(/#(.+)$/);
      if (!match) continue;

      const classId = match[1];
      classToStereotype[classId] = name;
    }
  }

  function collectDepths(node: any, depth = 0, acc: any = {}) {
    if (!node || typeof node !== "object") return acc;
    if (node["xmi:id"]) acc[node["xmi:id"]] = depth;

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === "object") {
        if (Array.isArray(v)) {
          v.forEach((c) => collectDepths(c, depth + 1, acc));
        } else collectDepths(v, depth + 1, acc);
      }
    }
    return acc;
  }

  const depthMap = collectDepths(model);

  function collectClassesAndPackages(node: any): any[] {
    let arr: any[] = [];
    if (!node || typeof node !== "object") return arr;

    const type = node["xmi:type"] ?? node["type"];
    if (type === "uml:Class" || type === "uml:Package") arr.push(node);

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === "object") {
        if (Array.isArray(v))
          v.forEach((c) => (arr = arr.concat(collectClassesAndPackages(c))));
        else arr = arr.concat(collectClassesAndPackages(v));
      }
    }
    return arr;
  }

  const packaged = collectClassesAndPackages(model);

  const packageMap: any = {};

  function walkPackages(node: any, current = "Model") {
    if (!node || typeof node !== "object") return;

    const type = node["xmi:type"] ?? node["type"];
    const id = node["xmi:id"];
    const name = node["name"];

    if (type === "uml:Package") current = name ?? "(Unbenannt)";

    if (id) packageMap[id] = current;

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => walkPackages(c, current));
      else if (v && typeof v === "object") walkPackages(v, current);
    }
  }

  walkPackages(model);

  const elements: UmlElement[] = [];
  const relationships: UmlRelationship[] = [];
  const classStats: ClassStat[] = [];
  const diagramList: DiagramInfo[] = [];

  for (const pe of packaged) {
    const type = pe["xmi:type"] ?? pe["type"];
    const id = pe["xmi:id"] ?? pe["id"];
    if (!id || !type) continue;

    const name = pe["name"] ?? "(Unbenannt)";
    idToName[id] = name;

    // --------------------------
    // Stereotyp extrahieren
    // --------------------------
    function extractStereotype(node: any): string | undefined {
      if (!node || typeof node !== "object") return undefined;

      // 1. Direkte Strings wie "SysML::Block"
      const direct =
        node.appliedStereotype ??
        node.stereotype ??
        node["mdElementStereotype"]?.name ??
        node["mdElementStereotype"];

      if (typeof direct === "string" && direct.trim()) {
        return direct.split("::").pop(); // nur den letzten Teil
      }

      // 2. Wenn eine ID drin steckt -> ignorieren, wird später per idToName gelöst
      if (typeof direct === "string" && direct.startsWith("_")) {
        return undefined;
      }

      // 3. Rekursiv suchen
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === "object") {
          const res = extractStereotype(val);
          if (res) return res;
        }
      }

      return undefined;
    }

    const element: UmlElement = {
      id,
      name,
      type,
      stereotype: classToStereotype[id] ?? extractStereotype(pe),
      package: packageMap[id] ?? "(Kein Package)",
      depth: depthMap[id] ?? 0,

      // 🆕 NEU: initial leere Detaildaten
      attributes: [],
      ports: [],
      incoming: [],
      outgoing: [],
    };
    idToName[id] = pe.name ?? "(Unbenannt)";

    // ----------------------------------------
    // 🆕 Attribute & Ports extrahieren
    // ----------------------------------------
    if (type === "uml:Class") {
      element.attributes = parseAttributes(pe);
      element.ports = parsePorts(pe);
    }

    elements.push(element);

    // ----------------------------------------
    // Beziehungen sammeln
    // ----------------------------------------

    // UML Association
    if (type === "uml:Association" || pe.memberEnd || pe.ownedEnd) {
      const ends = asArray(pe.ownedEnd ?? pe.memberEnd);
      if (ends.length >= 2) {
        const source =
          ends[0]?.["xmi:idref"] ?? ends[0]?.type ?? ends[0]?.["xmi:id"];
        const target =
          ends[1]?.["xmi:idref"] ?? ends[1]?.type ?? ends[1]?.["xmi:id"];

        relationships.push({
          id,
          type: "uml:Association",
          name,
          source,
          target,
        });

        // 🆕 incoming/outgoing auffüllen
        const srcEl = elements.find((e) => e.id === source);
        const tgtEl = elements.find((e) => e.id === target);

        if (srcEl) srcEl.outgoing!.push(id);
        if (tgtEl) tgtEl.incoming!.push(id);
      }
    }

    // UML Dependency
    if (type === "uml:Dependency" || (pe.client && pe.supplier)) {
      relationships.push({
        id,
        type: "uml:Dependency",
        name,
        source: pe.client,
        target: pe.supplier,
      });

      const srcEl = elements.find((e) => e.id === pe.client);
      const tgtEl = elements.find((e) => e.id === pe.supplier);

      if (srcEl) srcEl.outgoing!.push(id);
      if (tgtEl) tgtEl.incoming!.push(id);
    }

    // Generalizations
    for (const gen of asArray(pe.generalization)) {
      relationships.push({
        id: gen["xmi:id"] ?? `${id}_gen_${gen.general}`,
        type: "uml:Generalization",
        source: id,
        target: gen.general,
      });

      const tgtEl = elements.find((e) => e.id === gen.general);
      if (tgtEl) tgtEl.incoming!.push(id);

      const srcEl = elements.find((e) => e.id === id);
      if (srcEl) srcEl.outgoing!.push(id);
    }

    // ----------------------------------------
    // classStats (unverändert)
    // ----------------------------------------
    if (type === "uml:Class") {
      const portsCount = countIn(pe, "uml:Port", "uml:Port");
      const connectorCount = countIn(pe, "uml:Connector", "uml:Connector");

      classStats.push({
        className: pe.name,
        umlId: id,
        attributes: countIn(pe, "uml:Property", "uml:Property"),
        ports: portsCount,
        connectors: connectorCount,
        maybeSysmlBlock: isMaybeBlock(pe),
      });
    }
  }

  // ========================================================================
  //      TEIL 3 — DIAGRAMME, METRIKEN, QUALITÄT & RETURN
  // ========================================================================

  // --- Diagramme ----------------------------------------------------------
  const diagramNodes: any[] = [];

  function collectDiagramNodes(node: any) {
    if (!node || typeof node !== "object") return;

    const t = String(node["xmi:type"]) ?? "";
    const mdElem = String(node["mdElement"] ?? "");

    if (
      t.includes("Diagram") ||
      mdElem.includes("Diagram") ||
      Object.keys(node).some((k) => k.toLowerCase().includes("diagram"))
    ) {
      diagramNodes.push(node);
    }

    for (const key of Object.keys(node)) {
      const val = node[key];
      if (val && typeof val === "object") collectDiagramNodes(val);
    }
  }
  collectDiagramNodes(json);

  const mappedDiagrams = diagramNodes.map((d) => {
    let name = d?.name ?? "Unbenanntes Diagramm";
    let type = "Unknown";

    // MagicDraw stores diagram type deeply nested:
    const ext = d["xmi:Extension"] ?? d["Extension"];
    const rep = ext?.diagramRepresentation;
    const diagObj = rep?.["diagram:DiagramRepresentationObject"];

    if (diagObj) {
      // diagram name inside object?
      if (diagObj.name) name = diagObj.name;
      // try all possible fields MagicDraw uses
      type =
        diagObj.type ??
        diagObj.umlType ??
        diagObj.diagramType ??
        diagObj.diagramKind ??
        "Unknown";
    }

    return { name, mdType: type };
  });

  diagramList.push(...mappedDiagrams);

  // --- Metriken -----------------------------------------------------------
  const metrics: Metrics = {
    classes: 0,
    profiles: 0,
    stereotypes: 0,
    associations: 0,
    generalizations: 0,
    dependencies: 0,
    properties: 0,
    ports: 0,
    connectors: 0,
    parameters: 0,
    useCases: 0,
    activities: 0,
    packages: 0,
    diagramsTotal: 0,
    unnamedElements: 0,
    unknownElements: 0,
    abstraction: 0,
    blocksEstimated: 0,
  };

  function tally(node: any) {
    if (!node || typeof node !== "object") return;

    const t = node["xmi:type"] ?? node["type"];

    switch (t) {
      case "uml:Class":
        metrics.classes++;
        break;
      case "uml:Profile":
        metrics.profiles++;
        break;
      case "uml:Stereotype":
        metrics.stereotypes++;
        break;
      case "uml:Association":
        metrics.associations++;
        break;
      case "uml:Generalization":
        metrics.generalizations++;
        break;
      case "uml:Dependency":
        metrics.dependencies++;
        break;
      case "uml:Property":
        metrics.properties++;
        break;
      case "uml:Port":
        metrics.ports++;
        break;
      case "uml:Connector":
        metrics.connectors++;
        break;
      case "uml:Parameter":
        metrics.parameters++;
        break;
      case "uml:UseCase":
        metrics.useCases++;
        break;
      case "uml:Activity":
        metrics.activities++;
        break;
      case "uml:Package":
        metrics.packages++;
        break;
      case "uml:Diagram":
        metrics.diagramsTotal++;
        break;
      case "uml:Abstraction":
        metrics.abstraction++;
        break;

      default:
        if (t && typeof t === "string" && t.startsWith("uml:")) {
          metrics.unknownElements++;
        }
        break;
    }

    for (const key of Object.keys(node)) {
      const v = node[key];
      if (v && typeof v === "object") tally(v);
    }
  }
  tally(json);

  // weitere Qualitätsmetriken
  metrics.unnamedElements = elements.filter((e) => !e.name?.trim()).length;
  metrics.blocksEstimated = classStats.filter((c) => c.maybeSysmlBlock).length;

  const validDiagrams = diagramList.filter(
    (d) => d.mdType && d.mdType !== "Unknown"
  );

  // Packages
  const packages = elements.filter((e) => e.type === "uml:Package");

  const unnamedPerPackage = packages.map((pkg) => {
    const pkgName = pkg.name ?? "(Unbenannt)";
    const children = elements.filter((e) => e.package === pkgName);
    const unnamed = children.filter((c) => !c.name || !c.name.trim()).length;

    return {
      package: pkgName,
      unnamed,
      total: children.length || 1,
      ratio: unnamed / (children.length || 1),
    };
  });

  const portsWithoutType = elements.filter(
    (e) => e.type === "uml:Port" && !(e as any).type
  ).length;

  const emptyPackages = packages.filter(
    (pkg) => !elements.some((e) => e.package === pkg.name)
  ).length;

  const diagramsByType = validDiagrams.reduce<Record<string, number>>(
    (acc, d) => {
      const key = (d.mdType ?? "").replace(/Diagram|uml:|sysml:/gi, "").trim();
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const searchIndex: SearchIndexItem[] = [
    // Elemente
    ...elements.map((e) => {
      const item: SearchIndexItem = {
        id: e.id,
        name: e.name ?? "(Unbenannt)",
        type: e.type,
        kind: "element",
        parent: null,
        original: e,
      };
      return item;
    }),

    // Attribute
    ...elements.flatMap((e) =>
      (e.attributes ?? []).map((a) => {
        const item: SearchIndexItem = {
          id: a.id,
          name: a.name ?? "(Unbenanntes Attribut)",
          type: "Attribute",
          kind: "attribute",
          parent: e.id,
          original: { ...a, parentElement: e },
        };
        return item;
      })
    ),

    // Ports
    ...elements.flatMap((e) =>
      (e.ports ?? []).map((p) => {
        const item: SearchIndexItem = {
          id: p.id,
          name: p.name ?? "(Port ohne Namen)",
          type: "Port",
          kind: "port",
          parent: e.id,
          original: { ...p, parentElement: e },
        };
        return item;
      })
    ),

    // Beziehungen
    ...relationships.map((r) => {
      const item: SearchIndexItem = {
        id: r.id,
        name: r.name ?? `${r.source} → ${r.target}`,
        type: r.type,
        kind: "relationship",
        parent: null,
        original: r,
      };
      return item;
    }),
  ];

  // --- FINALER RETURN ------------------------------------------------------
  return {
    elements,
    relationships,
    meta: {
      elementCount: elements.length,
      relationshipCount: relationships.length,
    },
    metrics,
    diagramsByType,
    diagramList,
    classStats,
    quality: {
      unnamedPerPackage,
      portsWithoutType,
      emptyPackages,
    },
    searchIndex,
    packages,
  };
}

export function parseXmiFromFile(path: string): ParsedModel {
  const xmi = readFileSync(path, "utf-8");
  return parseXmiFromString(xmi);
}
