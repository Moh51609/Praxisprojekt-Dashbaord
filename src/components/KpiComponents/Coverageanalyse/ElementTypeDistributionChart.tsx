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

export default function ElementTypeDistributionChart() {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  // 📦 API-Daten
  const [packages, setPackages] = useState<string[]>([]);
  const [typeCountsByPackage, setTypeCountsByPackage] = useState<
    Record<string, Record<string, number>>
  >({});
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  // 🔹 Daten beim ersten Render laden
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/xmi-elements");
        const json = await res.json();

        if (!res.ok)
          throw new Error(json.error || "Fehler beim Laden der Daten");

        setTypeCountsByPackage(json.typeCountsByPackage);
        const pkgNames = Object.keys(json.typeCountsByPackage);
        setPackages(pkgNames);
        setSelectedPackage(pkgNames[0] || "Root");
        setLoading(false);
      } catch (e: any) {
        console.error("❌ Fehler beim Laden der Elementdaten:", e);
        setError(e.message);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 🔹 Typverteilung für das gewählte Package berechnen
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

  // 🔄 Ladezustände behandeln
  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <p className="text-center text-gray-500 dark:text-gray-300">
          Lädt Daten aus dem Modell …
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <p className="text-center text-red-500">Fehler: {error}</p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="h-5 w-5" style={{ color: accent }} />
          {translations[language].elementTypePerPackage}
        </h2>

        {/* 🔽 Package-Auswahl */}
        <Select value={selectedPackage} onValueChange={setSelectedPackage}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Package auswählen" />
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

      {/* Chart */}
      {/* Chart */}
      {/* Chart */}
      {typeCounts.length > 0 ? (
        <div className="w-full h-[250px] flex flex-row items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 50, bottom: 20, left: 0 }}>
              <Pie
                data={typeCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
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

              {/* ✅ Legende innerhalb des gleichen Charts */}
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
