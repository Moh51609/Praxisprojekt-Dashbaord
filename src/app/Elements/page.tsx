"use client";
import React, { JSX, useEffect, useState } from "react";
import {
  Layers3,
  GitBranch,
  Boxes,
  Link2,
  ArrowUp,
  Box,
  Package,
  Plug,
  Share2,
  Spline,
  Network,
  Workflow,
  Component,
} from "lucide-react";
import ElementsNetworkGraph from "@/components/ElementComponents/ElementsNetworkGraph";
import { useAccentColor } from "@/hooks/useAccentColor";
import { usePageBackground } from "@/hooks/usePageBackground";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";

import { ParsedModel } from "@/types/model";
import ElementTable from "@/components/ElementComponents/ElementTable";
import ElementTypeDonutChart from "@/components/ElementComponents/ElementTypeDonutChart";
import ExportDropdown from "@/components/ElementComponents/ExportDropdown";
import { Label } from "recharts";

export default function Elements() {
  type CountByType = { name: string; value: number };

  const [elements, setElements] = useState<any[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, distinctTypes: 0 });
  const [relations, setRelations] = useState<any[]>([]);
  const [diagramTypes, setDiagramTypes] = useState<Record<string, number>>({});
  const accentColor = useAccentColor();
  const pageBackground = usePageBackground();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [byType, setByType] = useState<CountByType[]>([]);

  const ELEMENT_TYPE_ICONS: Record<
    string,
    { icon: JSX.Element; color: string; label: String }
  > = {
    Class: {
      icon: <Boxes />,
      color: accentColor,
      label: translations[language].blocks,
    },
    Port: {
      icon: <Plug />,
      color: accentColor,
      label: translations[language].ports,
    },
    Property: {
      icon: <Box />,
      color: accentColor,
      label: translations[language].properties,
    },
    Diagram: {
      icon: <Package />,
      color: accentColor,
      label: translations[language].diagrams,
    },
    Requirements: {
      icon: <Package />,
      color: accentColor,
      label: "Requirement",
    },
    Package: {
      icon: <Package />,
      color: accentColor,
      label: translations[language].packages,
    },
  };

  useEffect(() => {
    fetch("/api/xmi-elements")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) return setError(json.error);

        setElements(json.elements);
        setTypeCounts(json.typeCounts);
        setStats({
          total: json.totalElements,
          distinctTypes: json.distinctTypes,
        });
        setDiagramTypes(json.diagramTypes);
        setRelations(json.relations);
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">Fehler: {error}</div>;
  }

  if (!mounted) {
    return <div className="p-10 space-y-2" />; // leeres Layout, keine Hydration konflikte
  }

  return (
    <div
      className="p-10 space-y-2 bg-gray-300 dark:bg-gray-900 min-w-[600px] min-h-screen"
      style={pageBackground}
    >
      <header className="flex items-center justify-between z-[9999]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 z-200">
          <Component className="h-6 w-6" style={{ color: accentColor }} />
          {translations[language].elements}
        </h1>

        {<ExportDropdown data={elements} />}
      </header>
      <div className="grid grid-cols-1 [@media(min-width:1700px)]:grid-cols-[3.5fr_1.5fr]  [@media(min-width:1550px)]:grid-cols-1  gap-6 py-4">
        <div className="grid   [@media(min-width:1350px)]:grid-cols-4 [@media(min-width:1150px)]:grid-cols-2 grid-cols-1 gap-4 items-stretch">
          <KpiCard
            title={translations[language].totalElements}
            icon={<Link2 style={{ color: accentColor }} />}
            value={elements.length}
            percent={100}
          />
          {Object.entries(ELEMENT_TYPE_ICONS).map(([type, cfg]) => {
            const count = typeCounts[type] ?? 0;

            const percent =
              elements.length > 0
                ? Math.round((count / elements.length) * 100)
                : 0;

            return (
              <KpiCard
                key={type}
                title={cfg.label.toString()}
                value={count}
                percent={percent}
                icon={React.cloneElement(cfg.icon, {
                  style: { color: cfg.color },
                })}
              />
            );
          })}

          <KpiCard
            title={translations[language].coveredElementTypes}
            icon={<GitBranch />}
            value={stats.distinctTypes}
            percent={100}
          />
        </div>

        {/* 🔸 Rechte Seite – Donut Diagramm */}
        <ElementTypeDonutChart typeCounts={typeCounts} />
      </div>

      {elements && <ElementTable data={elements} />}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  percent,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  percent: number;
}) {
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  return (
    <div className="rounded-xl dark:bg-gray-800 bg-white p-6 shadow-md   hover:shadow-xl transition space-y-3">
      <div className="flex flex-row justify-between">
        <div className="text-md font-semibold text-gray-800 dark:text-white">
          {title}
        </div>
        <div className="" style={{ color: accentColor }}>
          {icon}
        </div>
      </div>
      <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div>{`${percent}% des Modells`}</div>
    </div>
  );
}
