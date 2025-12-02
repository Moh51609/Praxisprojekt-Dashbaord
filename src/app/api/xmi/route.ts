import { NextResponse } from "next/server";
import { parseXmiFromFile } from "@/lib/xmi";

export async function GET() {
  try {
    const root = process.cwd();

    const model = parseXmiFromFile(`${root}/public/Praktikum3.xml`);
    return NextResponse.json(model);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Parse error" },
      { status: 500 }
    );
  }
}
