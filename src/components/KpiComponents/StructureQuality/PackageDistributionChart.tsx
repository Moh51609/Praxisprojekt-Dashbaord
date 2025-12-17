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
import { ChevronLast, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

export default function PackageDistributionChart({
  data,
  page = 0,
  totalPages,
  onPageChange,
}: {
  data: any;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const { language } = useLanguage();
  const useAnimation = useAnimationsEnabled();
  const PAGE_SIZE = 10;
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();

  const packageCounts: Record<string, number> = {};
  (data?.elements ?? []).forEach((el: any) => {
    const pkg = el.package || "Unbekannt";
    packageCounts[pkg] = (packageCounts[pkg] ?? 0) + 1;
  });

  const chartData = Object.entries(packageCounts)
    .map(([pkg, count]) => ({ package: pkg, count }))
    .sort((a, b) => b.count - a.count);

  const hasPagination = chartData.length > PAGE_SIZE;

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
  const pagedData = hasPagination ? chartData.slice(start, end) : chartData;

  const total = chartData.length;
  const totalPagesValue = totalPages ?? Math.ceil(total / PAGE_SIZE);
  const hasData = chartData.length > 0;
  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl h-[575px] shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].packageDistribution}
        </h2>
        {translations[language].noData}
      </section>
    );
  }
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
          style={{ backgroundColor: accentColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Package className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].packageDistribution}
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
                  <BarChart
                    data={pagedData}
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
                      isAnimationActive={useAnimation}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <div className="flex flex-row justify-between items-center mt-2">
        <p className="text-xs text-gray-500 mt-2 dark:text-gray-300">
          {translations[language].packageDistributionLegend}
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
              {translations[language].page} {page + 1} / {totalPagesValue}
            </span>

            <button
              className={`p-2 rounded-lg border ${
                page >= totalPagesValue - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() =>
                onPageChange(Math.min(totalPagesValue - 1, page + 1))
              }
              disabled={page >= totalPagesValue - 1}
            >
              <ChevronRight className="w-3 h-3 text-gray-600 dark:text-white" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
