"use client";

import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { Flame } from "lucide-react";

export default function RuleViolationHeatmap({ rules }: { rules: any[] }) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const { language } = useLanguage();

  // 🔹 Kategorisierung
  const categoryMap: Record<string, string> = {
    R1: "Structure",
    R2: "Structure",
    R3: "Naming",
    R4: "Naming",
    R5: "Connectivity",
    R6: "Connectivity",
    R7: "Traceability",
  };

  const data = rules.map((r) => ({
    category: categoryMap[r.id] || "Other",
    rule: r.id,
    violations: r.violations,
  }));

  // 🔹 Farbskala
  const colorScale = (v: number) => {
    if (v === 0) return theme === "dark" ? "#1f2937" : "#e5e7eb";
    if (v < 3) return "#86efac";
    if (v < 10) return "#facc15";
    return "#f87171";
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-row justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Flame className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].ruleHeatmap || "Regelverstöße Heatmap"}
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "dark" ? "#374151" : "#E5E7EB"}
          />
          <XAxis
            type="category"
            dataKey="rule"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            name="Regel"
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            name="Kategorie"
          />
          <ZAxis type="number" dataKey="violations" range={[50, 500]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const { category, rule, violations } = payload[0].payload;
              return (
                <div className="bg-white dark:bg-gray-900 p-2 rounded border text-xs shadow">
                  <strong>{rule}</strong>
                  <div>{category}</div>
                  <div>{violations} Verstöße</div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorScale(d.violations)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 text-center">
        {translations[language].ruleHeatmapDesc ||
          "Zeigt, in welchen Kategorien und Regeln die meisten Verstöße vorkommen."}
      </p>
    </section>
  );
}
