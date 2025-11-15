"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";

export default function RuleConformanceChart({ data }: { data: any[] }) {
  const accent = useAccentColor();
  const passed = data.filter((r) => r.passed).length;
  const failed = data.filter((r) => !r.passed).length;

  const chartData = [
    { name: "Bestanden", value: passed },
    { name: "Fehlgeschlagen", value: failed },
  ];

  const COLORS = [accent, "#ef4444"];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
      <h3 className="text-md font-semibold mb-2">Regelkonformität</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center">
        {passed} von {data.length} Regeln eingehalten
      </p>
    </div>
  );
}
