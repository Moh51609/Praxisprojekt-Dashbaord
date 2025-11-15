"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { ChartBar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";
import { color } from "framer-motion";

export default function RuleViolationsByCategoryChart({
  rules,
}: {
  rules: any[];
}) {
  const accentColor = useAccentColor();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const chartBackground = useChartBackground();
  const { language } = useLanguage();
  const chartZoom = useChartZoom();

  // 🔹 Kategorien & Gruppierung
  const categoryMap: Record<string, string> = {
    R1: "Struktur",
    R2: "Struktur",
    R3: "Benennung",
    R4: "Benennung",
    R5: "Struktur",
    R6: "Verbindungen",
    R7: "Traceability",
    R8: "Diagramme",
  };

  useEffect(() => {
    if (!svgRef.current || !chartZoom) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3]) // Zoom-Level zwischen 0.5x und 3x
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    svg.call(zoom as any);

    return () => {
      svg.on(".zoom", null); // Cleanup bei Unmount
    };
  }, [chartZoom]);
  // 🔹 Verstöße nach Kategorie zählen
  const categoryCounts: Record<string, number> = {};
  rules.forEach((r) => {
    const category = categoryMap[r.id] || "Andere";
    categoryCounts[category] = (categoryCounts[category] ?? 0) + r.violations;
  });

  const data = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 🔹 Farben für Balken
  const barColors = {
    Struktur: "#f59e0b",
    Benennung: "#10b981",
    Verbindungen: "#3b82f6",
    Traceability: "#8b5cf6",
    Diagramme: "#ef4444",
    Andere: accentColor,
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 relative">
      {/* Titel */}
      <div className="flex flex-row justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ChartBar className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].ruleViolationsByCategory ||
            "Regelverstöße nach Kategorie"}
        </h2>
      </div>

      {/* Chart */}
      <div className="relative rounded-2xl p-2">
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            backgroundColor:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937"
                  : "#ffffff"
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)"
                  : "rgba(255,255,255,0.4)"
                : "transparent",
            backgroundImage:
              chartBackground === "grid"
                ? `
          linear-gradient(to right, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px),
          linear-gradient(to bottom, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px)
        `
                : "none",
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none",
            boxShadow:
              chartBackground === "transparent"
                ? "inset 0 0 20px rgba(255,255,255,0.05)"
                : "none",
          }}
        />
        <svg ref={svgRef} width="100%" height="175">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart
                    data={data}
                    margin={{ top: 10, right: 30, left: -30, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={50}
                    />
                    <YAxis
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ReferenceLine
                      y={0}
                      stroke={accentColor}
                      strokeWidth={1.2}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { name, value } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{name}</strong>
                            <div>{value} Verstöße</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {data.map((d, i) => (
                        <Cell key={i} fill={barColors[d.name] || accentColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* Beschreibung */}
    </section>
  );
}
