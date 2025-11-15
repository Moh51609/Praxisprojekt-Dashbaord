"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import type { ParsedModel } from "@/types/model";
import { ChartPie } from "lucide-react";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function DiagramCoverageChart({ data }: { data: ParsedModel }) {
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const { theme } = useTheme();
  const accentColor = useAccentColor();
  const lineColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const chartZoom = useChartZoom();
  const accessColor = useAccentColor();
  const { language } = useLanguage();
  const chartData = Object.entries(data.diagramsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
  const colors = ["#ec4899", "#6366f1", "#10b981", "#f59e0b", "#f43f5e"];
  const animationEnabled = useAnimationsEnabled();
  const chartBackground = useChartBackground();

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col text-center justify-center items-center dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accessColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        {/* 🔹 Titel-Header */}
        <div className="flex flex-row justify-between mb-4 px-2">
          <h2 className="text-lg font-semibold">
            {translations[language].coverage}
          </h2>
          <ChartPie className="h-6 w-6" style={{ color: accentColor }} />
        </div>

        {/* 🔹 Kariertes Chart-Feld */}
        <div className="relative rounded-2xl dark:bg-gray-800 bg-gray-50 p-4">
          {/* Hintergrund-Gitter */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
            style={{
              zIndex: 0,
              background:
                chartBackground === "light"
                  ? theme === "dark"
                    ? "#1f2937" // dunkles Grau im Dark Mode
                    : "#ffffff" // weiß im Light Mode
                  : chartBackground === "transparent"
                  ? theme === "dark"
                    ? "rgba(0,0,0,0.25)" // 🟣 leicht dunkler Overlay im Dark Mode
                    : "rgba(255,255,255,0.4)" // ⚪ heller Schleier im Light Mode
                  : `
        linear-gradient(to right, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px),
        linear-gradient(to bottom, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px)
      `,
              backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
              backdropFilter:
                chartBackground === "transparent" ? "blur(4px)" : "none", // 🧊 sanfter Blur-Effekt nur im Transparent-Modus
              boxShadow:
                chartBackground === "transparent"
                  ? "inset 0 0 20px rgba(255,255,255,0.05)"
                  : "none", // optionaler Glaseffekt
            }}
          />

          {/* === Donut-Chart === */}
          <div
            className="relative z-10"
            onWheel={(e) => {
              if (!chartZoom) e.preventDefault(); // verhindert Zoom per Scroll
            }}
            style={{ overflow: chartZoom ? "auto" : "hidden" }}
          >
            <ResponsiveContainer width="100%" height={364}>
              <PieChart>
                <Pie
                  data={Object.entries(data.diagramsByType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5) // Top 5 Diagrammtypen
                    .map(([name, value]) => ({ name, value }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  isAnimationActive={animationEnabled}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {Object.entries(data.diagramsByType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name], i) => {
                      const colors = [
                        "#ec4899", // pink
                        "#6366f1", // indigo
                        "#10b981", // grün
                        "#f59e0b", // orange
                        "#f43f5e", // rot
                      ];
                      return <Cell key={i} fill={colors[i % colors.length]} />;
                    })}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const { name, value } = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 p-2 rounded shadow text-xs">
                        <strong>{name}</strong>
                        <div className="text-gray-600">{value} Diagramme</div>
                      </div>
                    );
                  }}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "12px", color: "#6B7280" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 Beschreibung */}
        <p className="text-xs text-gray-500 mt-2 dark:text-white">
          {translations[language].coverageLegend}
        </p>
      </div>
    </section>
  );
}
