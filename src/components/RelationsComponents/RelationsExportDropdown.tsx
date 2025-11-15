"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileDown } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";

export default function RelationsExportDropdown({
  relations,
}: {
  relations: any[];
}) {
  const [open, setOpen] = useState(false);
  const accentColor = useAccentColor();

  // 🔥 CSV Export
  const downloadCsv = () => {
    if (!relations?.length) return;

    let csv = "Source,Target,Type,CleanType\n";

    relations.forEach((r) => {
      const cleanType = r.type?.replace(/^uml:|^sysml:/, "") ?? "Unknown";

      csv += [r.source, r.target, r.type, cleanType].join(",") + "\n";
    });

    // KPI + Metrics hinzufügen
    const typeCounts = relations.reduce((acc: any, r: any) => {
      const t = r.type?.replace(/^uml:|^sysml:/, "") ?? "Unknown";
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

    csv += "\n### RELATION METRICS ###\n";
    csv += `Total Relations, ${relations.length}\n`;

    Object.entries(typeCounts).forEach(([t, c]: any) => {
      csv += `${t}, ${c}\n`;
    });

    csv += `Covered Types, ${Object.keys(typeCounts).length}\n`;

    // Datei erzeugen
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relations_export.csv";
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

      {/* Dropdown  */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg 
        bg-gray-800 text-gray-200 border border-gray-700"
        >
          {/* CSV Export */}
          <button
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              downloadCsv();
              setOpen(false);
            }}
          >
            <FileDown className="h-4 w-4" /> Export als CSV
          </button>

          {/* Excel Export */}
          <button
            className="flex w-full items-center gap-2 px-4 py-2 hover:bg-gray-700"
            onClick={() => {
              window.location.href = "/api/export/relation-xlsx";
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
