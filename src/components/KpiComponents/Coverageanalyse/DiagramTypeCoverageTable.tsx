"use client";

import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

export default function DiagramTypeCoverageTable({ data }: { data: any }) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const { language } = useLanguage();

  // 🔹 Typische SysML-Diagrammtypen
  const diagrams = data?.diagramList ?? [];

  // Die Zieltyp-Liste
  const diagramTypes = [
    "Block Definition Diagram",
    "Internal Block Diagram",
    "Use Case Diagram",
    "Requirement Diagram",
    "Parametric Diagram",
    "Activity Diagram",
    "Sequence Diagram",
    "State Machine Diagram",
    "Package Diagram",
    "Profile Diagram",
    "Deployment Diagram",
    "Component Diagram",
  ];

  // Mapping Ergebnis
  const diagramMap: Record<string, string[]> = {};

  // Hilfsfunktion
  function pushTo(map: any, key: string, value: string) {
    if (!map[key]) map[key] = [];
    map[key].push(value);
  }

  // ▶️ Erkennung über mdType
  diagrams.forEach((d: any) => {
    const type = d.mdType?.toLowerCase() ?? "";
    const name = d.name ?? "Unbenanntes Diagramm";

    if (type.includes("block definition"))
      pushTo(diagramMap, "Block Definition Diagram", name);
    if (type.includes("internal block"))
      pushTo(diagramMap, "Internal Block Diagram", name);
    if (type.includes("use case")) pushTo(diagramMap, "Use Case Diagram", name);
    if (type.includes("requirement"))
      pushTo(diagramMap, "Requirement Diagram", name);
    if (type.includes("parametric"))
      pushTo(diagramMap, "Parametric Diagram", name);
    if (type.includes("activity")) pushTo(diagramMap, "Activity Diagram", name);
    if (type.includes("sequence")) pushTo(diagramMap, "Sequence Diagram", name);
    if (type.includes("state"))
      pushTo(diagramMap, "State Machine Diagram", name);
    if (type.includes("package")) pushTo(diagramMap, "Package Diagram", name);
    if (type.includes("profile")) pushTo(diagramMap, "Profile Diagram", name);
    if (type.includes("deployment"))
      pushTo(diagramMap, "Deployment Diagram", name);
    if (type.includes("component"))
      pushTo(diagramMap, "Component Diagram", name);
  });

  const rows = diagramTypes.map((type) => ({
    type,
    count: diagramMap[type]?.length ?? 0,
    elements: diagramMap[type] ?? [],
  }));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Layers className="h-5 w-5" style={{ color: accent }} />
        {translations[language].diagramTypeInModel}
      </h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="w-48">
                {" "}
                {translations[language].diagramType}
              </TableHead>
              <TableHead className="text-center">
                {" "}
                {translations[language].available}
              </TableHead>
              <TableHead className="text-center">
                {" "}
                {translations[language].number}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.type}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <TableCell className="font-medium text-gray-800 dark:text-gray-100">
                  {row.type}
                </TableCell>
                <TableCell className="text-center">
                  {row.count > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      –
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.count > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-300 underline">
                            {row.count}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[260px]">
                          <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                            {row.elements.slice(0, 8).map((el, i) => (
                              <div key={i}>• {el}</div>
                            ))}
                            {row.elements.length > 8 && (
                              <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-1">
                                + {row.elements.length - 8} weitere …
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      0
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].diagramTypeInModelLegend}
      </p>
    </section>
  );
}
