"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { AlertTriangle } from "lucide-react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

// -------------------------
// 💡 TypeScript Typen
// -------------------------
type NodeType = {
  id: string;
  name: string;
  type: string;
  isolated: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type LinkType = {
  source: string;
  target: string;
};

export default function IsolatedElementsChart({
  relations,
  elements,
}: {
  relations: any[];
  elements: any[];
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const containerRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const [size, setSize] = useState({ width: 0, height: 600 });

  // -------------------------
  // 🔄 Resize Handling
  // -------------------------
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // -------------------------
  // 🔥 D3 Graph Rendering
  // -------------------------
  useEffect(() => {
    if (!elements?.length || !ref.current) return;

    // 🔍 Verbundene Elemente berechnen
    const connected = new Set(
      relations.flatMap((r: any) => [r.source, r.target])
    );

    const nodes: NodeType[] = elements.map((el: any) => ({
      id: el.id,
      name: el.name || "Unbenannt",
      type: el.type?.replace("uml:", "").replace("sysml:", "") || "Unknown",
      isolated: !connected.has(el.id),
    }));

    const nodeIds = new Set(nodes.map((n) => n.id));

    const links: LinkType[] = (relations ?? [])
      .filter((r: any) => nodeIds.has(r.source) && nodeIds.has(r.target))
      .map((r: any) => ({
        source: r.source,
        target: r.target,
      }));

    const svgEl = d3.select(ref.current);
    svgEl.selectAll("*").remove();

    const width = ref.current.clientWidth || 800;
    const height = 400;

    const svg = svgEl
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height);

    // -------------------------
    // ⚙️ Force Simulation
    // -------------------------
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // -------------------------
    // 🔹 Linien
    // -------------------------
    const link = svg
      .append("g")
      .attr("stroke", theme === "dark" ? "#4b5563" : "#d1d5db")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // -------------------------
    // 🔹 Knoten
    // -------------------------
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 6)
      .attr("fill", (d: NodeType) => (d.isolated ? "#ef4444" : accentColor))
      .attr("stroke", theme === "dark" ? "#111827" : "#ffffff")
      .attr("stroke-width", 1.5);

    // Drag — mit Cast für TS
    // Drag – vollständig aus Typprüfung rausnehmen
    (node as any).call(
      (d3.drag() as any)
        .on("start", (event: any, d: NodeType) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event: any, d: NodeType) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event: any, d: NodeType) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // -------------------------
    // 🔹 Labels
    // -------------------------
    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: NodeType) => (d.isolated ? "⚠︎ " + d.name : d.name))
      .attr("font-size", 10)
      .attr("fill", theme === "dark" ? "#e5e7eb" : "#374151")
      .attr("text-anchor", "middle");

    // -------------------------
    // 🔁 Simulation Updates
    // -------------------------
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y - 10);
    });
  }, [relations, elements, accentColor, theme]);

  // -------------------------
  // 📦 UI
  // -------------------------
  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].isolatedELements}
        </h2>
      </div>

      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden w-full bg-transparent h-[500px] relative"
      >
        <svg ref={ref}></svg>
      </div>

      <p className="text-xs text-gray-500 mt-3 dark:text-gray-300">
        {translations[language].isolatedELementsLegend}
      </p>
    </section>
  );
}
