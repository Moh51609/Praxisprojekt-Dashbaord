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
  Legend,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

export default function SmellSeverityTrendChart({ data }: { data: any[] }) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const { language } = useLanguage();
  const useAnimation = useAnimationsEnabled();

  const low = data.filter((s) => s.severity === "Low").length;
  const med = data.filter((s) => s.severity === "Medium").length;
  const high = data.filter((s) => s.severity === "High").length;

  const smellTrend = [
    { date: "01.10", low: low * 1.2, med: med * 1.3, high: high * 1.1 },
    { date: "05.10", low: low, med: med * 0.9, high: high },
    { date: "09.10", low: low * 0.8, med: med * 0.85, high: high * 0.9 },
    { date: "13.10", low: low * 0.75, med: med * 0.8, high: high * 0.85 },
    { date: "17.10", low: low * 0.7, med: med * 0.75, high: high * 0.8 },
  ];

  useEffect(() => {
    if (!zoomRef.current || !chartZoom) return;

    const svg = d3.select(zoomRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event: any) => {
        setTransform(event.transform);
      });

    svg.call(zoom as any);

    return () => {
      svg.on(".zoom", null);
    };
  }, [chartZoom]);

  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();
  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[400px] items-center flex justify-center flex-col shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accent }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Activity className="h-5 w-5" style={{ color: accent }} />
          {translations[language].smellTrendChartInModel}
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

        <svg ref={svgRef} width="100%" height="450">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={smellTrend}
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: axisColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: axisColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { date, low, med, high } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{date}</strong>
                            <div className="text-green-600 ">
                              low: {low.toFixed(2)}
                            </div>
                            <div className="text-yellow-600">
                              Medium: {med.toFixed(2)}
                            </div>
                            <div className="text-red-600">
                              High: {high.toFixed(2)}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        color: axisColor,
                        fontSize: "12px",
                      }}
                    />

                    <Line
                      type="monotone"
                      isAnimationActive={useAnimation}
                      dataKey="low"
                      stroke="#22c55e" // grün
                      strokeWidth={2.3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="med"
                      isAnimationActive={useAnimation}
                      stroke="#eab308" // gelb
                      strokeWidth={2.3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="high"
                      isAnimationActive={useAnimation}
                      stroke="#ef4444" // rot
                      strokeWidth={2.3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <ReferenceLine y={0} stroke={accent} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {translations[language].smellTrendLegend}
      </p>
    </section>
  );
}
