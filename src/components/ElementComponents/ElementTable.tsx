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
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

const ALLOWED_TYPES = [
  "Class",
  "Port",
  "Property",
  "Package",
  "Diagram",
  "Requirement",
  "Activity",
];

export default function ElementTable({ data }: { data: any[] }) {
  const accent = useAccentColor();
  const { language } = useLanguage();

  const elements = (data ?? []).filter((e) => {
    const clean = e.type.replace("uml:", "").replace("sysml:", "");
    return ALLOWED_TYPES.includes(clean);
  });

  const [filterType, setFilterType] = useState("all");
  const [filterStereo, setFilterStereo] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allTypes = useMemo(() => {
    return Array.from(
      new Set(
        elements
          .map((e) => e.type.replace("uml:", "").replace("sysml:", ""))
          .filter((t) => ALLOWED_TYPES.includes(t))
      )
    );
  }, [elements]);

  allTypes.sort((a, b) => (a === "Class" ? -1 : b === "Class" ? 1 : 0));

  const filtered = useMemo(() => {
    return elements.filter((e) => {
      const cleanType = e.type.replace("uml:", "").replace("sysml:", "");

      const matchType = filterType === "all" || cleanType === filterType;

      const matchStereo =
        filterStereo === "all" || e.stereotype === filterStereo;

      return matchType && matchStereo;
    });
  }, [elements, filterType, filterStereo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: accent }} />
          {translations[language].elementsInModel}{" "}
        </h2>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />

          {/* TYPE FILTER */}
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

      {/* TABLE */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
              currentItems.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{e.name}</TableCell>

                  <TableCell>
                    {e.type.replace("uml:", "").replace("sysml:", "")}
                  </TableCell>

                  <TableCell>{e.packagePath}</TableCell>

                  <TableCell>{e.stereotype || "—"}</TableCell>

                  <TableCell className="text-right">{e.attributes}</TableCell>
                  <TableCell className="text-right">{e.ports}</TableCell>
                  <TableCell className="text-right">{e.connectors}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Keine Elemente gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-2 border rounded-md disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {(() => {
            const pagesToShow = 5; // maximale Anzahl sichtbarer Buttons
            let start = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
            let end = start + pagesToShow - 1;

            if (end > totalPages) {
              end = totalPages;
              start = Math.max(1, end - pagesToShow + 1);
            }

            const pageButtons = [];

            // Zeige "..." wenn links abgeschnitten
            if (start > 1) {
              pageButtons.push(
                <button
                  key="start-ellipsis"
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md cursor-default"
                >
                  ...
                </button>
              );
            }

            for (let i = start; i <= end; i++) {
              pageButtons.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === i
                      ? "text-white"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                  style={
                    currentPage === i ? { backgroundColor: accent } : undefined
                  }
                >
                  {i}
                </button>
              );
            }

            // Zeige "..." wenn rechts abgeschnitten
            if (end < totalPages) {
              pageButtons.push(
                <button
                  key="end-ellipsis"
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md cursor-default"
                >
                  ...
                </button>
              );
            }

            return pageButtons;
          })()}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-2 border rounded-md disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
