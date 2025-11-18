"use client";

import { BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Rectangle,
} from "recharts";
import type { ParsedModel } from "@/types/model";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";

export default function SortedPortDiagram({ data }: { data: ParsedModel }) {
  const { theme } = useTheme();
  const animationEnabled = useAnimationsEnabled();
  const accessColor = useAccentColor();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const { language } = useLanguage();
  const tooltipStyle = useChartTooltipStyle();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#6B7280";
  // 🔹 Ports sortieren und Top 10 ermitteln
  const topPorts =
    data.classStats
      ?.sort((a, b) => (b.ports ?? 0) - (a.ports ?? 0))
      .slice(0, 10)
      .map((c) => ({ name: c.className ?? "—", value: c.ports ?? 0 })) ?? [];

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col items-center justify-center h-full  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4 text-center">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accessColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4  dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-2 pl-6">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" style={{ color: accessColor }} />
          {translations[language].portsPerBlock}
        </h2>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer>
          {/* 🔹 Wichtig: Dieses BarChart ist aus 'recharts' */}
          <BarChart
            data={topPorts}
            barSize={25}
            barCategoryGap="2%"
            margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>

            {/* Achsen */}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={40}
              tick={({ x, y, payload }: any) => {
                const shortLabel =
                  payload.value?.slice(0, 2).toUpperCase() ?? "";
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill={axisColor}
                    fontSize="11"
                    fontFamily="Montserrat, sans-serif"
                  >
                    {shortLabel}
                  </text>
                );
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
            />

            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const { name, value } = payload[0].payload;
                return (
                  <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                    <strong>{name}</strong>
                    <div className="text-gray-600">{value}</div>
                  </div>
                );
              }}
            />

            {/* Balken */}
            <Bar
              dataKey="value"
              isAnimationActive={animationEnabled}
              background={(props: any) => {
                const { x, y, width, height } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={14}
                    fill="rgba(229,231,235,0.6)"
                  />
                );
              }}
              shape={(props: any) => {
                const { x, y, width, height } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={14}
                    fill={accessColor}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
