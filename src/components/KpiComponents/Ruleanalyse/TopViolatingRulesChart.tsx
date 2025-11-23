"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import * as d3 from "d3";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useChartBackground } from "@/hooks/useChartBackground";

export default function TopViolatingRulesChart({ rules }: { rules: any[] }) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const { language } = useLanguage();
  const lineColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const chartBackground = useChartBackground();
  const PAGE_SIZE = 10;

  const animationEnabled = useAnimationsEnabled();
  const chartZoom = useChartZoom();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  // 🔹 Daten sortieren nach Anzahl Verstöße
  const sorted = [...rules].sort((a, b) => b.violations - a.violations);
  const totalViolations = sorted.reduce((sum, r) => sum + r.violations, 0);
  let cumulative = 0;

  const data = sorted.map((r) => {
    cumulative += (r.violations / totalViolations) * 100;
    return {
      name: r.id,
      violations: r.violations,
      cumulative: cumulative,
    };
  });

  // 🔹 Zoom Setup
  useEffect(() => {
    if (!svgRef.current || !chartZoom) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => setTransform(event.transform));

    svg.call(zoom as any);
    return () => {
      svg.on(".zoom", null);
    };
  }, [chartZoom]);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 relative">
      {/* Titel */}
      <div className="flex flex-row justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].topViolatingRules}
        </h2>
      </div>

      {/* Chart-Bereich */}
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
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)"
                  } 1px, transparent 1px),
                  linear-gradient(to bottom, ${
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)"
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

        {/* SVG + Chart */}
        <svg ref={svgRef} width="100%" height="175">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 30, left: -30, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <ReferenceLine
                      y={0}
                      stroke={accentColor}
                      strokeWidth={1.2}
                    />

                    <YAxis
                      yAxisId="left"
                      label={{
                        angle: -90,
                        position: "insideLeft",
                        fill: axisColor,
                        fontSize: 12,
                      }}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        angle: 90,
                        position: "insideRight",
                        fill: axisColor,
                        fontSize: 12,
                      }}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { name, violations, cumulative } =
                          payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{name}</strong>
                            <div>Verstöße: {violations}</div>
                            <div>Kumulativ: {cumulative.toFixed(1)}%</div>
                          </div>
                        );
                      }}
                    />
                    <Legend />

                    {/* Balken = Verstöße */}
                    <Bar
                      yAxisId="left"
                      dataKey="violations"
                      radius={[6, 6, 0, 0]}
                    >
                      {data.map((d, i) => (
                        <Cell key={i} fill={accentColor} />
                      ))}
                    </Bar>

                    {/* Linie = kumulative % */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ fill: "#f59e0b", r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>
    </section>
  );
}
