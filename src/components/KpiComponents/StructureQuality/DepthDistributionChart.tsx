"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import * as d3 from "d3";
import { useRef, useState, useEffect } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useChartBackground } from "@/hooks/useChartBackground";
import { LineChart as LineChartIcon } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

export default function DepthDistributionDensityChart({ data }: { data: any }) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const chartZoom = useChartZoom();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();

  const depthCounts: Record<number, number> = {};
  (data?.elements ?? []).forEach((el: any) => {
    const d = el.depth ?? 0;
    depthCounts[d] = (depthCounts[d] ?? 0) + 1;
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

  const chartData = Object.entries(depthCounts)
    .map(([depth, count]) => ({
      depth: Number(depth),
      count,
    }))
    .sort((a, b) => a.depth - b.depth);

  const hasData = chartData.length > 0;

  const avgDepth =
    chartData.reduce((acc, d) => acc + d.depth * d.count, 0) /
    chartData.reduce((acc, d) => acc + d.count, 0 || 1);

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

  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl shadow-sm p-6 text-center h-[575px]  text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].depthDistribution}
        </h2>
        {translations[language].noData}
      </section>
    );
  }

  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].depthDistribution}
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
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: -40, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="depthGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={accentColor}
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="95%"
                          stopColor={accentColor}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="depth"
                      label={{
                        position: "insideBottom",
                        offset: -5,
                        fill: theme === "dark" ? "#D1D5DB" : "#111827",
                        fontSize: 12,
                      }}
                      tick={{
                        fill: theme === "dark" ? "#D1D5DB" : "#111827",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Anzahl Elemente",
                        angle: -90,
                        position: "insideLeft",
                        fill: theme === "dark" ? "#D1D5DB" : "#111827",
                      }}
                      tick={{
                        fill: theme === "dark" ? "#D1D5DB" : "#111827",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { depth, count } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>Tiefe {depth}</strong>
                            <div>{count} Elemente</div>
                          </div>
                        );
                      }}
                    />

                    <ReferenceLine
                      x={avgDepth}
                      stroke="red"
                      strokeDasharray="3 3"
                      label={{
                        value: `Ø ${avgDepth.toFixed(1)}`,
                        position: "top",
                        fill: "red",
                        fontSize: 11,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={accentColor}
                      fill="url(#depthGradient)"
                      strokeWidth={3}
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* 🔹 Legende */}
      <p className="text-xs text-gray-500 mt-2 dark:text-gray-300">
        {translations[language].depthDistributionLegend}
      </p>
    </section>
  );
}
