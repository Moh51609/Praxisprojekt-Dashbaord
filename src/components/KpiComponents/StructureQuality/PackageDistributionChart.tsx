"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
} from "recharts";
import { Package } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";

export default function PackageDistributionChart({ data }: { data: any }) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  // 🔹 Gruppiere Elemente nach Package
  const packageCounts: Record<string, number> = {};
  (data?.elements ?? []).forEach((el: any) => {
    const pkg = el.package || "Unbekannt";
    packageCounts[pkg] = (packageCounts[pkg] ?? 0) + 1;
  });

  // 🔹 Daten für Recharts vorbereiten
  const chartData = Object.entries(packageCounts)
    .map(([pkg, count]) => ({ package: pkg, count }))
    .sort((a, b) => b.count - a.count); // absteigend nach Größe

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

  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      {/* 🔹 Titel */}
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Package className="h-5 w-5" style={{ color: accentColor }} />
          Package-Verteilung
        </h2>
      </div>

      <div className="relative rounded-2xl dark:bg-gray-800 bg-gray-50 p-4">
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
        <svg ref={svgRef} width="100%" height="400">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                {/* 🔹 Diagramm */}
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="package"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      label={{
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: " #6B7280", fontSize: 12 },
                      }}
                      axisLine={false} // ❌ keine linke Linie
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 11 }}
                    />

                    <ReferenceLine
                      y={10}
                      stroke="#facc15" // Gelb
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        position: "right",
                        fill: "#facc15",
                        fontSize: 10,
                      }}
                    />

                    <ReferenceLine
                      y={15}
                      stroke="#ef4444" // Rot
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        position: "right",
                        fill: "#ef4444",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.1)" }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { package: pkg, count } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{pkg}</strong>
                            <div>{count} Elemente</div>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine
                      y={0}
                      stroke={accentColor}
                      strokeWidth={1.2}
                    />
                    <Bar
                      dataKey="count"
                      fill={accentColor}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* 🔹 Legende */}
      <p className="text-xs text-gray-500 mt-2 dark:text-gray-300">
        Zeigt, wie viele Elemente in jedem Package enthalten sind.
      </p>
    </section>
  );
}
