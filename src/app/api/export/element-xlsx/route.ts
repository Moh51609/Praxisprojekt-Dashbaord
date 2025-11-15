import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  // 🔥 Modell laden
  const apiUrl = new URL("/api/xmi", request.url);
  const res = await fetch(apiUrl);
  const model = await res.json();

  const elements = model.elements ?? [];
  const classStats = model.classStats ?? [];
  const metrics = model.metrics ?? {};

  // 🔹 Excel Workbook erstellen
  const workbook = new ExcelJS.Workbook();

  //
  // ======================================
  // SHEET 1 — ELEMENTE
  // ======================================
  //
  const sheet = workbook.addWorksheet("Elements");

  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Type", key: "type", width: 20 },
    { header: "Package", key: "package", width: 25 },
    { header: "Stereotype", key: "stereotype", width: 20 },
    { header: "Attributes", key: "attributes", width: 15 },
    { header: "Ports", key: "ports", width: 15 },
    { header: "Connectors", key: "connectors", width: 15 },
  ];

  elements.forEach((el: any) => {
    const stats = classStats.find((c: any) => c.className === el.name);

    sheet.addRow({
      name: el.name,
      type: el.type.replace("uml:", ""),
      package: el.packageName ?? "",
      stereotype: el.stereotype ?? "",
      attributes: stats?.attributes ?? 0,
      ports: stats?.ports ?? 0,
      connectors: stats?.connectors ?? 0,
    });
  });

  //
  // ======================================
  // SHEET 2 — METRICS
  // ======================================
  //
  const metricsSheet = workbook.addWorksheet("Metrics");

  metricsSheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 15 },
  ];

  const metricEntries = [
    ["Total Elements", metrics.totalElements ?? 0],
    ["Blocks", metrics.classes ?? 0],
    ["Ports", metrics.ports ?? 0],
    ["Properties", metrics.properties ?? 0],
    ["Packages", metrics.packages ?? 0],
    ["Connectors", metrics.connectors ?? 0],
    ["Diagrams", metrics.diagramsTotal ?? 0],
  ];

  metricEntries.forEach(([metric, value]) => {
    metricsSheet.addRow({ metric, value });
  });

  // 🔹 Datei erzeugen
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=elements.xlsx",
    },
  });
}
