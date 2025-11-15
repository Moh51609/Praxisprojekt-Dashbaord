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

export default function Elements() {
  type CountByType = { name: string; value: number };

  const [elements, setElements] = useState<any[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedModel | null>(null);
  const [stats, setStats] = useState({ total: 0, distinctTypes: 0 });
  const accentColor = useAccentColor();
  const pageBackground = usePageBackground();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
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
      label: translations[language].packages,
    },
    Requirements: {
      icon: <Package />,
      color: accentColor,
      label: translations[language].packages,
    },
    Package: {
      icon: <Package />,
      color: accentColor,
      label: translations[language].packages,
    },
  };

  useEffect(() => {
    fetch("/api/xmi")
      .then((r) => r.json())
      .then((j: ParsedModel | { error: string }) => {
        if ("error" in j) {
          setError(j.error);
          return;
        }
        setData(j);

        // 1) Counter-Record aufbauen (explizit typisieren!)
        const countsByType: Record<string, number> = j.elements.reduce(
          (acc: Record<string, number>, e) => {
            acc[e.type] = (acc[e.type] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // 2) In Array<{name, value}> umwandeln (Tupeltyp angeben!)
        const byTypeArr: CountByType[] = Object.entries(countsByType).map(
          ([name, value]: [string, number]) => ({ name, value })
        );

        setByType(byTypeArr);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    fetch("/api/xmi-elements")
      .then((r) => r.json())
      .then((j) => {
        if ("error" in j) setError(j.error);
        else {
          setElements(j.elements);
          setTypeCounts(j.typeCounts);
          setStats({ total: j.total, distinctTypes: j.distinctTypes });
        }
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">Fehler: {error}</div>;
  }

  return (
    <div
      className="p-10 space-y-2 bg-gray-300 dark:bg-gray-900"
      style={pageBackground}
    >
      <header className="flex items-center justify-between z-[9999]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 z-200">
          <Component className="h-6 w-6" style={{ color: accentColor }} />
          {translations[language].elements}
        </h1>

        {data && <ExportDropdown data={data} />}
      </header>
      <div className="grid grid-cols-1 xl:grid-cols-[3.5fr_1.5fr] gap-6 py-4">
        {/* 🔹 Linke Seite – KPI-Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
          <KpiCard
            title={translations[language].totalElements}
            icon={<Link2 style={{ color: accentColor }} />}
            value={132}
          />
          {Object.keys(ELEMENT_TYPE_ICONS).map((type) => {
            const { icon, color } = ELEMENT_TYPE_ICONS[type];
            return (
              <KpiCard
                key={type}
                title={translations[language][type.toLowerCase()] ?? type}
                value={typeCounts[type] ?? 0}
                icon={React.cloneElement(icon, { className: `${color}` })}
              />
            );
          })}
          <KpiCard
            title={translations[language].coveredElementTypes}
            icon={<GitBranch />}
            value={stats.distinctTypes}
          />
        </div>

        {/* 🔸 Rechte Seite – Donut Diagramm */}
        {data && <ElementTypeDonutChart data={data} />}
      </div>

      {data && <ElementTable data={data} />}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
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
      <div className="flex gap-1 items-center ">
        <ArrowUp className="h-3 w-3 text-green-500" />
        <div className="font-bold text-xs text-green-500">5</div>
        <div className="text-xs text-gray-500 font-medium">
          {translations[language].sinceLastCommit}
        </div>
      </div>
    </div>
  );
}
