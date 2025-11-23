import { readFileSync } from "fs";
import { parseDetailXmi } from "@/lib/parseDetailXmi";

export function GET() {
  const xmi = readFileSync("Praktikum3.xml", "utf-8");
  const parsed = parseDetailXmi(xmi);
  return Response.json(parsed);
}
