import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Elements");

  sheet.columns = [
    { header: "Name", key: "name" },
    { header: "Type", key: "type" },
    { header: "Package", key: "package" },
    { header: "Stereotype", key: "stereotype" },
    { header: "Attributes", key: "attributes" },
    { header: "Ports", key: "ports" },
    { header: "Connectors", key: "connectors" },
  ];

  const res = await fetch(`${process.env.APP_URL}/api/xmi-elements`);
  const data = await res.json();

  data.elements.forEach((el: any) => {
    sheet.addRow({
      name: el.name,
      type: el.type,
      package: el.packageName ?? "",
      stereotype: el.stereotype ?? "",
      attributes: el.attributes?.length ?? 0,
      ports: el.ports?.length ?? 0,
      connectors: el.connectors?.length ?? 0,
    });
  });

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
