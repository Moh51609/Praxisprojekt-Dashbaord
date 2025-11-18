import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  const apiUrl = new URL("/api/xmi", request.url);
  const relUrl = new URL("/api/xmi-relations", request.url);
  const smellUrl = new URL("/api/model-smells", request.url);

  const [modelRes, relRes, smellRes] = await Promise.all([
    fetch(apiUrl),
    fetch(relUrl),
    fetch(smellUrl),
  ]);

  const data = await modelRes.json();
  const relations = (await relRes.json()).relations ?? [];
  const smells = (await smellRes.json()).smells ?? [];

  const workbook = new ExcelJS.Workbook();

  // Übersicht
  const sheet = workbook.addWorksheet("KPIs");
  sheet.columns = [
    { header: "KPI", key: "kpi", width: 30 },
    { header: "Value", key: "value", width: 20 },
  ];

  sheet.addRows([
    ["Model Health", data.modelHealth ?? "NA"],
    ["Accept Rules", data.ruleAcceptance ?? "NA"],
    ["Model Smells", smells.length],
    ["Avg Depth", data.avgDepth ?? "NA"],
    ["Connectivity", data.connectivity ?? "NA"],
    ["Coverage", data.coverage ?? "NA"],
  ]);

  // Depth Übersicht
  const depthSheet = workbook.addWorksheet("Depth");
  depthSheet.columns = [
    { header: "Element", key: "el", width: 30 },
    { header: "Depth", key: "depth", width: 10 },
  ];
  data.elements.forEach((e: any) => {
    depthSheet.addRow({ el: e.name, depth: e.depth ?? 0 });
  });

  // Relations Heatmap
  const intSheet = workbook.addWorksheet("RelationsIntensity");
  intSheet.columns = [
    { header: "Element", key: "el", width: 30 },
    { header: "Total Relations", key: "total", width: 20 },
  ];

  const intensity: Record<string, number> = {};
  relations.forEach((r: any) => {
    const s = r.sourceName || r.source;
    const t = r.targetName || r.target;
    intensity[s] = (intensity[s] ?? 0) + 1;
    intensity[t] = (intensity[t] ?? 0) + 1;
  });

  Object.entries(intensity).forEach(([el, total]) =>
    intSheet.addRow({ el, total })
  );

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=kpis.xlsx",
    },
  });
}
