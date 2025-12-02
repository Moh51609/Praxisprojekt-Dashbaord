import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { parseXmiFromString } from "@/lib/xmi";

function resolveEndRef(end: any): string | null {
  if (!end) return null;
  if (typeof end === "string") return end;
  return (
    end["xmi:idref"] ||
    end["xmi:id"] ||
    end["idref"] ||
    end["id"] ||
    end["type"] ||
    end["participant"] ||
    end["role"] ||
    null
  );
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "Praktikum3.xml");
    if (!fs.existsSync(filePath)) {
      throw new Error(`XMI-Datei nicht gefunden unter ${filePath}`);
    }

    const xmlData = fs.readFileSync(filePath, "utf-8");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true,
    });

    const json = parser.parse(xmlData);
    const xmi = json["xmi:XMI"] ?? json["XMI"] ?? json;
    const model = xmi["uml:Model"] ?? xmi["Model"] ?? xmi;

    const relations: any[] = [];

    function collectRelations(node: any) {
      if (!node || typeof node !== "object") return;

      const type = node["xmi:type"] ?? node["type"];
      const id = node["xmi:id"] ?? node["id"];

      if (
        type &&
        [
          "uml:Association",
          "uml:Connector",
          "uml:Dependency",
          "uml:Generalization",
          "uml:Realization",
          "uml:Abstraction",
          "sysml:Trace",
          "sysml:DeriveReqt",
          "sysml:Satisfy",
          "sysml:Verify",
        ].includes(type)
      ) {
        let source = null;
        let target = null;

        if (node.client) source = resolveEndRef(node.client);
        if (node.supplier) target = resolveEndRef(node.supplier);
        if (!source && node.source) source = resolveEndRef(node.source);
        if (!target && node.target) target = resolveEndRef(node.target);
        if (node.end && Array.isArray(node.end)) {
          source = resolveEndRef(node.end[0]);
          target = resolveEndRef(node.end[1]);
        }
        if (node.memberEnd && Array.isArray(node.memberEnd)) {
          source = resolveEndRef(node.memberEnd[0]);
          target = resolveEndRef(node.memberEnd[1]);
        }

        relations.push({
          id: id ?? Math.random().toString(36).substring(2),
          name: node.name ?? "(Unbenannt)",
          type,
          source: source ?? "Unbekannt",
          target: target ?? "Unbekannt",
        });
      }

      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach((v) => collectRelations(v));
        else if (typeof val === "object") collectRelations(val);
      }
    }

    collectRelations(model);

    const parsed = parseXmiFromString(xmlData);
    const idToName: Record<string, string> = {};

    function collectNames(node: any) {
      if (!node || typeof node !== "object") return;
      const id = node["xmi:id"] ?? node["id"];
      const name = node["name"];
      if (id && name) idToName[id] = name;

      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(collectNames);
        else if (typeof val === "object") collectNames(val);
      }
    }

    collectNames(model);

    const propertyToType: Record<string, string> = {};

    function collectTypeRefs(node: any) {
      if (!node || typeof node !== "object") return;
      if (
        node["xmi:type"] === "uml:Property" &&
        node["xmi:id"] &&
        node["type"]
      ) {
        propertyToType[node["xmi:id"]] = node["type"];
      }
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(collectTypeRefs);
        else if (typeof val === "object") collectTypeRefs(val);
      }
    }
    collectTypeRefs(model);

    const portToType: Record<string, string> = {};

    function collectPortRefs(node: any) {
      if (!node || typeof node !== "object") return;
      if (node["xmi:type"] === "uml:Port" && node["xmi:id"] && node["type"]) {
        portToType[node["xmi:id"]] = node["type"];
      }
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(collectPortRefs);
        else if (typeof val === "object") collectPortRefs(val);
      }
    }
    collectPortRefs(model);

    const connectorEndToRole: Record<string, string> = {};

    function collectConnectorEnds(node: any) {
      if (!node || typeof node !== "object") return;
      if (
        node["xmi:type"] === "uml:ConnectorEnd" &&
        node["xmi:id"] &&
        node["role"]
      ) {
        connectorEndToRole[node["xmi:id"]] = node["role"];
      }
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach(collectConnectorEnds);
        else if (typeof val === "object") collectConnectorEnds(val);
      }
    }
    collectConnectorEnds(model);

    const enrichedRelations = relations.map((r) => {
      let sourceResolved =
        connectorEndToRole[r.source] ||
        propertyToType[r.source] ||
        portToType[r.source] ||
        r.source;

      let targetResolved =
        connectorEndToRole[r.target] ||
        propertyToType[r.target] ||
        portToType[r.target] ||
        r.target;

      sourceResolved =
        propertyToType[sourceResolved] ||
        portToType[sourceResolved] ||
        sourceResolved;
      targetResolved =
        propertyToType[targetResolved] ||
        portToType[targetResolved] ||
        targetResolved;

      const sourceName =
        idToName[sourceResolved] ??
        idToName[r.source] ??
        r.source ??
        "Unbekannt";
      const targetName =
        idToName[targetResolved] ??
        idToName[r.target] ??
        r.target ??
        "Unbekannt";

      return { ...r, sourceName, targetName };
    });

    return NextResponse.json({ relations: enrichedRelations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
