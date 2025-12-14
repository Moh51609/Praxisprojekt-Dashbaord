"use client";

import { useEffect, useState } from "react";
import RelationsGraph from "@/components/RelationsComponents/RelationsGraph";
import { Link2, Network, GitBranch, ArrowUp, Cable } from "lucide-react";
import RelationsHeatmap from "@/components/KpiComponents/StructureQuality/RelationsHeatmap";
import { useAccentColor } from "@/hooks/useAccentColor";
import { usePageBackground } from "@/hooks/usePageBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import RelationTypeDonutChart from "@/components/RelationsComponents/RelationsTypeDonutChart";
import RelationsExportDropdown from "@/components/RelationsComponents/RelationsExportDropdown";
import { useModel } from "@/context/ModelContext";

export default function RelationsPage() {
  const [error, setError] = useState<string | null>(null);
  const accentColor = useAccentColor();
  const pageBackground = usePageBackground();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const { model } = useModel();

  const relations = model?.relationships ?? [];
  const elements = model?.elements ?? [];
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="p-10 space-y-2" />; // leeres Layout, keine Hydration konflikte
  }

  const relationTypeCounts = relations.reduce((acc, rel) => {
    const cleanType = rel.type?.replace(/^uml:|^sysml:/, ""); // Prefix entfernen
    acc[cleanType] = (acc[cleanType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const importantTypes = [
    "Connector",
    "Association",
    "Abstraction",
    "Generalization",
    "DeriveReqt",
    "Satisfy",
  ];

  const totalRelations = relations.length;

  const kpiItems = [
    {
      key: "totalRelations",
      title: translations[language].totalRelations,
      value: totalRelations,
      percent: 100,
      icon: <Link2 className="h-5 w-5" />,
    },
    ...importantTypes.map((type) => {
      const count = relationTypeCounts[type] ?? 0;
      const percent =
        totalRelations > 0 ? Math.round((count / totalRelations) * 100) : 0;

      return {
        key: type,
        title: type,
        value: count,
        percent,
        icon: <GitBranch className="h-5 w-5" />,
      };
    }),
    {
      key: "relationTypes",
      title: translations[language].coveredRelations,
      value: new Set(relations.map((r) => r.type)).size,
      percent:
        totalRelations > 0
          ? Math.round(
              (new Set(relations.map((r) => r.type)).size /
                importantTypes.length) *
                100
            )
          : 0,
      icon: <GitBranch className="h-5 w-5" />,
    },
  ];

  importantTypes.forEach((t) => {
    if (!(t in relationTypeCounts)) relationTypeCounts[t] = 0;
  });

  return (
    <main
      className="p-10 dark:bg-gray-900 bg-gray-300 min-h-screen space-y-6 min-w-[600px]"
      style={pageBackground}
    >
      <header className="flex items-center justify-between z-[9999]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Cable className="h-6 w-6 " style={{ color: accentColor }} />
          {translations[language].relations}
        </h1>
        <RelationsExportDropdown relations={relations} />
      </header>
      <div className="flex-col flex gap-6 ">
        <div className="grid grid-cols-1  [@media(min-width:1700px)]:grid-cols-[3.5fr_1.5fr]  [@media(min-width:1550px)]:grid-cols-1  gap-6">
          <div className="grid [@media(min-width:1350px)]:grid-cols-4 [@media(min-width:1150px)]:grid-cols-2 grid-cols-1 gap-4 items-stretch">
            {kpiItems.map((item) => (
              <KpiCard
                key={item.key}
                title={item.title}
                value={item.value}
                icon={item.icon}
                percent={item.percent}
              />
            ))}
          </div>

          <RelationTypeDonutChart relations={relations} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 [@media(min-width:1350px)]:grid-cols-2 gap-4">
          <RelationsGraph relations={relations} elements={elements} />

          <RelationsHeatmap relations={relations} />
        </div>
      </div>
    </main>
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
    <div className="rounded-xl dark:bg-gray-800 bg-white p-6 shadow-md  hover:shadow-xl transition space-y-3">
      <div className="flex flex-row justify-between">
        <div className="text-md font-semibold text-gray-800 dark:text-white">
          {title}
        </div>
        <div style={{ color: accentColor }}> {icon}</div>
      </div>
      <div className="mt-1 text-3xl dark:text-white font-bold text-gray-900">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {`${percent}% des Modells`}
      </div>
    </div>
  );
}
