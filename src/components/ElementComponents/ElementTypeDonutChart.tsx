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

export default function ElementTypeDonutChart({ data }: { data: any }) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const { language } = useLanguage();

  // ✅ 1️⃣ Fallback, falls keine Metriken vorhanden sind
  if (!data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        Keine Daten vorhanden.
      </section>
    );
  }

  // ✅ 2️⃣ Daten aus metrics (Hauptquelle)
  const metrics = data.metrics ?? {};

  const chartData = [
    { name: "Blöcke", value: metrics.classes ?? 0 },
    { name: "Ports", value: metrics.ports ?? 0 },
    { name: "Properties", value: metrics.properties ?? 0 },
    { name: "Packages", value: metrics.packages ?? 0 },
    { name: "Connectoren", value: metrics.connectors ?? 0 },
    { name: "Diagram", value: metrics.diagramsTotal ?? 0 },
  ].filter((d) => d.value > 0);

  // ✅ 3️⃣ Farben (an dein Design angepasst)
  const colorMap: Record<string, string> = {
    Blöcke: "#10b981",
    Ports: "#3b82f6",
    Properties: "#f59e0b",
    Packages: "#8b5cf6",
    Connectoren: "#ef4444",
    Diagram: "#cf6339",
  };

  const COLORS = Object.values(colorMap);

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  if (chartData.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        Keine Elementtypen gefunden.
      </section>
    );
  }

  // ✅ 4️⃣ Render
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers3 className="h-5 w-5" style={{ color: accent }} />
          {translations[language].elementTypeDistribution}
        </h2>
      </div>

      <div className="w-full h-[200px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={colorMap[entry.name] ?? COLORS[i % COLORS.length]}
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
        Zeigt die Verteilung der Elementtypen im Modell.
      </p>
    </section>
  );
}
