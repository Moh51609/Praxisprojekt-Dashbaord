"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { Compass } from "lucide-react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useRef, useState } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function SystemCoverageRadarChart({
  data,
  relations,
}: {
  data: any;
  relations: any[];
}) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const { language } = useLanguage();

  // 🔹 Alle IDs, die in Relationen vorkommen
  const relatedIds = new Set(
    relations?.flatMap((r) => [r.source, r.target]) ?? []
  );

  // 🔹 Definiere Kategorien + Suchmuster (regex für flexible Erkennung)
  const typeMap: Record<string, RegExp[]> = {
    Block: [/block/i, /sysmlblock/i, /bdd/i, /blockdefinition/i],
    Requirement: [/requirement/i, /anforderung/i],
    Port: [/port/i],
    Connector: [/connector/i, /connection/i, /link/i],
    Package: [/package/i, /pkg/i],
  };

  // 🔹 Berechne pro Kategorie die Abdeckungsquote (%)
  const coverage = Object.entries(typeMap).map(([category, patterns]) => {
    const all = (data?.elements ?? []).filter((e: any) =>
      patterns.some((p) => p.test(e.type ?? ""))
    );
    const linked = all.filter((e: any) => relatedIds.has(e.id));
    const ratio = all.length > 0 ? (linked.length / all.length) * 100 : 0;

    return { category, abdeckung: Math.round(ratio) };
  });

  // 🔹 Falls keine Daten erkannt wurden → Debug-Info
  if (!coverage.some((c) => c.abdeckung > 0)) {
    console.warn(
      "⚠️ Keine passenden Typen im Radar gefunden. Typnamen prüfen:",
      data?.elements?.slice(0, 5)
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Compass className="h-5 w-5" style={{ color: accent }} />
        {translations[language].systemicCoverage}
      </h2>

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

        <svg ref={svgRef} width="100%" height="250">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={coverage}>
                    <PolarGrid
                      stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                      gridType="polygon"
                    />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{
                        fill: theme === "dark" ? "#D1D5DB" : "#111827",
                        fontSize: 12,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{
                        fill: theme === "dark" ? "#9CA3AF" : "#4B5563",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { category, abdeckung } = payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{category}</strong>
                            <div className="text-gray-600">{abdeckung}</div>
                          </div>
                        );
                      }}
                    />
                    <Radar
                      name="Abdeckung"
                      dataKey="abdeckung"
                      stroke={accent}
                      fill={accent}
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].systemicCoverageLegend}
      </p>
    </section>
  );
}
