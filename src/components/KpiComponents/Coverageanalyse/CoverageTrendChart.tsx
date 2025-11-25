"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { ChartLine } from "lucide-react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

export default function CoverageTrendChart() {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();

  const { language } = useLanguage();
  // 🔹 Beispielhafte Trenddaten (später evtl. aus API oder Modellhistorie)
  const [trendData, setTrendData] = useState([
    { date: "01.10", coverage: 56 },
    { date: "05.10", coverage: 62 },
    { date: "09.10", coverage: 71 },
    { date: "13.10", coverage: 78 },
    { date: "17.10", coverage: 81 },
  ]);

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
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ChartLine className="h-5 w-5" style={{ color: accent }} />
          {translations[language].coverageTrend}
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

        <svg ref={svgRef} width="100%" height="175">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 20, left: -30, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fill: textColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: textColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { date, coverage } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{date}</strong>
                            <div className="text-gray-600">{coverage}</div>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={0} stroke={accent} />
                    <Line
                      type="monotone"
                      dataKey="coverage"
                      stroke={accent}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].coverageTrendLegend}{" "}
      </p>
    </section>
  );
}
