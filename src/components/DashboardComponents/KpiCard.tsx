"use client";
import { ParsedModel } from "@/types/model";
import { ArrowUp, ChevronDown, LucideIcon } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useLanguage } from "@/hooks/useLanguage";
import { transcode } from "buffer";
import { translations } from "@/lib/i18n";

export default function KpiCard({
  total,
  title,
  value,
  icon: Icon,
}: {
  total?: number;
  title: string;
  value: number;
  icon?: LucideIcon;
}) {
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  return (
    <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 hover:shadow-xl transition space-y-3">
      <div className="flex flex-row justify-between">
        <div className="text-xl dark:text-gray-200 font-semibold text-gray-800">
          {title}
        </div>
        {Icon && <Icon className="w-8 h-8" style={{ color: accentColor }} />}
      </div>
      <div className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-200">
        {value}
      </div>
      {typeof total === "number" && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          von insgesamt {total} {translations[language].elements}
        </div>
      )}
    </div>
  );
}
