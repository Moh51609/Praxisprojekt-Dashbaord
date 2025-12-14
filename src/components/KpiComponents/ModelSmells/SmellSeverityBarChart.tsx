"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { ThermometerSun } from "lucide-react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useEffect, useRef, useState } from "react";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

export default function SmellSeverityBarChart({ smells }: { smells: any[] }) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const tooltipStyle = useChartTooltipStyle();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const { language } = useLanguage();

  // 🔹 Gruppiere Smells nach Severity
  const severityCounts = smells.reduce(
    (acc: Record<string, number>, s: any) => {
      acc[s.severity] = (acc[s.severity] ?? 0) + 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0 }
  );

  const data = [
    { name: "Low", count: severityCounts.Low },
    { name: "Medium", count: severityCounts.Medium },
    { name: "High", count: severityCounts.High },
  ];
  useEffect(() => {
    if (!zoomRef.current || !chartZoom) return;

    const svg = d3.select(zoomRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>() // ✅ richtige Typen
      .scaleExtent([0.5, 3]) // ✅ Zoom-Level
      .on("zoom", (event: any) => {
        setTransform(event.transform);
      });

    svg.call(zoom as any); // ✅ “as any” killt TS-Fehler, aber D3 bleibt funktionsfähig

    return () => {
      svg.on(".zoom", null); // Cleanup
    };
  }, [chartZoom]);
  // 🔹 Farben für Balken
  const COLORS: Record<string, string> = {
    Low: "#22c55e", // grün
    Medium: "#facc15", // gelb
    High: "#ef4444", // rot
  };

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
      {/* 🔹 Titel */}
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <ThermometerSun className="h-5 w-5" style={{ color: accent }} />
        {translations[language].smellsBySeverity}
      </h2>

      {/* 🔹 Chart */}
      <div className="relative rounded-2xl dark:bg-gray-800 bg-gray-50 p-4">
        {/* Hintergrund-Gitter */}
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
                {data.every((d) => d.count === 0) ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Keine Model-Smells gefunden.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 10, right: 20, left: -20, bottom: 10 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const { name, count } = payload[0].payload;
                          return (
                            <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                              <strong>{name}</strong>
                              <div className="text-gray-600">{count}</div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.name] || accent}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].smellsBySeverityLegend}
      </p>
    </section>
  );
}
