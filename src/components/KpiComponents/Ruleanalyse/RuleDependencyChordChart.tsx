"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { CircleDot } from "lucide-react";

export default function RuleDependencyChordChart({ rules }: { rules: any[] }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const accentColor = useAccentColor();
  const { theme } = useTheme();
  const { language } = useLanguage();

  useEffect(() => {
    if (!ref.current || !rules?.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 480;
    const height = 480;
    const innerRadius = Math.min(width, height) * 0.4;
    const outerRadius = innerRadius * 1.1;

    const g = svg
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .append("g");

    // 🔹 Beispielhafte Verknüpfungen simulieren (später aus echten Daten generierbar)
    const matrix = rules.map((r1, i) =>
      rules.map((r2, j) =>
        i === j
          ? 0
          : Math.round(
              (r1.violations + r2.violations) / 2 / (Math.random() * 4 + 2)
            )
      )
    );

    const chord = d3
      .chordDirected()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)(matrix);

    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(rules.map((r) => r.id));

    // 🔹 Ribbon connections
    g.append("g")
      .selectAll("path")
      .data(chord)
      .join("path")
      .attr("d", d3.ribbonArrow().radius(innerRadius - 10))
      .style("fill", (d) => colorScale(rules[d.target.index].id))
      .style(
        "stroke",
        (d) =>
          d3.color(colorScale(rules[d.target.index].id))?.darker(1) as string
      )
      .style("opacity", 0.75);

    // 🔹 Outer rule labels
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const group = g.append("g").selectAll("g").data(chord.groups).join("g");

    group
      .append("path")
      .attr("d", arc as any)
      .style("fill", (d) => colorScale(rules[d.index].id))
      .style("stroke", theme === "dark" ? "#111827" : "#e5e7eb");

    group
      .append("text")
      .each((d: any) => (d.angle = (d.startAngle + d.endAngle) / 2))
      .attr("dy", ".35em")
      .attr(
        "transform",
        (d: any) => `
        rotate(${(d.angle * 180) / Math.PI - 90})
        translate(${outerRadius + 10})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `
      )
      .attr("text-anchor", (d: any) => (d.angle > Math.PI ? "end" : "start"))
      .style("font-size", "11px")
      .style("fill", theme === "dark" ? "#F3F4F6" : "#111827")
      .text((d, i) => rules[i].id);

    // 🔹 Titel Hover-Effekt
    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "fixed text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 pointer-events-none shadow"
      )
      .style("opacity", 0);

    g.selectAll("path")
      .on("mouseover", (e, d: any) => {
        const source = rules[d.source.index].id;
        const target = rules[d.target.index].id;
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${source} → ${target}</strong><br/>Gemeinsame Verstöße: ${d.source.value}`
          )
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }, [rules, theme, accentColor]);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-row justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <CircleDot className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].ruleDependencies || "Regelabhängigkeiten"}
        </h2>
      </div>

      <div className="flex justify-center">
        <svg ref={ref} width="480" height="480" />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 text-center">
        {translations[language].ruleDependenciesDesc ||
          "Zeigt, welche Regeln häufig gemeinsam verletzt werden."}
      </p>
    </section>
  );
}
