import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "Praktikum3.xml");
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ XMI-Datei nicht gefunden unter ${filePath}`);
    }

    const xmlData = fs.readFileSync(filePath, "utf-8");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true,
    });

    // XMI → JSON
    const json = parser.parse(xmlData);
    const xmi = json["xmi:XMI"] ?? json["XMI"] ?? json;
    const model = xmi["uml:Model"] ?? xmi["Model"] ?? xmi;

    // Speicher für alles
    const elements: any[] = [];
    const diagramTypes: Record<string, number> = {};
    const relations: any[] = [];

    // ----------------------------------------------------
    // HILFSFUNKTIONEN: Attribute / Ports / Connectors zählen
    // ----------------------------------------------------

    function countProperties(node: any): number {
      if (!node || typeof node !== "object") return 0;
      let count = node["xmi:type"] === "uml:Property" ? 1 : 0;
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (typeof val === "object") {
          if (Array.isArray(val))
            val.forEach((v) => (count += countProperties(v)));
          else count += countProperties(val);
        }
      }
      return count;
    }

    function countPorts(node: any): number {
      if (!node || typeof node !== "object") return 0;
      let count = node["xmi:type"] === "uml:Port" ? 1 : 0;
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (typeof val === "object") {
          if (Array.isArray(val)) val.forEach((v) => (count += countPorts(v)));
          else count += countPorts(val);
        }
      }
      return count;
    }

    function countConnectors(node: any): number {
      if (!node || typeof node !== "object") return 0;
      let count = node["xmi:type"] === "uml:Connector" ? 1 : 0;
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (typeof val === "object") {
          if (Array.isArray(val))
            val.forEach((v) => (count += countConnectors(v)));
          else count += countConnectors(val);
        }
      }
      return count;
    }

    // ----------------------------------------------------
    // ELEMENTE SAMMELN
    // ----------------------------------------------------

    function collectElements(node: any, packagePath = "Root") {
      if (!node || typeof node !== "object") return;

      const type = node["xmi:type"] ?? node["type"];
      const id = node["xmi:id"] ?? node["id"];
      const name = node["name"] ?? "(Unbenannt)";
      const stereotype =
        node["stereotype"] ??
        node["appliedStereotype"] ??
        node["appliedStereotypeInstance"] ??
        "";

      const currentPath =
        type === "uml:Package" && name
          ? `${packagePath} › ${name}`
          : packagePath;

      const relevantTypes = [
        "uml:Class",
        "uml:Port",
        "uml:Property",
        "uml:Package",
        "uml:Connector",
        "uml:Association",
        "uml:Generalization",
        "uml:Dependency",
        "uml:Abstraction",
        "uml:Realization",
        "uml:UseCase",
        "uml:Activity",
        "uml:Diagram",
        "sysml:Block",
        "sysml:InternalBlock",
        "sysml:Requirement",
        "sysml:Parametric",
        "sysml:Constraint",
        "sysml:Satisfy",
        "sysml:Verify",
        "sysml:DeriveReqt",
      ];

      const isRelevant = type && relevantTypes.some((t) => type.includes(t));

      if (isRelevant) {
        const attributes = countProperties(node);
        const ports = countPorts(node);
        const connectors = countConnectors(node);

        elements.push({
          id,
          name,
          type,
          stereotype,
          packagePath: currentPath,
          attributes,
          ports,
          connectors,
        });

        // Diagrammtypen sammeln
        if (type.includes("Diagram")) {
          const cleanType =
            type.replace(/uml:|sysml:|Diagram/gi, "").trim() || "Unknown";
          diagramTypes[cleanType] = (diagramTypes[cleanType] ?? 0) + 1;
        }
      }

      // Rekursiv weitersuchen
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val))
          val.forEach((v) => collectElements(v, currentPath));
        else if (typeof val === "object") collectElements(val, currentPath);
      }
    }

    collectElements(model);

    // ----------------------------------------------------
    // RELATIONEN, WIE IM ORIGINALPARSER
    // ----------------------------------------------------

    function collectRelations(node: any) {
      if (!node || typeof node !== "object") return;

      const type = node["xmi:type"] ?? node["type"];

      const relationTypes = [
        "uml:Dependency",
        "uml:Abstraction",
        "uml:Association",
        "uml:Realization",
        "sysml:Satisfy",
        "sysml:Verify",
        "sysml:DeriveReqt",
        "sysml:Trace",
      ];

      if (type && relationTypes.includes(type)) {
        const id = node["xmi:id"] ?? node["id"];
        const name = node["name"] ?? "";

        const client = node["client"] ?? node["source"] ?? null;
        const supplier = node["supplier"] ?? node["target"] ?? null;
        const base =
          node["base_Abstraction"] ?? node["base_Dependency"] ?? null;

        const source = client ?? base ?? null;
        const target = supplier ?? null;

        relations.push({ id, name, type, source, target });
      }

      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach((v) => collectRelations(v));
        else if (typeof val === "object") collectRelations(val);
      }
    }

    collectRelations(model);

    // ----------------------------------------------------
    // AGGREGATION: TYPE COUNTS
    // ----------------------------------------------------

    const typeCounts: Record<string, number> = {};

    for (const el of elements) {
      const shortType = el.type.replace("uml:", "").replace("sysml:", "");
      typeCounts[shortType] = (typeCounts[shortType] ?? 0) + 1;
    }

    const typeCountsByPackage: Record<string, Record<string, number>> = {};

    for (const el of elements) {
      const pkg = el.packagePath || "Root";
      const type = el.type.replace("uml:", "").replace("sysml:", "");

      if (!typeCountsByPackage[pkg]) typeCountsByPackage[pkg] = {};
      typeCountsByPackage[pkg][type] =
        (typeCountsByPackage[pkg][type] ?? 0) + 1;
    }

    // ----------------------------------------------------
    // RETURN
    // ----------------------------------------------------

    return NextResponse.json({
      totalElements: elements.length,
      distinctTypes: Object.keys(typeCounts).length,
      packages: Object.keys(typeCountsByPackage).length,

      elements,
      typeCounts,
      typeCountsByPackage,
      diagramTypes,
      relations,
    });
  } catch (e: any) {
    console.error("❌ Fehler in /api/elements-xmi:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
