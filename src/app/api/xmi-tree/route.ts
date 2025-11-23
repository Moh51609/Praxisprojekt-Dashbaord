import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";

interface TreeNodeType {
  id: string;
  name: string;
  type: string;
  children: TreeNodeType[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
});

// Hilfsfunktion
function asArray(v: any) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

function buildTree(node: any): TreeNodeType {
  const children = asArray(node.packagedElement);

  return {
    id: node["xmi:id"],
    name: node.name ?? "(Unbenannt)",
    type: node["xmi:type"],
    children: children
      .filter(
        (c) => c["xmi:type"] === "uml:Package" || c["xmi:type"] === "uml:Class"
      )
      .map((c) => buildTree(c)),
  };
}

export async function GET() {
  try {
    // 🔥 Datei aus public/ lesen (SERVER-SEITE)
    const xmlPath = process.cwd() + "/public/Klausurvorbereitung.xml";
    const xml = readFileSync(xmlPath, "utf-8");

    const json = parser.parse(xml);
    const xmi = json["xmi:XMI"] ?? json.XMI ?? json;
    const model = xmi["uml:Model"];

    if (!model) {
      return NextResponse.json({ tree: null, error: "Model not found" });
    }

    const rootPackages = asArray(model.packagedElement).filter(
      (p) => p["xmi:type"] === "uml:Package"
    );

    if (rootPackages.length === 0) {
      return NextResponse.json({ tree: null, error: "No packages found" });
    }

    const tree = rootPackages.map((p) => buildTree(p));

    return NextResponse.json({ tree });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
