"use client";

import {
  Home,
  BarChart3,
  Boxes,
  GitBranch,
  Settings,
  User2,
  Bug,
  Search,
  ArrowRightFromLine,
  Delete,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useState } from "react";

export default function Sidebar() {
  const accentColor = useAccentColor();
  const pathname = usePathname();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");

  return (
    <nav className="flex h-full flex-col gap-2 p-4 ">
      <div className="mb-4 flex items-center gap-2 pb-5">
        <div className="rounded-2xl">
          <a href="/">
            <img
              src="/MBSELogo2.png"
              alt="MBSE Logo"
              className="h-12 w-12 object-contain rounded-lg"
            />
          </a>
        </div>
        <div className="font-semibold dark:text-gray-300 text-black">
          SysSight
        </div>
      </div>

      <Section title="Generell">
        <Item
          icon={<Home size={18} />}
          label={translations[language].overview}
          href="/Dashboard"
          active={pathname === "/"}
        />
        <Item
          icon={<BarChart3 size={18} />}
          label="KPIs"
          href="/KPIs"
          active={pathname === "/KPIs"}
        />
        <Item
          icon={<Boxes size={18} />}
          label={translations[language].elements}
          href="/Elements"
          active={pathname === "/Elements"}
        />
        <Item
          icon={<GitBranch size={18} />}
          label={translations[language].relations}
          href="/Relations"
          active={pathname === "/Relations"}
        />
        <Item
          icon={<Bug size={18} />}
          label="Validation Suits"
          href="/validationSuits"
          active={pathname === "/validationSuits"}
        />
        <div className="px-2 mt-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-2 relative">
            <Search className="text-gray-500" size={16} />

            <input
              type="text"
              placeholder="Suche..."
              value={query}
              className="bg-transparent w-full outline-none text-sm dark:text-white"
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);

                window.dispatchEvent(
                  new CustomEvent("global-search", { detail: value })
                );
              }}
            />

            {/* ❌ CLEAR BUTTON */}
            {query.length > 0 && (
              <button
                onClick={() => {
                  setQuery("");
                  window.dispatchEvent(
                    new CustomEvent("global-search", { detail: "" })
                  );
                }}
                className="absolute right-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-tree"))}
            className="px-2 py-2 w-full text-sm rounded-lg text-gray-700 dark:text-white dark:hover:bg-gray-900 hover:bg-gray-100 transition"
          >
            <div className="flex gap-2">
              <span className="text-gray-500 ">
                <ArrowRightFromLine className="h-5 w-5" />
              </span>

              <span className="truncate"> Hierarchischer Aufbau</span>
            </div>
          </button>
        </div>
      </Section>

      <div className="border-1 border-gray-300 w-full "></div>

      <Section title="Account">
        <Item
          icon={<Settings size={18} />}
          label={translations[language].settings}
          href="/Settings"
          active={pathname === "/Settings"}
        />
      </Section>

      <div className="mt-auto rounded-xl dark:bg-gray-600 bg-indigo-50 p-3">
        <div className="mb-2 text-sm font-medium">
          {translations[language].needSupport}
        </div>
        <p className="mb-3 text-xs text-gray-600 dark:text-white">
          {translations[language].writeUs}
        </p>
        <button
          className="w-full rounded-lg transition-colors px-3 py-2 text-sm text-white"
          style={{ backgroundColor: accentColor }}
        >
          {translations[language].support}
        </button>
      </div>
    </nav>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2 text-xs font-semibold uppercase dark:text-gray-300 tracking-wide text-gray-500">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Item({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={[
        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
        active
          ? "bg-gray-100 dark:bg-gray-600 dark:text-white font-medium text-gray-900"
          : "text-gray-700 dark:text-white dark:hover:bg-gray-900 hover:bg-gray-100",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span className="text-gray-500">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}
