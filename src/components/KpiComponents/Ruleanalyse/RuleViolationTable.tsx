"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

interface ViolationEntry {
  id: string;
  element: string;
  description: string;
  packagePath: string;
  severity: "Low" | "Medium" | "High";
}

export default function RuleViolationTable({ rules }: { rules: any[] }) {
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  const [selectedRule, setSelectedRule] = useState("all");
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  const allViolations: ViolationEntry[] = useMemo(() => {
    if (!Array.isArray(rules)) return [];

    const result: ViolationEntry[] = [];

    for (const rule of rules) {
      if (Array.isArray(rule.violatingElements)) {
        for (const el of rule.violatingElements) {
          result.push({
            id: rule.id,
            element: el.name ?? "—",
            packagePath: el.packagePath ?? "—",
            description: rule.description,
            severity:
              rule.violatingElements.length > 5
                ? "High"
                : rule.violatingElements.length > 1
                ? "Medium"
                : "Low",
          });
        }
      }
    }

    return result;
  }, [rules]);

  // 🔹 Filter
  const filteredViolations =
    selectedRule === "all"
      ? allViolations
      : allViolations.filter((v) => v.id === selectedRule);

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredViolations.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[650px] items-center flex justify-center flex-col shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
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
                  {translations[language].noRuleBreak}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
