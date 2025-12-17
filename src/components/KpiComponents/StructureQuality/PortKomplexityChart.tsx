"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import {
  ChartBar,
  ChartColumnDecreasing,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ParsedModel } from "@/types/model";
import * as d3 from "d3";
import { useRef, useState, useEffect } from "react";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";

export default function PortComplexityChart({
  data,
  page,

  onPageChange,
}: {
  data: ParsedModel;
  page: number;

  onPageChange: (neuPage: number) => void;
}) {
  const accessColor = useAccentColor();
  const { theme } = useTheme();
  const lineColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const chartBackground = useChartBackground();
  const { language } = useLanguage();
  const tooltipStyle = useChartTooltipStyle();
  const PAGE_SIZE = 10;
  const topBlocksRaw = data?.classStats ?? [];
  const animationEnabled = useAnimationsEnabled();
  const chartZoom = useChartZoom();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);

  if (!topBlocksRaw.length) {
    console.warn("⚠️ Keine classStats gefunden, verwende Fallback-Daten!");
  }

  const topBlocks = topBlocksRaw
    .filter((c) => {
      const element = data.elements.find((e) => e.id === c.umlId);
      return (element?.ports?.length ?? 0) > 0;
    })
    .map((c) => {
      const element = data.elements.find((e) => e.id === c.umlId);
      return {
        id: c.umlId,
        className:
          c.className!.length > 12
            ? c.className!.slice(0, 10) + "…"
            : c.className,
        portCount: element?.ports?.length ?? 0,
        fullName: c.className,
      };
    });

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

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const topBlocksSlice = topBlocks.slice(start, end);

  const chartData =
    topBlocksSlice.length > 0 ? topBlocksSlice : topBlocks.slice(0, 10);

  const totalPages = Math.max(1, Math.ceil(topBlocks.length / PAGE_SIZE));
  const hasData = topBlocks.length > 0;
  useEffect(() => {
    setVisible(autoLoad);
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
      <section className="bg-white flex-col dark:bg-gray-800 h-[575px]  items-center flex justify-center rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg  font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].portComplexity}
        </h2>
        {translations[language].noData}
      </section>
    );
  }

  return (
    <section>
      <div className="relative bg-white rounded-2xl dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex justify-between mb-4 items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ChartColumnDecreasing
              className="h-5 w-5"
              style={{ color: accessColor }}
            />
            {translations[language].portComplexity}
          </h2>
        </div>

        {/* 🔹 Kariertes Chart-Feld */}
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

          <svg ref={svgRef} width="100%" height="400">
            <g transform={transform.toString()}>
              <foreignObject width="100%" height="100%">
                <div style={{ width: "100%", height: "100%" }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      layout="horizontal"
                      margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
                      data={chartData}
                    >
                      <ReferenceLine
                        y={8}
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

                      <XAxis
                        dataKey="className"
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: axisColor, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        type="number"
                        tick={{ fill: axisColor, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      {/* Tooltip */}
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload?.length) return null;

                          const { id } = payload[0].payload;
                          const element = topBlocks.find((b) => b.id === id);

                          if (!element) return null;

                          return (
                            <div className="bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                              <strong>{element.fullName}</strong>
                              <div className="text-gray-600">
                                Ports: {element.portCount}
                              </div>
                            </div>
                          );
                        }}
                      />

                      <ReferenceLine
                        y={0}
                        stroke={accessColor}
                        strokeWidth={1.2}
                      />

                      <Bar
                        dataKey="portCount"
                        isAnimationActive={animationEnabled}
                        fill={accessColor}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </foreignObject>
            </g>
          </svg>
        </div>

        <div className="flex flex-row justify-between items-center mt-2">
          <p className="text-xs text-gray-500 dark:text-white">
            {translations[language].interfaceLegend}
            (&gt;6)
          </p>
          <div className="flex justify-end items-center gap-2">
            <button
              className={`p-2 rounded-lg border ${
                page === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(Math.max(0, page - 1))} // ⬅️ Zurückblättern
              disabled={page === 0}
            >
              <ChevronLeft className="w-3 h-3 text-gray-600  hover:text-black dark:text-white dark:hover:text-black" />
            </button>

            <span className="text-xs text-gray-600 dark:text-white ">
              {translations[language].page} {page + 1} / {totalPages}
            </span>

            <button
              className={`p-2 rounded-lg border ${
                page >= totalPages - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} // ➡️ Vorblättern
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-3 h-3 text-gray-600  hover:text-black dark:text-white hover:dark:text-black" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
