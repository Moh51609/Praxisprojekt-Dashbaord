"use client";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Layers } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";

import { useChartBackground } from "@/hooks/useChartBackground";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";

export default function ElementCoverageMiniChart() {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const tooltipStyle = useChartTooltipStyle();

  // 🔹 Daten beim ersten Render laden (wie im Donut)
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/xmi-elements");
        const json = await res.json();

        if (!res.ok)
          throw new Error(json.error || "Fehler beim Laden der Daten");

        const elements = json.elements ?? [];

        // 🔹 Fokus auf Haupttypen (Block, Requirement, Port, Connector)
        const categories = ["Class", "Requirements", "Port", "Connector"];

        const counts = categories.map((cat) => {
          const all = elements.filter((e: any) =>
            e.type?.toLowerCase().includes(cat.toLowerCase())
          );
          return { type: cat, count: all.length };
        });

        setData(counts);
        setLoading(false);
      } catch (e: any) {
        console.error("❌ Fehler beim Laden der Elementdaten:", e);
        setError(e.message);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  // 🔄 Ladezustände behandeln
  if (loading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <p className="text-center text-gray-500 dark:text-gray-300">
          Lädt Daten aus dem Modell …
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <p className="text-center text-red-500">Fehler: {error}</p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      <h3 className="text-md font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Layers className="w-5 h-5" style={{ color: accent }} />
        Elementverteilung
      </h3>

      <div className="relative rounded-2xl dark:bg-gray-800 bg-gray-50 p-4">
        {/* Hintergrund-Gitter */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            backgroundColor:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937"
                  : "#ffffff"
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)"
                  : "rgba(255,255,255,0.4)"
                : "transparent",
            backgroundImage:
              chartBackground === "grid"
                ? `
          linear-gradient(to right, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px),
          linear-gradient(to bottom, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px)
        `
                : "none",
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none",
            boxShadow:
              chartBackground === "transparent"
                ? "inset 0 0 20px rgba(255,255,255,0.05)"
                : "none",
          }}
        />

        <svg ref={svgRef} width="100%" height="230">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fill: axisColor, fontSize: 11 }}
                      width={90}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { type, count } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{type}</strong>
                            <div className="text-gray-600">{count}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" fill={accent} radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        Zeigt die Anzahl zentraler Elementtypen (Block, Requirement, Port,
        Connector).
      </p>
    </section>
  );
}
