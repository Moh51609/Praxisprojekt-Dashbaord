"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";

export default function RequirementCoverageChart({ data }: { data: any }) {
  const accent = useAccentColor();
  const { theme } = useTheme();

  // 🔹 Requirements im Modell
  const requirements =
    data?.elements?.filter((e: any) => e.type?.includes("Requirement")) ?? [];

  // 🔹 Erfüllte Requirements (mind. eine Satisfy-Relation)
  const satisfied = requirements.filter((req: any) =>
    data.relations?.some(
      (r: any) =>
        r.type?.includes("Satisfy") &&
        (r.source === req.id || r.target === req.id)
    )
  );

  const total = requirements.length;
  const covered = satisfied.length;
  const uncovered = total - covered;
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;

  const chartData = [
    { name: "Abgedeckt", value: covered },
    { name: "Nicht abgedeckt", value: uncovered },
  ];

  const COLORS = [accent, theme === "dark" ? "#ef4444" : "#dc2626"];

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Abdeckungsgrad Requirements
      </h2>

      <div className="flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={3}
              startAngle={90}
              endAngle={450}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value}`, name]}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "white",
                borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Zentraler Prozentwert */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {percentage}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            abgedeckt
          </span>
        </div>
      </div>

      {/* Kleine Legende */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: accent }}
          ></span>
          <span className="text-gray-700 dark:text-gray-300">
            Abgedeckt ({covered})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: theme === "dark" ? "#ef4444" : "#dc2626",
            }}
          ></span>
          <span className="text-gray-700 dark:text-gray-300">
            Nicht abgedeckt ({uncovered})
          </span>
        </div>
      </div>
    </section>
  );
}
