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
import { useEffect, useRef, useState } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { translations } from "@/lib/i18n";
import * as d3 from "d3";
import { useLanguage } from "@/hooks/useLanguage";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

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
  const useAnimation = useAnimationsEnabled();
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();

  const getColor = (value: number) => {
    if (value > 10) return "#ef4444";
    if (value > 6) return "#f97316";
    if (value > 3) return "#facc15";
    return "#22c55e";
  };

  const hasData = hotspots.length > 0;

  if (!hasData) {
    return (
      <section className="bg-white dark:bg-gray-800  items-center flex justify-center flex-col rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].ruleHotspot}{" "}
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
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[650px] items-center flex justify-center flex-col shadow-sm">
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
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Flame className="h-5 w-5" style={{ color: accent }} />
          {translations[language].ruleHotspot}{" "}
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
                    <Bar
                      dataKey="violations"
                      radius={[6, 6, 6, 6]}
                      isAnimationActive={useAnimation}
                    >
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
        {translations[language].ruleHotspotLegend}
      </p>
    </section>
  );
}
