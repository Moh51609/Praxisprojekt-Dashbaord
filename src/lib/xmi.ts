import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import type {
  ParsedModel,
  UmlElement,
  UmlRelationship,
  ClassStat,
  DiagramInfo,
  Metrics,
} from "@/types/model";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "", // Attribute heißen dann z.B. "xmi:id"
  allowBooleanAttributes: true,
});

/** Utility: Einzel-Objekt oder Array => immer Array */
function asArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/** Zählt im Teilbaum alle Knoten mit xmi:type === wanted oder Tag-Schlüssel === wantedKey (Fallback) */
function countIn(subtree: any, wanted: string, wantedKey?: string): number {
  let n = 0;
  function walk(node: any) {
    if (!node || typeof node !== "object") return;
    // Treffer über xmi:type / type
    const t = node["xmi:type"] ?? node["type"];
    if (t === wanted) n++;

    // Fallback: Keys wie "uml:Port": [...]
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

/** Heuristik: „Block?“ – wenn Stereotype "Block" o. Ports/Connectoren vorhanden */
function isMaybeBlock(classNode: any): boolean {
  const ster = String(
    classNode?.appliedStereotype ?? classNode?.stereotype ?? ""
  ).toLowerCase();
  if (ster.includes("block")) return true;
  const ports = countIn(classNode, "uml:Port", "uml:Port");
  const conns = countIn(classNode, "uml:Connector", "uml:Connector");
  return ports > 0 || conns > 0;
}

/** 🔍 Traversiert alle Packages und sammelt UML-/SysML-Elemente rekursiv */
function collectAllElements(
  node: any,
  currentPackage = "Model",
  acc: UmlElement[] = []
): UmlElement[] {
  if (!node || typeof node !== "object") return acc;

  const type = node["xmi:type"] ?? node["type"];
  const id = node["xmi:id"] ?? node["id"];
  const name = node["name"] ?? "(Unbenannt)";
  const stereotype = node["stereotype"] ?? node["appliedStereotype"];

  // nur relevante UML-/SysML-Typen erfassen
  const relevant = [
    "uml:Class",
    "uml:Port",
    "uml:Package",
    "uml:Requirement",
    "uml:UseCase",
    "uml:Activity",
    "uml:Connector",
    "uml:Association",
    "uml:Generalization",
    "sysml:Block",
    "sysml:InternalBlock",
    "sysml:Requirement",
    "sysml:Parametric",
    "sysml:Constraint",
    "uml:Diagram",
  ];

  if (type && relevant.some((t) => type.includes(t))) {
    acc.push({
      id,
      name,
      type,
      stereotype,
      package: currentPackage,
    });
  }

  // Rekursiv tiefer gehen
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (Array.isArray(val))
      val.forEach((v) =>
        collectAllElements(v, node["name"] ?? currentPackage, acc)
      );
    else if (typeof val === "object")
      collectAllElements(val, node["name"] ?? currentPackage, acc);
  }

  return acc;
}

export function parseXmiFromString(xmiText: string): ParsedModel {
  const json = parser.parse(xmiText) as Record<string, any>;

  // Einstiegspunkte tolerant finden
  const xmi = json["xmi:XMI"] ?? json["XMI"] ?? json;
  const model = xmi["uml:Model"] ?? xmi["Model"] ?? xmi;

  function collectClasses(node: any): any[] {
    let result: any[] = [];
    if (!node || typeof node !== "object") return result;

    if (node["xmi:type"] === "uml:Class" || node["type"] === "uml:Class") {
      result.push(node);
    }

    for (const key of Object.keys(node)) {
      const value = node[key];
      if (value && typeof value === "object") {
        result = result.concat(collectClasses(value));
      }
    }

    return result;
  }

  function collectClassesAndPackages(node: any): any[] {
    let result: any[] = [];
    if (!node || typeof node !== "object") return result;

    const type = node["xmi:type"] ?? node["type"];
    if (type === "uml:Class" || type === "uml:Package") {
      result.push(node);
    }

    for (const key of Object.keys(node)) {
      const value = node[key];
      if (value && typeof value === "object") {
        result = result.concat(collectClassesAndPackages(value));
      }
    }

    return result;
  }

  const packaged = collectClassesAndPackages(model);

  // 🗺️ Package-Zuordnung (id → Package-Name)
  const packageMap: Record<string, string> = {};

  function walkPackages(node: any, currentPackage = "Model") {
    if (!node || typeof node !== "object") return;
    const type = node["xmi:type"] ?? node["type"];
    const id = node["xmi:id"] ?? node["id"];
    const name = node["name"];

    if (type === "uml:Package") {
      currentPackage = name || "(Unbenanntes Package)";
    }

    if (id) packageMap[id] = currentPackage;

    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) {
        val.forEach((v) => walkPackages(v, currentPackage));
      } else if (val && typeof val === "object") {
        walkPackages(val, currentPackage);
      }
    }
  }

  walkPackages(model);

  // 🧮 Hilfsfunktion: berechnet die Tiefe eines Elements im Modellbaum
  function collectDepths(
    node: any,
    currentDepth = 0,
    acc: Record<string, number> = {}
  ): Record<string, number> {
    if (!node || typeof node !== "object") return acc;

    const id = node["xmi:id"];
    if (id) acc[id] = currentDepth;

    // Durchlaufe Kinderknoten (z. B. packagedElement, ownedAttribute usw.)
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) {
        for (const child of val) {
          if (typeof child === "object")
            collectDepths(child, currentDepth + 1, acc);
        }
      } else if (val && typeof val === "object") {
        collectDepths(val, currentDepth + 1, acc);
      }
    }

    return acc;
  }

  // 📊 Alle Tiefen im Modell berechnen
  const depthMap = collectDepths(model);

  const elements: UmlElement[] = [];
  const relationships: UmlRelationship[] = [];
  const classStats: ClassStat[] = [];
  const diagramList: DiagramInfo[] = [];

  // --- Elemente & offensichtliche Relationen aus packagedElement ----------------
  for (const pe of packaged) {
    function extractStereotype(node: any): string | undefined {
      if (!node || typeof node !== "object") return undefined;
      const st =
        node.appliedStereotype ??
        node.stereotype ??
        node.appliedStereotypeInstance ??
        node["mdElementStereotype"] ??
        undefined;

      if (typeof st === "string" && st.length > 0) {
        return st.replace(/^.*::/, ""); // "SysML::Block" → "Block"
      }

      // Rekursiv weitersuchen
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === "object") {
          const deep = extractStereotype(val);
          if (deep) return deep;
        }
      }

      return undefined;
    }

    /** Sucht den nächstgelegenen Package-Namen eines Elements im Baum */
    function findParentPackageName(element: any, parentName = "Model"): string {
      if (!element || typeof element !== "object") return parentName;

      // Wenn das aktuelle Element selbst ein Package ist, setze es als neuen Kontext
      if (element["xmi:type"] === "uml:Package" && element.name) {
        parentName = element.name;
      }

      // Durchlaufe alle möglichen Keys (packagedE
      // lement, ownedElement, etc.)
      for (const key of Object.keys(element)) {
        const value = element[key];
        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === "object" && child["xmi:id"]) {
              // ID → merken
              packageMap[child["xmi:id"]] = parentName;
              // Rekursion
              findParentPackageName(child, parentName);
            }
          }
        } else if (value && typeof value === "object") {
          findParentPackageName(value, parentName);
        }
      }

      return parentName;
    }

    const type = pe["xmi:type"] ?? pe["type"] ?? "";
    const id = pe["xmi:id"] ?? pe["id"] ?? "";
    const packageName =
      pe["package"]?.name ??
      pe["namespace"] ??
      pe["owner"]?.name ??
      model?.name ??
      "—";
    if (!id || !type) continue;

    elements.push({
      id,
      name: pe.name,
      type,
      stereotype: extractStereotype(pe),

      package: packageMap[pe["xmi:id"]] ?? "(Kein Package)",
      depth: depthMap[id] ?? 0,
    });

    if (type === "uml:Association" || pe.memberEnd || pe.ownedEnd) {
      const ends = asArray(pe.ownedEnd ?? pe.memberEnd);
      relationships.push({
        id,
        type: "uml:Association",
        name: pe.name,
        source: ends[0]?.["xmi:idref"] ?? ends[0]?.type ?? ends[0]?.["xmi:id"],
        target: ends[1]?.["xmi:idref"] ?? ends[1]?.type ?? ends[1]?.["xmi:id"],
      });
    }

    if (type === "uml:Dependency" || (pe.client && pe.supplier)) {
      relationships.push({
        id,
        type: "uml:Dependency",
        source: pe.client,
        target: pe.supplier,
        name: pe.name,
      });
    }

    for (const gen of asArray(pe.generalization)) {
      relationships.push({
        id: gen["xmi:id"] ?? `${id}_gen_${gen.general ?? "unknown"}`,
        type: "uml:Generalization",
        source: id,
        target: gen.general,
      });
    }

    if (type === "uml:Class") {
      const portsCount =
        countIn(pe, "uml:Port", "uml:Port") +
        countIn(
          pe.ownedAttribute ?? pe["ownedAttribute"],
          "uml:Port",
          "uml:Port"
        ) +
        countIn(
          pe.ownedAttribute ?? pe["ownedAttribute"],
          "sysml:Port",
          "sysml:Port"
        ) +
        countIn(
          pe.ownedAttribute ?? pe["ownedAttribute"],
          "sysml:FlowPort",
          "sysml:FlowPort"
        );

      const connectorCount =
        countIn(pe, "uml:Connector", "uml:Connector") +
        countIn(pe.ownedConnector, "uml:Connector", "uml:Connector");

      classStats.push({
        className: pe.name,
        umlId: id,
        attributes:
          countIn(pe, "uml:Property", "uml:Property") +
          countIn(pe.ownedAttribute, "uml:Property", "uml:Property"),
        ports: portsCount,
        connectors: connectorCount,
        maybeSysmlBlock: isMaybeBlock(pe),
      });
    }
  }
  // --- Qualitätsmetriken ----------------------------------------------------

  const diagramNodes: any[] = [];

  function collectDiagramNodes(node: any) {
    if (!node || typeof node !== "object") return;

    const t = String(node["xmi:type"]) ?? node["type"] ?? "";
    const mdElem = String(node["mdElement"] ?? "");
    const name = node["name"];

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

  for (const d of diagramNodes) {
    const mdType =
      d["mdElement"] ??
      d["mdDiagramType"] ??
      d["diagramType"] ??
      d["diagram_kind"] ??
      d["type"] ??
      (d["xmi:type"]?.includes("Diagram")
        ? d["xmi:type"].replace("uml:", "")
        : "Unknown");

    diagramList.push({
      name: d?.name ?? "Unbenanntes Diagramm",
      mdType,
    });
  }

  // 🔹 Port-Richtungsprüfung direkt in parseXmiFromString einbauen
  function checkPortDirectionIssues(elements: UmlElement[]): number {
    let badConnections = 0;

    // Alle Ports und Connectoren aus der Elementliste herausfiltern
    const ports = elements.filter((e) => e.type === "uml:Port");
    const connectors = elements.filter((e) => e.type === "uml:Connector");

    for (const conn of connectors) {
      // In XMI heißen die Verbindungen oft "end" oder "ownedEnd"
      const ends = asArray((conn as any).end ?? (conn as any).ownedEnd ?? []);
      if (ends.length === 2) {
        const portA = ports.find((p) => p.id === ends[0]?.idref);
        const portB = ports.find((p) => p.id === ends[1]?.idref);

        if (portA?.direction && portB?.direction) {
          const a = portA.direction.toLowerCase();
          const b = portB.direction.toLowerCase();
          const isOk =
            (a === "in" && b === "out") || (a === "out" && b === "in");
          if (!isOk) badConnections++;
        }
      }
    }

    return badConnections;
  }

  // === Redundante Elemente ===
  // (Einfacher Heuristik-Ansatz: Elemente mit identischem Namen und Typ)
  const seen = new Set<string>();
  const redundantElements = elements.filter((e) => {
    const key = `${e.name ?? ""}_${e.type ?? ""}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  }).length;

  // === Generelle Probleme ===
  // z.B. unbenannte Elemente, Ports ohne Typ, leere Packages, falsche Portverbindungen

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
    blocksEstimated: 0,
    abstraction: 0,
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
      case "uml:Property":
        metrics.properties++;
        break;
      case "uml:Port":
        metrics.ports++;
        break;
      case "uml:Connector":
        metrics.connectors++;
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
      case "uml:Dependency":
        metrics.dependencies++;
        break;
      case "uml:Parameter":
        metrics.parameters++;
        break;
      case "uml:Abstraction":
        metrics.abstraction++;
        break;

      default:
        // 🆕 Unbekannte UML-Typen mitzählen
        if (t && typeof t === "string" && t.startsWith("uml:")) {
          metrics.unknownElements++;
        }
        break;
    }

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === "object") tally(v);
    }
  }
  tally(json);

  metrics.unnamedElements = elements.filter(
    (e) => !e.name || String(e.name).trim() === ""
  ).length;
  metrics.blocksEstimated = classStats.filter((c) => c.maybeSysmlBlock).length;

  const validDiagrams = diagramList.filter(
    (d) =>
      d.mdType &&
      d.mdType !== "Unknown" &&
      d.mdType.trim() !== "" &&
      !/^\(?\d+\)?$/.test(d.mdType)
  );

  // --- Qualitätskennzahlen --------------------------------------------------
  const packages = elements.filter((e) => e.type === "uml:Package");
  const unnamedPerPackage: {
    package: string;
    unnamed: number;
    total: number;
    ratio: number;
  }[] = [];

  for (const pkg of packages) {
    const pkgName = pkg.name || "(Unbenanntes Package)";
    const children = elements.filter((e) => e.package === pkgName);
    const unnamed = children.filter(
      (c) => !c.name || String(c.name).trim() === ""
    ).length;
    const total = children.length || 1;
    unnamedPerPackage.push({
      package: pkgName,
      unnamed,
      total,
      ratio: unnamed / total,
    });
  }

  // Ports ohne Typ
  const portsWithoutType = elements.filter(
    (e) => e.type === "uml:Port" && !(e as any).type && !(e as any)["xmi:type"]
  ).length;

  // Leere Packages
  const emptyPackages = packages.filter(
    (p) => !elements.some((e) => e.package === p.name)
  ).length;

  const diagramsByType = validDiagrams.reduce<Record<string, number>>(
    (acc, d) => {
      const cleanKey = (d.mdType || "")
        .replace(/MagicDraw|SysML|UML|Diagram/gi, "")
        .trim();
      if (!cleanKey) return acc;
      acc[cleanKey] = (acc[cleanKey] ?? 0) + 1;
      return acc;
    },
    {}
  );
  metrics.portDirectionIssues = checkPortDirectionIssues(elements);

  const generalIssues =
    (metrics.unnamedElements ?? 0) +
    (metrics.portDirectionIssues ?? 0) +
    (elements.filter((e) => e.type === "uml:Port" && !(e as any).type).length ??
      0) +
    (elements.filter(
      (e) => e.type === "uml:Package" && !(e.name && e.name.trim())
    ).length ?? 0);

  metrics.redundantElements = redundantElements;
  metrics.generalIssues = generalIssues;

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
  };
}

export function parseXmiFromFile(path: string): ParsedModel {
  const xmi = readFileSync(path, "utf-8");
  return parseXmiFromString(xmi);
}
