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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Layers, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { ParsedModel } from "@/types/model";

export default function ElementTable({ data }: { data?: ParsedModel | null }) {
  const accent = useAccentColor();

  // 🔹 Filterstatus
  const [filterType, setFilterType] = useState("all");
  const [filterStereo, setFilterStereo] = useState("all");

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔹 Alle Typen und Stereotypen extrahieren
  const allTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (data?.elements ?? [])
            .map((e) => e.type.replace("uml:", ""))
            .filter(Boolean)
        )
      ),
    [data]
  );

  // 🔹 Gefilterte Elemente berechnen
  const filtered = useMemo(() => {
    return (data?.elements ?? []).filter((e) => {
      const matchType =
        filterType === "all" || e.type.replace("uml:", "") === filterType;
      const matchStereo =
        filterStereo === "all" || e.stereotype === filterStereo;
      return matchType && matchStereo;
    });
  }, [data, filterType, filterStereo]);

  // 🔹 Seitenlogik
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: accent }} />
          Elemente im Modell
        </h2>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />
          {/* Typ-Filter */}
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Typ filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {allTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 🔹 Tabelle */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Stereotyp</TableHead>
              <TableHead className="text-right">Attribute</TableHead>
              <TableHead className="text-right">Ports</TableHead>
              <TableHead className="text-right">Connectors</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((e, i) => {
                const stats = data?.classStats.find(
                  (c) => c.className === e.name
                );
                return (
                  <TableRow
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell className="font-medium text-gray-800 dark:text-gray-100">
                      {e.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {e.type.replace("uml:", "")}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {e.package || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {e.stereotype || "—"}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-300">
                      {stats?.attributes ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-300">
                      {stats?.ports ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-300">
                      {stats?.connectors ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-gray-500 dark:text-gray-300"
                >
                  Keine Elemente gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 🔹 Pagination */}
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
                currentPage === i + 1 ? { backgroundColor: accent } : undefined
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

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Zeigt alle Elemente des Modells mit Filter- und Paging-Optionen.
      </p>
    </section>
  );
}
