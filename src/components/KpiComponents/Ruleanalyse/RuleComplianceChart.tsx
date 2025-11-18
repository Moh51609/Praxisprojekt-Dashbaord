"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { Activity } from "react";
import { ActivityIcon, Scale } from "lucide-react";

export default function RuleComplianceChart({ rules }: { rules: any[] }) {
  const accent = useAccentColor();
  const passed = rules.filter((r) => r.passed).length;
  const failed = rules.filter((r) => !r.passed).length;
  const percentage = Math.round((passed / rules.length) * 100);
  const tooltipStyle = useChartTooltipStyle();
  const { language } = useLanguage();

  const chartData = [
    { name: "Bestanden", value: passed },
    { name: "Fehlgeschlagen", value: failed },
  ];

  const COLORS = [accent, "#ef4444"];

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Scale className="h-5 w-5" style={{ color: accent }} />
          {translations[language].ruleConformance}
        </h2>
      </div>

      <div className="flex flex-row items-center gap-6">
        {/* 🔹 Kreisdiagramm mit Prozentwert in der Mitte */}
        <div className="relative w-1/2 flex justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                startAngle={90}
                endAngle={450}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
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
            </PieChart>
          </ResponsiveContainer>

          {/* 🔹 Prozentwert im Kreis */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {percentage}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {translations[language].passed}
            </span>
          </div>
        </div>

        {/* 🔹 Liste der einzelnen Regeln */}
        <div className="w-1/2 text-xs text-gray-700 dark:text-gray-200">
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1"
              >
                <span>
                  <strong>{rule.id}</strong>
                </span>
                <span
                  className={`font-semibold ${
                    rule.passed ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {rule.passed ? "✅" : "❌"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].ruleConformanceLegend}
      </p>
    </section>
  );
}
