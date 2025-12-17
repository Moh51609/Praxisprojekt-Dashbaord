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
import { useRef, useState, useMemo, useEffect } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { UmlElement } from "@/types/model";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

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
  const useAnimaton = useAnimationsEnabled();

  useEffect(() => {
    if (!svgRef.current || !chartZoom) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => setTransform(event.transform));

    svg.call(zoom as any);
    return () => {
      svg.on(".zoom", null);
    };
  }, [chartZoom]);

  const relatedIds = new Set(
    relations?.flatMap((r) => [r.source, r.target]) ?? []
  );

  const coverage = useMemo(() => {
    if (!data) return [];

    const elements = data.elements ?? [];
    const rels = relations ?? [];

    const relatedIds = new Set<string>();
    rels.forEach((r) => {
      if (r.source) relatedIds.add(r.source);
      if (r.target) relatedIds.add(r.target);
    });

    const blocks = elements.filter(
      (e: UmlElement) =>
        e.type === "uml:Class" &&
        e.package !== "(Diagrams)" &&
        e.package !== "(Unbekannt)"
    );

    const connectedBlocks = blocks.filter(
      (b: UmlElement) =>
        elements.some(
          (child: UmlElement) =>
            child.parentId === b.id && relatedIds.has(child.id)
        ) || relatedIds.has(b.id)
    );

    const requirements = elements.filter((e: UmlElement) =>
      e.type?.toLowerCase().includes("requirement")
    );

    const connectedRequirements = requirements.filter((r: UmlElement) =>
      relatedIds.has(r.id)
    );

    const ports = elements.filter((e: UmlElement) => e.type === "uml:Port");

    const connectedPorts = ports.filter(
      (p: UmlElement) =>
        relatedIds.has(p.id) || (p.parentId && relatedIds.has(p.parentId))
    );

    const associations = data.metrics.associations;

    const packages = elements.filter(
      (e: UmlElement) => e.type === "uml:Package"
    );

    const nonEmptyPackages = packages.filter((p: UmlElement) =>
      elements.some(
        (e: UmlElement) => e.package === p.name && e.type !== "uml:Package"
      )
    );

    return [
      {
        category: "Block",
        abdeckung: blocks.length
          ? Math.round((connectedBlocks.length / blocks.length) * 100)
          : 0,
      },
      {
        category: "Requirement",
        abdeckung: requirements.length
          ? Math.round(
              (connectedRequirements.length / requirements.length) * 100
            )
          : 0,
      },
      {
        category: "Port",
        abdeckung: ports.length
          ? Math.round((connectedPorts.length / ports.length) * 100)
          : 0,
      },
      {
        category: "Association",
        abdeckung: data.metrics.associations > 0 ? 100 : 0,
      },

      {
        category: "Package",
        abdeckung: packages.length
          ? Math.round((nonEmptyPackages.length / packages.length) * 100)
          : 0,
      },
    ];
  }, [data, relations]);

  const hasData = coverage.some((c) => c.abdeckung > 0);

  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl h-[465px]  shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].systemicCoverage}
        </h2>

        {translations[language].noData}
      </section>
    );
  }

  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();
  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[425px] items-center flex justify-center flex-col shadow-sm">
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
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Compass className="h-5 w-5" style={{ color: accent }} />
        {translations[language].systemicCoverage}
      </h2>

      <div className="relative rounded-2xl p-4">
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
          }}
        />

        <svg ref={svgRef} width="100%" height="250">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
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
                        <div className="bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                          <strong>{category}</strong>
                          <div className="text-gray-600">{abdeckung} %</div>
                        </div>
                      );
                    }}
                  />
                  <Radar
                    dataKey="abdeckung"
                    stroke={accent}
                    fill={accent}
                    fillOpacity={0.45}
                    isAnimationActive={useAnimaton}
                  />
                </RadarChart>
              </ResponsiveContainer>
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
