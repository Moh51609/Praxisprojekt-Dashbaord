"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Layers3 } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useEffect, useState } from "react";

export default function ElementTypeDonutChart({
  typeCounts,
}: {
  typeCounts: Record<string, number>;
}) {
  const useAnimation = useAnimationsEnabled();
  const accent = useAccentColor();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);

  const ALLOWED = [
    "Class",
    "Port",
    "Property",
    "Package",
    "Diagram",
    "Requirement",
    "Activity",
  ];

  const LABELS: Record<string, string> = {
    Class: "Blöcke",
    Port: "Ports",
    Property: "Properties",
    Package: "Packages",
    Diagram: "Diagram",
    Requirement: "Requirements",
    Activity: "Activity",
  };

  // 🎨 Farben
  const COLORS_MAP: Record<string, string> = {
    Blöcke: "#10b981",
    Ports: "#3b82f6",
    Properties: "#f59e0b",
    Packages: "#8b5cf6",
    Diagram: "#cf6339",
    Requirements: "#e11d48",
    Activity: "#6366f1",
  };

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col   flex-1 h-[370px] items-center justify-center  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4 text-center">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accent }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}
        </button>
      </div>
    );
  }
  const chartData = ALLOWED.map((t) => {
    const clean = t;
    const label = LABELS[clean];
    const value = typeCounts?.[clean] ?? 0;

    return { name: label, value };
  }).filter((d) => d.value > 0);

  if (!chartData.length) {
    return (
      <section className="bg-white dark:bg-gray-800 flex justify-center items-center rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        {translations[language].noData}
      </section>
    );
  }

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers3 className="h-5 w-5" style={{ color: accent }} />
          {translations[language].elementTypeDistribution}
        </h2>
      </div>

      <div className="w-full h-[220px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              isAnimationActive={useAnimation}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS_MAP[entry.name] ?? "#8884d8"} />
              ))}
            </Pie>

            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const { name, value } = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                    <strong>{name}</strong>
                    <div className="text-gray-600">{value}</div>
                  </div>
                );
              }}
            />

            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                color: axisColor,
                fontSize: "12px",
                lineHeight: "24px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].elementTypeDistributionLegend}
      </p>
    </section>
  );
}
