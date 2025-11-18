"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { Activity } from "lucide-react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useChartTooltipStyle } from "@/hooks/useChartTooltipStyle";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function OverallKpiTrendChart({
  history = [
    { date: "01.10", rules: 75, coverage: 52, smells: 28, structure: 83 },
    { date: "05.10", rules: 78, coverage: 60, smells: 25, structure: 85 },
    { date: "09.10", rules: 81, coverage: 66, smells: 22, structure: 87 },
    { date: "13.10", rules: 83, coverage: 71, smells: 19, structure: 89 },
    { date: "17.10", rules: 85, coverage: 74, smells: 17, structure: 91 },
  ],
}) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const tooltipStyle = useChartTooltipStyle();
  const { language } = useLanguage();

  useEffect(() => {
    if (!zoomRef.current || !chartZoom) return;

    const svg = d3.select(zoomRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>() // ✅ richtige Typen
      .scaleExtent([0.5, 3]) // ✅ Zoom-Level
      .on("zoom", (event: any) => {
        setTransform(event.transform);
      });

    svg.call(zoom as any); // ✅ “as any” killt TS-Fehler, aber D3 bleibt funktionsfähig

    return () => {
      svg.on(".zoom", null); // Cleanup
    };
  }, [chartZoom]);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Activity className="h-5 w-5" style={{ color: accent }} />
          {translations[language].overallTrend}
        </h2>
      </div>

      {/* Chart-Hintergrund */}
      <div className="relative rounded-2xl dark:bg-gray-800 bg-gray-50 p-4">
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
          }}
        />

        {/* Chart selbst */}
        <svg ref={svgRef} width="100%" height="200">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history}
                    margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: textColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: textColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const { date, rules, coverage, smells, structure } =
                          payload[0].payload;
                        return (
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{date}</strong>
                            <div className="text-gray-600">
                              Struktur: {structure}
                            </div>
                            <div className="text-gray-600">Regeln: {rules}</div>
                            <div className="text-gray-600">
                              Abdeckung: {coverage}
                            </div>
                            <div className="text-gray-600">
                              Smells: {smells}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={30}
                      wrapperStyle={{
                        color: textColor,
                        fontSize: "11px",
                      }}
                    />
                    <ReferenceLine y={0} stroke={accent} />

                    {/* Linien für jede KPI-Sektion */}
                    <Line
                      type="monotone"
                      dataKey="rules"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={translations[language].ruleConformance}
                    />
                    <Line
                      type="monotone"
                      dataKey="coverage"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={translations[language].coverage}
                    />
                    <Line
                      type="monotone"
                      dataKey="smells"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={translations[language].modelSmells}
                    />
                    <Line
                      type="monotone"
                      dataKey="structure"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={translations[language].structureQualitiy}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {translations[language].overallTrendLegend}
      </p>
    </section>
  );
}
