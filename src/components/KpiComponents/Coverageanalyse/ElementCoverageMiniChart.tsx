"use client";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { useModel } from "@/context/ModelContext";

export default function ElementCoverageMiniChart() {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const { model } = useModel();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const tooltipStyle = useChartTooltipStyle();
  const { language } = useLanguage();

  const data = useMemo(() => {
    if (!model) return [];

    const elements = model.elements;

    const classes = elements.filter(
      (e) =>
        e.type?.toLowerCase() === "uml:class" &&
        e.package !== "(Diagrams)" &&
        e.package !== "(Unbekannt)"
    );

    const connectorCount = classes.reduce(
      (sum, c) => sum + (c.connectors?.length ?? 0),
      0
    );

    return [
      {
        type: "Class",
        count: classes.length,
      },
      {
        type: "Requirements",
        count: elements.filter(
          (e) =>
            e.type?.toLowerCase().includes("requirement") &&
            e.package !== "(Diagrams)" &&
            e.package !== "(Unbekannt)"
        ).length,
      },
      {
        type: "Port",
        count: elements.filter(
          (e) =>
            e.type?.toLowerCase() === "uml:port" &&
            e.package !== "(Diagrams)" &&
            e.package !== "(Unbekannt)"
        ).length,
      },
      {
        type: "Association",
        count: model.metrics.associations ?? 0,
      },
    ];
  }, [model]);

  const axisColor = theme === "dark" ? "#D1D5DB" : "#111827";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      <h3 className="text-md font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Layers className="w-5 h-5" style={{ color: accent }} />
        {translations[language].elementdistribution}
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
        {translations[language].elementdistributionLegend}
      </p>
    </section>
  );
}
