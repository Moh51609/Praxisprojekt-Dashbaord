"use client";
import { AlertTriangle } from "lucide-react";
import { ParsedModel } from "@/types/model";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function RedundantElementsCard({ data }: { data: ParsedModel }) {
  const count = data.metrics.redundantElements ?? 0;
  const { language } = useLanguage();
  const color =
    count === 0
      ? "text-green-500"
      : count < 5
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="bg-white p-6 dark:bg-gray-800 rounded-2xl shadow-sm flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="dark:text-gray-200 h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-semibold">
          {translations[language].redundantElements}
        </h2>
      </div>
      <p className={`text-4xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-gray-500 mt-2 dark:text-white">
        {translations[language].redundantElementsDesc}
      </p>
    </div>
  );
}
