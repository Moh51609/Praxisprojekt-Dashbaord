"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export default function RuleSeverityFrequencyChart({
  rules,
}: {
  rules: any[];
}) {
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";
  const { language } = useLanguage();

  // 🔹 Beispielhafte Schweregrade (kannst du später dynamisch bestimmen)
  const severityMap: Record<string, number> = {
    R1: 4,
    R2: 3,
    R3: 2,
    R4: 2,
    R5: 5,
    R6: 4,
    R7: 3,
  };

  const data = rules.map((r) => ({
    rule: r.id,
    freq: r.violations,
    severity: severityMap[r.id] ?? 2,
    affected: Math.round(Math.random() * 40 + 5), // Dummy: Anzahl betroffener Elemente
  }));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-row justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color: accentColor }} />
          "Schweregrad vs. Häufigkeit"
        </h2>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === "dark" ? "#374151" : "#E5E7EB"}
          />
          <XAxis
            type="number"
            dataKey="freq"
            name="Häufigkeit"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Verstoßhäufigkeit",
              position: "insideBottom",
              offset: -10,
              fill: axisColor,
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="severity"
            name="Schweregrad"
            domain={[0, 5]}
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Schweregrad",
              angle: -90,
              position: "insideLeft",
              fill: axisColor,
              fontSize: 12,
            }}
          />
          <ZAxis
            type="number"
            dataKey="affected"
            range={[80, 500]}
            name="Betroffene Elemente"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const { rule, freq, severity, affected } = payload[0].payload;
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-xs">
                  <strong>{rule}</strong>
                  <div>Häufigkeit: {freq}</div>
                  <div>Schweregrad: {severity}</div>
                  <div>Betroffene Elemente: {affected}</div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.severity >= 4
                    ? "#ef4444"
                    : d.severity >= 3
                    ? "#facc15"
                    : accentColor
                }
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 text-center">
        "Zeigt den Zusammenhang zwischen Häufigkeit und Schweregrad von
        Regelverstößen."
      </p>
    </section>
  );
}
