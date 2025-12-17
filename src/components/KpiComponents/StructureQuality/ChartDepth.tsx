"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { ChevronLeft, ChevronRight, ChartBar } from "lucide-react";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useChartBackground } from "@/hooks/useChartBackground";
import * as d3 from "d3";
import { useRef, useState, useEffect } from "react";
import { useChartZoom } from "@/hooks/useChartZoom";
import type { ParsedModel } from "@/types/model";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function ChartDepth({
  data,
  page,
  totalPages,
  onPageChange,
}: {
  data: ParsedModel;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}) {
  const chartZoom = useChartZoom();
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const { language } = useLanguage();
  const accessColor = useAccentColor();
  const { theme } = useTheme();
  const animationEnabled = useAnimationsEnabled();
  const lineColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const PAGE_SIZE = 10;
  const chartBackground = useChartBackground();
  const allDepthData = (data?.elements ?? [])
    .filter((e) => e.name)
    .map((e) => ({
      name: e.name
        ? e.name.length > 10
          ? e.name.slice(0, 10) + "…"
          : e.name
        : "(Unbenannt)",
      depth: e.depth ?? 0,
    }));

  const hasPagination = allDepthData.length > PAGE_SIZE;

  const hasData = allDepthData.length > 0;

  useEffect(() => {
    if (!svgRef.current || !chartZoom) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    svg.call(zoom as any);

    return () => {
      svg.on(".zoom", null);
    };
  }, [chartZoom]);

  useEffect(() => {
    setVisible(autoLoad);
    console.log("🧠 AutoLoad Hook:", autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[575px] items-center flex justify-center flex-col shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accessColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <section className="bg-white dark:bg-gray-800 h-[575px]  items-center flex justify-center flex-col rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].modelDepth}
        </h2>
        {translations[language].noData}
      </section>
    );
  }

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const depthData = [
    { name: "", depth: 0 },
    ...(hasPagination
      ? allDepthData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      : allDepthData),
  ];
  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ChartBar className="h-5 w-5" style={{ color: accessColor }} />
          {translations[language].modelDepth}
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
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={depthData}
                    margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
                  >
                    <ReferenceLine
                      y={3}
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
                      y={5}
                      stroke="#ef4444" // Rot
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        position: "right",
                        fill: "#ef4444",
                        fontSize: 10,
                      }}
                    />

                    <defs>
                      <linearGradient
                        id="lineColor"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#f9a8d4"
                          stopOpacity={0.5}
                        />
                      </linearGradient>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#ec4899"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f9a8d4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 6]}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { name, depth } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{name}</strong>
                            <div className="text-gray-600">Tiefe: {depth}</div>
                          </div>
                        );
                      }}
                    />
                    {/* Linie */}
                    <Line
                      isAnimationActive={animationEnabled}
                      type="monotone"
                      dataKey="depth"
                      stroke={accessColor}
                      strokeWidth={5}
                      dot={{
                        r: 5,
                        fill: accessColor,
                        stroke: "white",
                        strokeWidth: 1,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "#ec4899",
                        stroke: "white",
                        strokeWidth: 2,
                      }}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(236,72,153,0.4))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="depth"
                      fill="url(#areaFill)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <div className="flex flex-row justify-between items-center mt-2">
        <p className="text-xs text-gray-500 dark:text-white">
          {translations[language].depthLegend}
          (&gt;6)
        </p>
        {hasPagination && (
          <div className="flex justify-end items-center gap-2">
            <button
              className={`p-2 rounded-lg border ${
                page === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-white" />
            </button>

            <span className="text-xs text-gray-600 dark:text-white">
              {translations[language].page} {page + 1} / {totalPages}
            </span>

            <button
              className={`p-2 rounded-lg border ${
                page >= totalPages - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-3 h-3 text-gray-600 dark:text-white" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
