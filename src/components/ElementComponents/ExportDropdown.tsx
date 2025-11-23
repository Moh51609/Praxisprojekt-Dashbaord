"use client";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Download, FileSpreadsheet, FileDown } from "lucide-react";
import { useState } from "react";
import { ParsedModel } from "@/types/model";

export default function ExportDropdown({ data }: { data: ParsedModel }) {
  const [open, setOpen] = useState(false);
  const accentColor = useAccentColor();

  const downloadCsv = () => {
    const metrics = data.metrics ?? {};
    const classStats = data.classStats ?? [];
    const elements = data.elements ?? [];

    let csv = "Name,Type,Package,Stereotype,Attributes,Ports,Connectors\n";

    elements.forEach((e: any) => {
      const stats = classStats.find((c: any) => c.className === e.name);

      csv +=
        [
          e.name,
          e.type.replace("uml:", ""),
          e.packageName ?? "",
          e.stereotype ?? "",
          stats?.attributes ?? 0,
          stats?.ports ?? 0,
          stats?.connectors ?? 0,
        ].join(",") + "\n";
    });

    // Metrics anhängen
    csv += "\n\n### MODEL METRICS ###\n";
    csv += `Blocks, ${metrics.classes ?? 0}\n`;
    csv += `Ports, ${metrics.ports ?? 0}\n`;
    csv += `Properties, ${metrics.properties ?? 0}\n`;
    csv += `Packages, ${metrics.packages ?? 0}\n`;
    csv += `Connectors, ${metrics.connectors ?? 0}\n`;
    csv += `Diagrams, ${metrics.diagramsTotal ?? 0}\n`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "elements_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative z-200" style={{ accentColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg 
        bg-gray-800 text-gray-100 hover:bg-gray-700 transition shadow z-50"
      >
        <Download className="h-4 w-4" />
        Exportieren
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg 
          bg-gray-800 text-gray-200 border border-gray-700"
        >
          <button
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              downloadCsv();
              setOpen(false);
            }}
          >
            <FileDown className="h-4 w-4" /> Export als CSV
          </button>

          <button
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              window.location.href = "/api/export/element-xlsx";
              setOpen(false);
            }}
          >
            <FileSpreadsheet className="h-4 w-4" /> Export als Excel
          </button>
        </div>
      )}
    </div>
  );
}
