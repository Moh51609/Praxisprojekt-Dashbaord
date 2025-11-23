"use client";

import { useState, useMemo } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Filter, Layers, ChevronLeft, ChevronRight, Bug } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

interface SmellEntry {
  id: string;
  name: string;
  element: string;
  packagePath: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  category: string;
}

export default function SmellViolationTable({
  smells,
}: {
  smells: SmellEntry[];
}) {
  const accentColor = useAccentColor();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { language } = useLanguage();
  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;

  // 🔹 Filterung nach Kategorie
  const filteredSmells =
    selectedCategory === "all"
      ? smells
      : smells.filter((s) => s.category === selectedCategory);

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredSmells.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSmells.slice(startIdx, startIdx + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const categories = Array.from(new Set(smells.map((s) => s.category)));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Bug className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].smellTrendInModel}
        </h2>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedCategory}
            onValueChange={(v) => {
              setSelectedCategory(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Kategorie filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien anzeigen</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabelle */}
      <div className="flex flex-col h-[620px]">
        {/* Tabelle selbst: Scrollbar bei Bedarf */}
        <div className="flex-grow overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableHead>ID</TableHead>
                <TableHead>Smell</TableHead>
                <TableHead> {translations[language].element}</TableHead>
                <TableHead> {translations[language].packagePath}</TableHead>
                <TableHead> {translations[language].desc}</TableHead>
                <TableHead> {translations[language].category}</TableHead>
                <TableHead> {translations[language].severity}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((s, i) => (
                  <TableRow
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell>
                      <span
                        className="px-2 py-1 text-xs font-semibold rounded-md text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {s.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-800 dark:text-gray-100">
                      {s.name}
                    </TableCell>
                    <TableCell>{s.element}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {s.packagePath}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {s.description}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          s.category === "Structure"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : s.category === "Naming"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : s.category === "Traceability"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : s.category === "Redundancy"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : s.category === "Consistency"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {s.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          s.severity === "High"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : s.severity === "Medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {s.severity}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-gray-500 dark:text-gray-300"
                  >
                    Keine Model-Smells gefunden.
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
      </div>
    </section>
  );
}
