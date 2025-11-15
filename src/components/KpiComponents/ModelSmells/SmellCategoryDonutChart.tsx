"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { AlertTriangle } from "lucide-react";

export default function SmellCategoryDonutChart({ smells }: { smells: any[] }) {
  const accent = useAccentColor();
  const { theme } = useTheme();

  // 🔹 Gruppiere Smells nach Kategorie
  const categoryCounts = smells.reduce(
    (acc: Record<string, number>, s: any) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const data = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  // Kategorie → zugehörige Smell-IDs
  const CATEGORY_DETAILS: Record<string, string[]> = {
    Structure: ["S1", "S2", "S3", "S8", "S9", "S11", "S13"],
    Naming: ["S10"],
    Traceability: ["S6", "S14"],
    Relations: ["S7"],
    Redundancy: ["S4", "S5"],
    Consistency: ["S12", "S15"],
  };

  const COLORS = {
    Structure: "#f59e0b",
    Naming: "#3b82f6",
    Traceability: "#10b981",
    Relations: "#ef4444",
    Redundancy: "#8b5cf6",
    Consistency: "#f97316",
  };

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      {/* 🔹 Titel */}
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" style={{ color: accent }} />
        Model Smells nach Kategorie
      </h2>

      {/* 🔹 Diagramm */}
      {data.length > 0 ? (
        <div className="w-full h-[230px] flex flex-row items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 50, bottom: 10, left: 0 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={
                      COLORS[entry.name as keyof typeof COLORS] ||
                      Object.values(COLORS)[i % 6]
                    }
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
                  lineHeight: "22px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-10">
          Keine Model-Smells gefunden.
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        Zeigt den Anteil der Model-Smells je Qualitätskategorie (Struktur,
        Naming, Traceability usw.).
      </p>
    </section>
  );
}
