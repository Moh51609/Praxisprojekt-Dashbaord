import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  // 🔥 1. Beziehungen laden
  const apiUrl = new URL("/api/xmi-relations", request.url);
  const res = await fetch(apiUrl);
  const model = await res.json();

  const relations = model.relations ?? [];

  // ============================================
  //  HEATMAP / INTENSITY – gleiche Logik wie UI
  // ============================================
  const intensity: Record<string, number> = {};

  relations.forEach((r: any) => {
    const source = r.sourceName || r.source || "Unknown";

    const target = r.targetName || r.target || "Unknown";

    intensity[source] = (intensity[source] ?? 0) + 1;
    intensity[target] = (intensity[target] ?? 0) + 1;
  });

  // ============================================
  //  RELATION TYPE COUNTS
  // ============================================
  const typeCounts: Record<string, number> = {};

  relations.forEach((r: any) => {
    const type = r.type?.replace(/^uml:|^sysml:/, "") ?? "Unknown";
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
  });

  // ============================================
  //  EXCEL WORKBOOK
  // ============================================
  const workbook = new ExcelJS.Workbook();

  //
  // SHEET 1 — RELATIONS LIST
  //
  const sheet = workbook.addWorksheet("Relations");

  sheet.columns = [
    { header: "Source", key: "source", width: 30 },
    { header: "Target", key: "target", width: 30 },
    { header: "Relation Type", key: "type", width: 25 },
    { header: "Clean Type", key: "clean", width: 25 },
  ];

  relations.forEach((r: any) => {
    const cleanType = r.type?.replace(/^uml:|^sysml:/, "") ?? "Unknown";

    sheet.addRow({
      source: r.source,
      target: r.target,
      type: r.type,
      clean: cleanType,
    });
  });

  //
  // SHEET 2 — METRICS
  //
  const metricsSheet = workbook.addWorksheet("Metrics");

  metricsSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 15 },
  ];

  metricsSheet.addRow({ metric: "Total Relations", value: relations.length });

  Object.entries(typeCounts).forEach(([type, count]) => {
    metricsSheet.addRow({ metric: type, value: count });
  });

  metricsSheet.addRow({
    metric: "Covered Relation Types",
    value: Object.keys(typeCounts).length,
  });

  //
  // SHEET 3 — INTENSITY (Heatmap identisch)
  //
  const degreeSheet = workbook.addWorksheet("Intensity");

  degreeSheet.columns = [
    { header: "Element", key: "el", width: 30 },
    { header: "Total Relations", key: "total", width: 20 },
  ];

  Object.entries(intensity).forEach(([el, total]) => {
    degreeSheet.addRow({ el, total });
  });

  //
  // DOWNLOAD
  //
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=relations.xlsx",
    },
  });
}
