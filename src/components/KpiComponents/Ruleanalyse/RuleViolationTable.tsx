"use client";

import { useState, useMemo } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filter, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ViolationEntry {
  id: string;
  element: string;
  description: string;
  packagePath: string;
  severity: "Low" | "Medium" | "High";
}

// 🔹 Rekursive Extraktion aller Elemente aus Packages
function flattenElements(packages: any[], parentPath = ""): any[] {
  let all: any[] = [];
  for (const pkg of packages) {
    const currentPath = parentPath ? `${parentPath} › ${pkg.name}` : pkg.name;
    if (pkg.elements) {
      all.push(
        ...pkg.elements.map((el: any) => ({
          ...el,
          packagePath: currentPath,
        }))
      );
    }
    if (pkg.packages) {
      all.push(...flattenElements(pkg.packages, currentPath));
    }
  }
  return all;
}

export default function RuleViolationTable({
  rules,
  data,
  relations,
}: {
  rules: any[];
  data: any;
  relations: any[];
}) {
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  const [selectedRule, setSelectedRule] = useState("all");

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  // 🔹 Gesamtliste aller Elemente inkl. Packages
  const allElements = useMemo(() => {
    const root =
      data.elements?.map((e: any) => ({
        ...e,
        packagePath: e.package ?? "Root",
      })) ?? [];
    const pkgElements = flattenElements(data.packages ?? []);
    return [...root, ...pkgElements];
  }, [data]);

  // 🔹 Relation IDs für R5 & R6
  const relatedIds = new Set(
    relations?.flatMap((r) => [r.source, r.target]) ?? []
  );

  // 🔹 Alle Verstöße präzise bestimmen
  const allViolations: ViolationEntry[] = useMemo(() => {
    const violations: ViolationEntry[] = [];

    for (const el of allElements) {
      const pkg = el.packagePath ?? "—";

      // ✅ R1 – Block ohne Ports
      if (el.type?.includes("Block") && (!el.ports || el.ports.length === 0)) {
        violations.push({
          id: "R1",
          element: el.name ?? "(Unbenannt)",
          packagePath: pkg,
          description:
            "Block ohne Ports – jeder Block sollte Schnittstellen besitzen.",
          severity: "Medium",
        });
      }

      // ✅ R3 – Unbenannte Elemente
      if (!el.name || el.name.trim() === "") {
        violations.push({
          id: "R3",
          element: "(Unbenannt)",
          packagePath: pkg,
          description: "Element ist unbenannt.",
          severity: "Low",
        });
      }

      // ✅ R4 – Ungültige Namenskonvention
      if (el.name && !/^[A-Z][a-zA-Z0-9]*$/.test(el.name)) {
        violations.push({
          id: "R4",
          element: el.name,
          packagePath: pkg,
          description: "Elementname entspricht nicht CamelCase.",
          severity: "Low",
        });
      }

      // ✅ R5 – Isolierte Elemente
      if (!relatedIds.has(el.id)) {
        violations.push({
          id: "R5",
          element: el.name ?? "(Unbenannt)",
          packagePath: pkg,
          description: "Element ist isoliert – keine Beziehungen vorhanden.",
          severity: "High",
        });
      }

      // ✅ R7 – Requirement ohne Satisfy
      if (
        el.type?.includes("Requirement") &&
        !relations.some(
          (r) =>
            r.type?.includes("Satisfy") &&
            (r.source === el.id || r.target === el.id)
        )
      ) {
        violations.push({
          id: "R7",
          element: el.name ?? "(Unbenannt)",
          packagePath: pkg,
          description:
            "Requirement wird durch kein Modell-Element erfüllt (fehlende Satisfy-Beziehung).",
          severity: "High",
        });
      }
    }

    // ✅ R2 – Leere Packages
    const emptyPkgs =
      data.packages?.filter(
        (p: any) =>
          (!p.elements || p.elements.length === 0) &&
          (!p.packages || p.packages.length === 0)
      ) ?? [];
    emptyPkgs.forEach((p: any) =>
      violations.push({
        id: "R2",
        element: p.name ?? "(Unbenanntes Package)",
        packagePath: "—",
        description: "Leeres Package ohne Inhalte.",
        severity: "Medium",
      })
    );

    // ✅ R6 – Ungültige Connector-Enden
    const invalidConnectors = Array.isArray(relations)
      ? relations.filter((r) => !r.source || !r.target)
      : [];
    invalidConnectors.forEach((r) =>
      violations.push({
        id: "R6",
        element: r.id ?? "(Connector)",
        packagePath: "—",
        description: "Ungültiger Connector – Enden fehlen.",
        severity: "High",
      })
    );

    return violations;
  }, [allElements, relations, data]);

  const filteredViolations =
    selectedRule === "all"
      ? allViolations
      : allViolations.filter((v) => v.id === selectedRule);

  // 🔹 Pagination Berechnung
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredViolations.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <section className="bg-white dark:bg-gray-800  rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Layers className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].ruleViolations}
        </h2>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedRule}
            onValueChange={(v) => {
              setSelectedRule(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Regel filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {translations[language].showAllRules}
              </SelectItem>
              {rules.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id} – {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead>{translations[language].rule}</TableHead>
              <TableHead>{translations[language].element}</TableHead>
              <TableHead>{translations[language].packagePath}</TableHead>
              <TableHead>{translations[language].desc}</TableHead>
              <TableHead>{translations[language].severity}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((v, i) => (
                <TableRow
                  key={i}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell>
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-md"
                      style={{ backgroundColor: accentColor, color: "white" }}
                    >
                      {v.id}
                    </span>
                  </TableCell>
                  <TableCell>{v.element}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {v.packagePath}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                    {v.description}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        v.severity === "High"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : v.severity === "Medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {v.severity}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500 dark:text-gray-300"
                >
                  Keine Regelverstöße gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === i + 1
                  ? "bg-[var(--accent-color)] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              style={
                currentPage === i + 1
                  ? { backgroundColor: accentColor }
                  : undefined
              }
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
