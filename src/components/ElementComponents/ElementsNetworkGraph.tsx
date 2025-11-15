"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Treemap } from "recharts";
import { TreeDeciduous } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function ElementsTreeDiagram({ elements }: { elements: any[] }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const chartBackground = useChartBackground();
  const chartZoom = useChartZoom();
  const { language } = useLanguage();

  // Hilfsfunktion: erzeuge das hierarchische D3-Modell
  function buildHierarchy() {
    const nested = d3.group(
      elements,
      (d) => d.package,
      (d) => d.type.replace("uml:", "").replace("sysml:", "")
    );

    const allPackages = Array.from(nested, ([pkg, types]) => ({
      name: pkg,
      children: Array.from(types, ([type, list]) => ({
        name: type,
        children: list.map((el) => ({ name: el.name })),
      })),
    }));

    // 🔹 Pagination anwenden
    const visiblePackages = allPackages.slice(
      page * pageSize,
      (page + 1) * pageSize
    );

    return d3.hierarchy({
      name: "Model",
      children: visiblePackages,
    });
  }

  useEffect(() => {
    if (!elements?.length || !ref.current) return;

    // SVG-Breite = Container-Breite
    const containerWidth = ref.current.parentElement?.clientWidth || 800;
    const width = Math.min(containerWidth - 60, 1200); // begrenze auf max 1200px
    const dx = 22;
    const dy = 160;

    // 🧩 Hierarchie vorbereiten
    const nested = d3.group(
      elements,
      (d) => d.package,
      (d) => d.type.replace("uml:", "").replace("sysml:", "")
    );

    const allPackages = Array.from(nested, ([pkg, types]) => ({
      name: pkg,
      children: Array.from(types, ([type, list]) => ({
        name: type,
        children: list.map((el) => ({ name: el.name })),
      })),
    }));

    const visiblePackages = allPackages.slice(
      page * pageSize,
      (page + 1) * pageSize
    );

    const root = d3
      .hierarchy({
        name: "Model",
        children: visiblePackages,
      } as any)
      .sum((d) => (d.children ? 0 : 1));

    // 📏 Dynamisches Layout
    const tree = d3.tree<any>().nodeSize([dx, dy]);
    const rootLayout = tree(root);

    let x0 = Infinity;
    let x1 = -x0;
    rootLayout.each((d: any) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const height = x1 - x0 + dx * 2;

    // 🧼 Reset
    d3.select(ref.current).selectAll("*").remove();

    // 📊 SVG
    const svg = d3
      .select(ref.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(50,${dx - x0})`);

    // 🔍 Zoom-Container nur aktiv, wenn erlaubt
    if (chartZoom) {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3]) // 🔹 Min/Max Zoomstufe
        .on("zoom", (event) => {
          svg.attr("transform", event.transform); // 🔹 Zoom + Pan anwenden
        });

      d3.select(ref.current).call(zoom as any);
    } else {
      // ❌ Wenn Zoom deaktiviert ist, setze alles zurück
      d3.select(ref.current).on(".zoom", null);
    }

    // 🔹 Links
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#d1d5db")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 1.3)
      .selectAll("path")
      .data(rootLayout.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x) as any
      );

    // 🔹 Knoten
    svg
      .append("g")
      .selectAll("circle")
      .data(rootLayout.descendants())
      .join("circle")
      .attr("cx", (d: any) => d.y)
      .attr("cy", (d: any) => d.x)
      .attr("r", (d) => (d.children ? 4 : 5))
      .attr("fill", (d) => (d.children ? "#4f46e5" : "#10b981"))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    // 🔹 Labels
    svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 11)
      .selectAll("text")
      .data(rootLayout.descendants())
      .join("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? d.y - 8 : d.y + 8))
      .attr("y", (d) => d.x)
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .text((d: any) => d.data.name)
      .attr("fill", textColor);
  }, [elements, page]);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center   dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4 text-center">
          {translations[language].loadChart}.
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl dark:bg-gray-800 shadow-sm p-6 mt-6">
      <div className="flex flex-row justify-between">
        <h2 className="text-lg font-semibold mb-4">
          {translations[language].systemStructure}
        </h2>
        <TreeDeciduous className="h-6 w-6 " style={{ color: accentColor }} />
      </div>

      <svg ref={ref}></svg>

      {/* 🔹 Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 dark:text-black dark:bg-gray-400 dark:hover:bg-gray-200"
        >
          {translations[language].prev}
        </button>

        <span className="text-sm text-gray-600 dark:text-white">
          {translations[language].page} {page + 1}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={
            (page + 1) * pageSize >=
            new Set(elements.map((e) => e.package)).size
          }
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 dark:text-black dark:bg-gray-400 dark:hover:bg-gray-200"
        >
          {translations[language].next}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3 dark:text-white">
        {translations[language].systemStructureLegend}{" "}
      </p>
    </div>
  );
}
