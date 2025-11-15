// src/app/api/xmi/upload/route.ts
import { NextResponse } from "next/server";
import { parseXmiFromString } from "@/lib/xmi";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const text = await file.text();
    // optional: quick sanity meta, damit du siehst, dass geparst wurde
    const model = parseXmiFromString(text);
    return NextResponse.json({ ...model }); // garantiert JSON-Body
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Upload parse error" },
      { status: 500 }
    );
  }
}
