"use client";
import { useState } from "react";
import { Download, FileDown, FileSpreadsheet } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";

export default function KpiExportDropdown({ data, relations, smells }: any) {
  const [open, setOpen] = useState(false);
  const accent = useAccentColor();

  const downloadCsv = () => {
    let csv = "";

    csv += "=== KPI Übersicht ===\n";
    csv += `Model Health;${data?.modelHealth ?? "NA"}\n`;
    csv += `Accept Rules;${data?.ruleAcceptance ?? "NA"}\n`;
    csv += `Model Smells;${smells?.length ?? 0}\n`;
    csv += `Avg Depth;${data?.avgDepth ?? "NA"}\n`;
    csv += `Connectivity;${data?.connectivity ?? "NA"}\n`;
    csv += `Coverage;${data?.coverage ?? "NA"}\n\n`;

    csv += "=== Strukturmetriken ===\n";
    csv += "Element;Depth\n";
    data?.elements?.forEach((e: any) => {
      csv += `${e.name};${e.depth ?? 0}\n`;
    });

    csv += "\n=== Relations Intensity ===\n";
    csv += "Element;TotalRelations\n";
    const intensity: Record<string, number> = {};
    relations.forEach((r: any) => {
      const s = r.sourceName || r.source;
      const t = r.targetName || r.target;
      intensity[s] = (intensity[s] ?? 0) + 1;
      intensity[t] = (intensity[t] ?? 0) + 1;
    });
    Object.entries(intensity).forEach(([el, count]) => {
      csv += `${el};${count}\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kpis_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg 
          dark:bg-gray-800 dark:text-gray-100  dark:hover:bg-gray-700 bg-white text-gray-800 hover:bg-gray-100  transition shadow"
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
              window.location.href = "/api/export/kpi-xlsx";
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
