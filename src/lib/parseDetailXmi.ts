import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

export async function GET() {
  const xml = readFileSync("public/model.xmi", "utf8");
  const json = parser.parse(xml);

  const xmi = json["xmi:XMI"] ?? json["XMI"];
  const model = xmi["uml:Model"] ?? xmi["Model"];

  const elements: any[] = [];
  const relationRefs: { source: string; target: string }[] = [];

  function walk(node: any) {
    if (!node || typeof node !== "object") return;

    const type = node["xmi:type"];
    const id = node["xmi:id"];
    const name = node["name"];

    // 🔹 Klassen sammeln
    if (type === "uml:Class") {
      const attributes = [];
      const ports = [];

      // Attribute extrahieren
      const ownedAttr = node.ownedAttribute ?? [];
      for (const a of Array.isArray(ownedAttr) ? ownedAttr : [ownedAttr]) {
        if (!a || typeof a !== "object") continue;

        if (a["xmi:type"] === "uml:Property") {
          attributes.push({
            id: a["xmi:id"],
            name: a["name"] ?? "",
            type: a["type"] ?? "",
            default: a["defaultValue"]?.value ?? "",
          });
        }

        if (a["xmi:type"] === "uml:Port") {
          ports.push({
            id: a["xmi:id"],
            name: a["name"] ?? "",
            type: a["type"] ?? "",
            direction: a["direction"] ?? "inout",
          });
        }
      }

      elements.push({
        id,
        name,
        type,
        attributes,
        ports,
        incoming: [],
        outgoing: [],
      });
    }

    // 🔹 Relationen merken → incoming/outgoing später füllen
    if (type === "uml:Association" || type === "uml:Generalization") {
      const endA = node?.ownedEnd?.[0]?.type;
      const endB = node?.ownedEnd?.[1]?.type;

      if (endA && endB) {
        relationRefs.push({
          source: endA,
          target: endB,
        });
      }
    }

    // rekursiv
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (typeof child === "object") walk(child);
    }
  }

  walk(model);

  // 🔹 incoming / outgoing füllen
  for (const rel of relationRefs) {
    const src = elements.find((e) => e.id === rel.source);
    const tgt = elements.find((e) => e.id === rel.target);
    if (src && tgt) {
      src.outgoing.push(tgt.id);
      tgt.incoming.push(src.id);
    }
  }

  return NextResponse.json({ elements });
}
