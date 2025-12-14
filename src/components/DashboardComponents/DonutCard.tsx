import { ParsedModel } from "@/types/model";
import { ArrowUp, Languages, LucideIcon } from "lucide-react";
import { Tooltip, Pie, PieChart, ResponsiveContainer, Cell } from "recharts";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";
export default function DonutCard({
  title,
  icon: Icon,
  data,
  name,
  total,
  colors = [
    "#3b82f6", // Blau
    "#ec4899", // Indigo
    "#10b981", // Grün
    "#f59e0b", // Gelb
    "#ef4444", // Rot
    "#8b5cf6", // Violett
    "#6366f1", // Pink
  ],
}: {
  title: string;
  name: string;
  icon: LucideIcon;
  total: number;
  data: { name: string; value: number }[];
  colors?: string[];
}) {
  const animationEnabled = useAnimationsEnabled();
  const accessColor = useAccentColor();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const { language } = useLanguage();
  const tooltipStyle = useChartTooltipStyle();

  function cleanDiagramName(name: string) {
    return name
      .replace(/^SysML\s*/i, "")
      .replace(/Diagram/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col  h-full flex-1 items-center justify-center  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4 text-center">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accessColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 flex flex-col  h-full flex-1">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h3 className="mb-1 text-xl dark:text-gray-200 font-semibold text-gray-800">
            {title}
          </h3>
          {Icon && <Icon className="w-8 h-8 text-gray-400" />}
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-gray-200">
          {data.length}
        </div>
        {typeof total === "number" && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            bei insgeamt {total} {name}
          </div>
        )}
      </div>
      <div className="flex flex-row  items-center justify-between h-full flex-1">
        {/* 🟩 Linke Seite: Legende */}
        <div className="flex flex-col flex-wrap gap-2 text-xs text-gray-600 w-1/2 pl-2">
          <div className="flex flex-col gap-1 dark:text-gray-200">
            {data.map((d, i) => (
              <div key={i} className="flex  items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                ></span>
                <span className="truncate">
                  {cleanDiagramName(d.name)} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🟦 Rechte Seite: Donut-Diagramm */}
        <div className="h-52 w-1/2 flex items-center justify-center">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                isAnimationActive={animationEnabled}
                paddingAngle={2}
                // ⛔ Keine Beschriftungen direkt am Kreis
                label={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
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
        </div>
      </div>
    </div>
  );
}
