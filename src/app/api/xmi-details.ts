import { readFileSync } from "fs";
import { parseXmiFromString } from "@/lib/xmi";

export function GET() {
  const xmi = readFileSync("Praktikum3.xml", "utf-8");
  const parsed = parseXmiFromString(xmi);
  return Response.json(parsed);
}
