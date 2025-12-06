"use client";
import { ParsedModel } from "@/types/model";
import { ArrowUp, ChevronDown, LucideIcon } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useLanguage } from "@/hooks/useLanguage";
import { transcode } from "buffer";
import { translations } from "@/lib/i18n";

export default function KpiCard({
  data,
  title,
  value,
  icon: Icon,
}: {
  data: ParsedModel;
  title: string;
  value: number;
  icon?: LucideIcon;
}) {
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  return (
    <div className="rounded-xl bg-white p-6 shadow-md w-full dark:bg-gray-800 hover:shadow-xl transition space-y-3">
      <div className="flex flex-row justify-between">
        <div className="text-xl dark:text-gray-200 font-semibold text-gray-800">
          {title}
        </div>
        {Icon && <Icon className="w-8 h-8" style={{ color: accentColor }} />}
      </div>
      <div className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-200">
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
