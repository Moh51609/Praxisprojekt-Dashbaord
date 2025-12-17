"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { GitBranch } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useEffect, useState } from "react";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

export default function RelationTypeDonutChart({
  relations,
}: {
  relations: any[];
}) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const useAnimation = useAnimationsEnabled();
  const { language } = useLanguage();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);

  const typeCounts = relations.reduce((acc: Record<string, number>, r) => {
    const type = r.type?.replace(/^uml:|^sysml:/, "") ?? "Unbekannt";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const COLORS = [
    accent,
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#84cc16",
  ];

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  if (!relations.length) {
    return (
      <section className="bg-white dark:bg-gray-800 items-center flex justify-center rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        {translations[language].noData}
      </section>
    );
  }
  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col   flex-1 h-[330px] items-center justify-center  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
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

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <GitBranch className="h-5 w-5" style={{ color: accent }} />
          {translations[language].coveredRelations}
        </h2>
      </div>

      {/* Chart */}
      <div className="w-full h-[200px] flex flex-row items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              isAnimationActive={useAnimation}
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                  strokeWidth={1}
                />
              ))}
            </Pie>

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
        {translations[language].relationsTypeLegend}
      </p>
    </section>
  );
}
