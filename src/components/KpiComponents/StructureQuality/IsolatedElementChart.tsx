"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { AlertTriangle } from "lucide-react";
import { useChartBackground } from "@/hooks/useChartBackground";

export default function IsolatedElementsChart({ relations, elements }: any) {
  const ref = useRef<SVGSVGElement | null>(null);
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const [size, setSize] = useState({ width: 0, height: 600 });

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

  useEffect(() => {
    if (!elements?.length || !ref.current) return;

    // 🧩 Beziehungen aufbauen
    const connected = new Set(
      relations.flatMap((r: any) => [r.source, r.target])
    );
    const nodes = elements.map((el: any) => ({
      id: el.id,
      name: el.name || "Unbenannt",
      type: el.type?.replace("uml:", "").replace("sysml:", "") || "Unknown",
      isolated: !connected.has(el.id),
    }));

    // 🔍 Links validieren (nur, wenn beide Enden existieren)
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = (relations ?? []).filter(
      (r: any) => nodeIds.has(r.source) && nodeIds.has(r.target)
    );

    if (!links.length && !nodes.length) return;

    // 🧼 Reset SVG
    const svgEl = d3.select(ref.current);
    svgEl.selectAll("*").remove();

    const width = ref.current.clientWidth || 800;
    const height = 400;

    const svg = svgEl
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height);

    // ⚙️ Simulation sicher initialisieren
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // 🔹 Linien (Verbindungen)
    const link = svg
      .append("g")
      .attr("stroke", theme === "dark" ? "#4b5563" : "#d1d5db")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // 🔹 Knoten
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => (d.isolated ? "#ef4444" : accentColor))
      .attr("stroke", theme === "dark" ? "#111827" : "#fff")
      .attr("stroke-width", 1.5)
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // 🔹 Labels
    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => (d.isolated ? "⚠︎ " + d.name : d.name))
      .attr("font-size", 10)
      .attr("fill", theme === "dark" ? "#e5e7eb" : "#374151")
      .attr("text-anchor", "middle");

    // 🔹 Simulation aktualisieren
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

  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color: accentColor }} />
          Isolierte Elemente
        </h2>
      </div>
      <div
        ref={containerRef}
        className=" rounded-2xl overflow-hidden w-full bg-transparent h-[500px] relative"
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            background:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937" // dunkles Grau im Dark Mode
                  : "#ffffff" // weiß im Light Mode
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)" // 🟣 leicht dunkler Overlay im Dark Mode
                  : "rgba(255,255,255,0.4)" // ⚪ heller Schleier im Light Mode
                : `
        linear-gradient(to right, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px),
        linear-gradient(to bottom, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px)
      `,
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none", // 🧊 sanfter Blur-Effekt nur im Transparent-Modus
            boxShadow:
              chartBackground === "transparent"
                ? "inset 0 0 20px rgba(255,255,255,0.05)"
                : "none", // optionaler Glaseffekt
          }}
        />
        <svg ref={ref}></svg>
      </div>
      <p className="text-xs text-gray-500 mt-3 dark:text-gray-300">
        Rote Punkte repräsentieren isolierte Elemente . Verbundene Elemente
        bilden Cluster.
      </p>
    </section>
  );
}
