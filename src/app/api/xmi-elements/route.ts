import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

export async function GET() {
  try {
    // 🔹 Pfad zur XMI-Datei
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

    // 🔹 XML → JSON
    const json = parser.parse(xmlData);
    const xmi = json["xmi:XMI"] ?? json["XMI"] ?? json;
    const model = xmi["uml:Model"] ?? xmi["Model"] ?? xmi;

    // === Sammler ===
    const elements: any[] = [];
    const diagramTypes: Record<string, number> = {};

    /**
     * 🔍 Rekursive Traversierung durch das gesamte Modell
     */
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
        node["xmi:type"] === "uml:Package" && name
          ? `${packagePath} › ${name}`
          : packagePath;

      // 🔹 Nur relevante UML-/SysML-Typen aufnehmen
      const isRelevant =
        type &&
        [
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
        ].some((t) => type.includes(t));

      if (isRelevant) {
        elements.push({
          id,
          name,
          type,
          stereotype,
          packagePath: currentPath,
        });

        // 🔸 Diagrammtypen mitzählen
        if (type.includes("Diagram")) {
          const cleanType =
            type.replace(/uml:|sysml:|Diagram/gi, "").trim() || "Unknown";
          diagramTypes[cleanType] = (diagramTypes[cleanType] ?? 0) + 1;
        }
      }

      // 🔁 Rekursiv tiefer in verschachtelte Strukturen gehen
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val))
          val.forEach((v) => collectElements(v, currentPath));
        else if (typeof val === "object") collectElements(val, currentPath);
      }
    }

    // Startpunkt: gesamtes UML-Modell
    collectElements(model);

    // === Aggregation: Typen pro Package ===
    const typeCountsByPackage: Record<string, Record<string, number>> = {};
    for (const el of elements) {
      const pkg = el.packagePath || "Root";
      const shortType = el.type.replace("uml:", "").replace("sysml:", "");

      if (!typeCountsByPackage[pkg]) typeCountsByPackage[pkg] = {};
      typeCountsByPackage[pkg][shortType] =
        (typeCountsByPackage[pkg][shortType] ?? 0) + 1;
    }

    // === Gesamttypen zählen ===
    const typeCounts: Record<string, number> = {};
    for (const el of elements) {
      const shortType = el.type.replace("uml:", "").replace("sysml:", "");
      typeCounts[shortType] = (typeCounts[shortType] ?? 0) + 1;
    }

    // === Beziehungen (Relations) sammeln ===
    // === Beziehungen (Relations) direkt aus der XML-Struktur extrahieren ===
    // === Beziehungen (Relations) direkt aus der XML-Struktur extrahieren ===
    const relations: any[] = [];

    function collectRelations(node: any) {
      if (!node || typeof node !== "object") return;

      const type = node["xmi:type"] ?? node["type"];
      if (
        type &&
        [
          "uml:Dependency",
          "uml:Abstraction",
          "uml:Association",
          "uml:Realization",
          "sysml:Satisfy",
          "sysml:Verify",
          "sysml:DeriveReqt",
          "sysml:Trace",
        ].includes(type)
      ) {
        const id = node["xmi:id"] ?? node["id"];
        const name = node["name"] ?? "";
        const client = node["client"] ?? node["source"] ?? null;
        const supplier = node["supplier"] ?? node["target"] ?? null;
        const base =
          node["base_Abstraction"] ?? node["base_Dependency"] ?? null;

        // Versuch, Endpunkte zu identifizieren
        const source = client ?? base ?? null;
        const target = supplier ?? null;

        relations.push({
          id,
          name,
          type,
          source,
          target,
        });
      }

      // Rekursiv weiterlaufen
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (Array.isArray(val)) val.forEach((v) => collectRelations(v));
        else if (typeof val === "object") collectRelations(val);
      }
    }

    // 🚀 Sammle alle Relationen im gesamten Modell
    collectRelations(model);

    // === Antwort zurückgeben ===
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
