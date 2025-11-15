"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Flame } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useRef, useState } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import * as d3 from "d3";

export default function RuleHotspotChart({
  hotspots,
}: {
  hotspots: { package: String; violations: number }[];
}) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#E5E7EB" : "#1F2937";
  const chartZoom = useChartZoom();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartBackground = useChartBackground();
  // Farbskala nach Intensität
  const getColor = (value: number) => {
    if (value > 10) return "#ef4444"; // rot
    if (value > 6) return "#f97316"; // orange
    if (value > 3) return "#facc15"; // gelb
    return "#22c55e"; // grün
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Flame className="h-5 w-5" style={{ color: accent }} />
          Regel-Hotspots im Modell
        </h2>
      </div>

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

        <svg ref={svgRef} width="100%" height="500">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={hotspots}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: textColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="package"
                      tick={{ fill: textColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { package: pkg, violations } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{pkg}</strong>
                            <div className="text-gray-600">{violations}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="violations" radius={[6, 6, 6, 6]}>
                      {hotspots.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColor(entry.violations)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Zeigt, in welchen Modellbereichen (Paketen/Subsystemen) die meisten
        Regelverstöße auftreten.
      </p>
    </section>
  );
}
