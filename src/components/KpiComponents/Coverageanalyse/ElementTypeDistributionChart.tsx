"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Layers } from "lucide-react";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { useModel } from "@/context/ModelContext";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

export default function ElementTypeDistributionChart() {
  const accent = useAccentColor();
  const { theme } = useTheme();

  const { language } = useLanguage();
  const useAnimation = useAnimationsEnabled();
  const { model } = useModel();
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);
  const { packages, typeCountsByPackage } = useMemo(() => {
    if (!model) {
      return { packages: [], typeCountsByPackage: {} };
    }

    const map: Record<string, Record<string, number>> = {};

    model.elements.forEach((el) => {
      const pkg = el.package ?? "(Unbekannt)";
      const type = el.type?.replace(/^uml:|^sysml:/, "") ?? "Unknown";

      if (!map[pkg]) map[pkg] = {};
      map[pkg][type] = (map[pkg][type] ?? 0) + 1;
    });

    const filteredMap = Object.fromEntries(
      Object.entries(map).filter(([pkg]) => pkg !== "(Diagrams)")
    );

    return {
      packages: Object.keys(filteredMap).sort(),
      typeCountsByPackage: filteredMap,
    };
  }, [model]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  useEffect(() => {
    if (!selectedPackage && packages.length > 0) {
      setSelectedPackage(packages[0]);
    }
  }, [packages, selectedPackage]);

  const typeCounts = useMemo(() => {
    const pkgData = typeCountsByPackage[selectedPackage];
    if (!pkgData) return [];

    return Object.entries(pkgData).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [selectedPackage, typeCountsByPackage]);

  const COLORS = [
    accent,
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#6366f1",
    "#84cc16",
    "#ec4899",
  ];

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  function truncatePath(path: string, maxLength = 28) {
    if (path.length <= maxLength) return path;
    return "…" + path.slice(path.length - maxLength);
  }

  const hasData = typeCounts.length > 0;

  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl h-[400px]  shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].elementTypePerPackage}
        </h2>

        {translations[language].noData}
      </section>
    );
  }

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[400px] items-center flex justify-center flex-col shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accent }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: accent }} />
          {translations[language].elementTypePerPackage}
        </h2>

        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
          <SelectTrigger className="w-[220px]">
            <SelectValue>
              <span className="block max-w-[180px] truncate">
                {truncatePath(selectedPackage)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {packages.map((pkg) => (
              <SelectItem key={pkg} value={pkg}>
                {pkg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {typeCounts.length > 0 ? (
        <div className="w-full h-[250px] flex flex-row items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 50, bottom: 20, left: 0 }}>
              <Pie
                data={typeCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                isAnimationActive={useAnimation}
              >
                {typeCounts.map((_, i) => (
                  <Cell
                    key={i}
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
                  lineHeight: "25px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
          Keine Elemente in diesem Package gefunden.
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].elementTypePerPackageLegend}
      </p>
    </section>
  );
}
