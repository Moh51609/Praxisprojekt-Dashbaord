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

  // 🔹 Typische SysML-Diagrammtypen
  const diagramTypes = [
    "UseCase",
    "BDD",
    "IBD",
    "Requirement",
    "Parametric",
    "Activity",
    "Sequence",
    "StateMachine",
    "Package",
    "Constraint",
    "Deployment", // Hardware- / Systembereitstellung
    "Component", // Komponentendiagramme

    "Interaction", // Interaktionsübersichten
    "Profile",
  ];

  const { language } = useLanguage();
  // 🔹 Zuordnung: Diagrammtyp → enthaltene Elemente
  const diagramMap: Record<string, string[]> = {};

  (data?.elements ?? []).forEach((el: any) => {
    const type = el.type?.toLowerCase() ?? "";
    const name = el.name || "(Unbenannt)";
    const pkg = el.packageName || el.package || "Unbekannt";
    const location = `${name} (${pkg})`;

    // Flexible Erkennung aller Diagrammtypen
    if (type.match(/(use[\s_-]*case|ucd)/i))
      pushTo(diagramMap, "UseCase", location);
    if (type.match(/(block[\s_-]*definition|bdd|sysmlblock)/i))
      pushTo(diagramMap, "BDD", location);
    if (type.match(/(internal[\s_-]*block|ibd|sysmlinternal)/i))
      pushTo(diagramMap, "IBD", location);
    if (type.match(/(requirement|anforderung)/i))
      pushTo(diagramMap, "Requirement", location);
    if (type.match(/(parametric|constraint|parameterdiagramm)/i))
      pushTo(diagramMap, "Parametric", location);
    if (type.match(/(activity|aktion|flow)/i))
      pushTo(diagramMap, "Activity", location);
    if (type.match(/(sequence|interaktion)/i))
      pushTo(diagramMap, "Sequence", location);
    if (type.match(/(state|zustand|statemachine)/i))
      pushTo(diagramMap, "StateMachine", location);
    if (type.match(/(package|pkg)/i)) pushTo(diagramMap, "Package", location);
    if (type.match(/(constraint|regel|parametric)/i))
      pushTo(diagramMap, "Constraint", location);
    if (type.match(/(deployment|bereitstellung)/i))
      pushTo(diagramMap, "Deployment", location);
    if (type.match(/(component|komponente)/i))
      pushTo(diagramMap, "Component", location);
    if (type.match(/(communication|kommunikation)/i))
      pushTo(diagramMap, "Communication", location);
    if (type.match(/(timing|zeitdiagramm)/i))
      pushTo(diagramMap, "Timing", location);
    if (type.match(/(interaction|interaktionsübersicht)/i))
      pushTo(diagramMap, "Interaction", location);
    if (type.match(/(profile|stereotype)/i))
      pushTo(diagramMap, "Profile", location);
  });

  // Hilfsfunktion: Element zur Liste hinzufügen
  function pushTo(map: Record<string, string[]>, key: string, val: string) {
    if (!map[key]) map[key] = [];
    if (!map[key].includes(val)) map[key].push(val);
  }

  // 🔹 Vorbereitung der Tabellenzeilen
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
