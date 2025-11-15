"use client";

import { ParsedModel } from "@/types/model";
import { ChevronsLeftRightEllipsis } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function PortDirectionKpi({ data }: { data: ParsedModel }) {
  const { language } = useLanguage();

  return (
    <section>
      <div className="bg-white p-6 dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-2">
          <ChevronsLeftRightEllipsis className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          <h2 className="text-lg font-semibold dark:text-gray-200">
            {translations[language].wrongPorts}
          </h2>
        </div>
        <p
          className={`text-4xl font-bold ${
            data.metrics.portDirectionIssues === 0
              ? "text-green-500"
              : data.metrics.portDirectionIssues! < 5
              ? "text-yellow-500"
              : "text-red-500"
          }`}
        >
          {data.metrics.portDirectionIssues ?? 0}
        </p>
        <p className="text-xs text-gray-500 mt-2 dark:text-white">
          {translations[language].wrongPortsDesc}
        </p>
      </div>
    </section>
  );
}
