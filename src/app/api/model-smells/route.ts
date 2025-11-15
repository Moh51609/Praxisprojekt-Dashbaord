import { NextResponse } from "next/server";
import { parseXmiFromFile } from "@/lib/xmi";
import { evaluateModelSmellsPure } from "@/lib/modelSmells";

export async function GET() {
  try {
    const model = parseXmiFromFile("public/Praktikum3.xml");
    const smells = evaluateModelSmellsPure(model, model.relationships);

    return NextResponse.json({ smells });
  } catch (error: any) {
    console.error("❌ Fehler in /api/model-smells:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
