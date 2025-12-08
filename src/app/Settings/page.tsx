"use client";

import {
  Moon,
  Sun,
  Palette,
  Database,
  Sliders,
  Globe,
  Trash2,
  Settings,
  Coffee,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAccentColor } from "@/hooks/useAccentColor";
import { usePageBackground } from "@/hooks/usePageBackground";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { debug } from "console";
import { translations } from "@/lib/i18n";
import { useLocalStoragePermission } from "@/hooks/useLocalStoragePermission";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const accentColor = useAccentColor();
  const pageBackground = usePageBackground();
  const [zoomEnabled, setZoomEnabled] = useState(true);

  const [autoLoad, setAutoLoad] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const allow = useLocalStoragePermission();
  const [showConfirm, setShowConfirm] = useState(false);
  // verhindert Fehler beim Server-Side-Rendering
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const savedAccent = localStorage.getItem("accent-color");
    if (savedAccent) {
      document.documentElement.setAttribute("data-accent", savedAccent);
      console.debug(savedAccent);
    }
    const savedAnimation = localStorage.getItem("animations-enabled");
    if (savedAnimation !== null) {
      setAnimationEnabled(savedAnimation === "true");
    } else {
      if (allow) {
        localStorage.setItem("animations-enabled", "true");
      }
      setAnimationEnabled(true);
    }

    const savedZoom = localStorage.getItem("chart-zoom");
    setZoomEnabled(savedZoom !== "false");

    const loadChart = localStorage.getItem("auto-load-charts");
    setAutoLoad(loadChart !== "false");

    const enableStorage = localStorage.getItem("local-storage-enabled");
    setAllowed(enableStorage !== "false");
  }, []);

  const toggleAnimation = (checked: boolean) => {
    setAnimationEnabled(checked);
    if (allow) {
      localStorage.setItem("animations-enabled", String(checked));
    }
    window.dispatchEvent(new Event("animations-setting-changed"));
  };

  if (!mounted) return null;

  return (
    <main
      className="p-8 bg-gray-100 dark:bg-gray-900  space-y-8 transition-colors duration-300 min-h-[600px]"
      style={pageBackground}
    >
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-6 w-6 " style={{ color: accentColor }} />
          {translations[language].settings}
        </h1>
      </header>
      <div className="grid grid-cols-1 [@media(min-width:1450px)]:grid-cols-2 gap-6">
        {/* 🌓 Erscheinungsbild */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-all">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Palette className="h-5 w-5" style={{ color: accentColor }} />
            {translations[language].appearance}
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            {/* 🔹 Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <span>{translations[language].darkMode}</span>
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-yellow-500" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
                <Moon className="h-4 w-4 text-indigo-400" />
              </div>
            </div>

            {/* 🔹 Akzentfarbe */}
            <div className="flex items-center justify-between">
              <span>{translations[language].accentColor}</span>
              <Select
                onValueChange={(value) => {
                  console.log("🎨 Akzentfarbe geändert auf:", value);
                  document.documentElement.setAttribute("data-accent", value);
                  if (allow) {
                    localStorage.setItem("accent-color", value);
                  }
                }}
                defaultValue={
                  typeof window !== "undefined"
                    ? localStorage.getItem("accent-color") ?? "indigo"
                    : "indigo"
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Indigo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indigo">
                    {translations[language].indigo}
                  </SelectItem>
                  <SelectItem value="emerald">
                    {translations[language].green}
                  </SelectItem>
                  <SelectItem value="rose">
                    {translations[language].red}
                  </SelectItem>
                  <SelectItem value="amber">
                    {translations[language].yellow}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🔹 Kartenlayout */}
            <div className="flex items-center justify-between">
              <span>{translations[language].backgroundPattern}</span>
              <Select
                onValueChange={(value) => {
                  if (allow) {
                    localStorage.setItem("bg-pattern", value);
                  }
                  window.dispatchEvent(new Event("bg-pattern-changed"));
                }}
                defaultValue={localStorage.getItem("bg-pattern") ?? "none"}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Kein Muster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {translations[language].patternNone}
                  </SelectItem>
                  <SelectItem value="grid">
                    {translations[language].patternGrid}
                  </SelectItem>
                  <SelectItem value="dots">
                    {translations[language].patternDots}
                  </SelectItem>
                  <SelectItem value="geo">
                    {translations[language].patternGeo}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* 📊 Daten & Diagramme */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-all">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Database className="h-5 w-5 " style={{ color: accentColor }} />
            {translations[language].dataAndCharts}
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>{translations[language].maxElements}</span>
              <Slider
                defaultValue={[50]}
                max={500}
                step={10}
                className="w-40"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].chartZoom}</span>
              <Switch
                checked={zoomEnabled}
                onCheckedChange={(checked) => {
                  setZoomEnabled(checked);
                  if (allow) {
                    localStorage.setItem("chart-zoom", String(checked));
                  }
                  window.dispatchEvent(new Event("chart-zoom-changed"));
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].autoLoadCharts}</span>
              <Switch
                checked={
                  allow
                    ? localStorage.getItem("auto-load-charts") !== "false"
                    : autoLoad // wenn Speicherung deaktiviert → nutze lokalen State
                }
                onCheckedChange={(checked) => {
                  setAutoLoad(checked);
                  if (allow) {
                    localStorage.setItem("auto-load-charts", String(checked));
                  }
                  window.dispatchEvent(new Event("auto-load-charts-changed"));
                }}
              />
            </div>
          </div>
        </section>

        {/* 🧩 Benutzeroberfläche */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-all">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Sliders className="h-5 w-5 " style={{ color: accentColor }} />
            {translations[language].userInterface}
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>{translations[language].defaultPage}</span>
              <Select
                onValueChange={(value) => {
                  if (allow) {
                    localStorage.setItem("default-page", value);
                  }
                  console.log("Default Page umgestellt auf", value);
                }}
                defaultValue={
                  typeof window !== "undefined"
                    ? localStorage.getItem("default-page") ?? "dashboard"
                    : "dashboard"
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dashboard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="kpis">KPIs</SelectItem>
                  <SelectItem value="elements">
                    {translations[language].elements}
                  </SelectItem>
                  <SelectItem value="relations">
                    {translations[language].relations}
                  </SelectItem>
                  <SelectItem value="validation">ValidationSuits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].animations}</span>
              <Switch
                checked={animationEnabled}
                onCheckedChange={toggleAnimation}
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].chartBackground}</span>
              <Select
                onValueChange={(value) => {
                  if (allow) {
                    localStorage.setItem("chart-background", value);
                  }
                  window.dispatchEvent(new Event("chart-background"));
                }}
                defaultValue={
                  typeof window !== "undefined"
                    ? localStorage.getItem("chart-background") ?? "light"
                    : "light"
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Hell" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    {translations[language].chartBackgroundLight}
                  </SelectItem>
                  <SelectItem value="grid">
                    {translations[language].chartBackgroundGrid}
                  </SelectItem>
                  <SelectItem value="transparent">
                    {translations[language].chartBackgroundTransparent}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* 🔒 Datenschutz & System */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-all">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Globe className="h-5 w-5 " style={{ color: accentColor }} />
            {translations[language].privacySystem}
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>{translations[language].language}</span>
              <Select
                value={language}
                onValueChange={(val) => {
                  changeLanguage(val as "de" | "en");
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue
                    placeholder={language === "de" ? "Deutsch" : "English"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">
                    {translations[language].german}
                  </SelectItem>
                  <SelectItem value="en">
                    {translations[language].english}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].localStorage}</span>
              <Switch
                checked={
                  typeof window !== "undefined"
                    ? localStorage.getItem("local-storage-enabled") !== "false"
                    : true
                }
                onCheckedChange={(checked) => {
                  setAllowed(checked);
                  localStorage.setItem(
                    "local-storage-enabled",
                    String(checked)
                  );
                  window.dispatchEvent(new Event("local-storage-changed"));
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span>{translations[language].deleteData}</span>
              <button
                className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm"
                onClick={() => setShowConfirm(true)}
              >
                <Trash2 className="h-4 w-4" /> {translations[language].delete}
              </button>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm dark:bg-gray-800 bg-gray-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold  text-gray-900 dark:text-white">
              {translations[language].confirmDeleteTitle ??
                "Daten wirklich löschen?"}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {translations[language].confirmDeleteText ??
                "Alle gespeicherten Einstellungen und Cookies werden gelöscht und Standardwerte wiederhergestellt."}
            </p>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="dark:text-white border-gray-900 dark:border-white"
            >
              {translations[language].cancel ?? "Abbrechen"}
            </Button>
            <Button
              className="dark:text-white text-gray-900"
              variant="destructive"
              onClick={() => {
                // 🔹 1. LocalStorage, Session & Cookies löschen
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach((cookie) => {
                  const eqPos = cookie.indexOf("=");
                  const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                  document.cookie =
                    name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });

                // 🔹 2. Standardwerte wieder aktivieren
                localStorage.setItem("animations-enabled", "true");
                localStorage.setItem("auto-load-charts", "true");
                localStorage.setItem("local-storage-enabled", "true");
                localStorage.setItem("chart-zoom", "false");

                // 🔹 3. Event feuern, damit Hooks sich updaten
                window.dispatchEvent(new Event("animations-setting-changed"));
                window.dispatchEvent(new Event("auto-load-charts-changed"));
                window.dispatchEvent(new Event("local-storage-changed"));
                window.dispatchEvent(new Event("chart-zoom-changed"));

                // 🔹 4. Dialog schließen & Seite neu laden
                setShowConfirm(false);
                setTimeout(() => window.location.reload(), 300);
              }}
            >
              {translations[language].confirmDeleteButton ?? "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function clearAllData() {
  const confirmDelete = confirm(
    "Bist du dir sicher, dass du alle gespeicherten Daten ud Cookies löschen möchtest?"
  );

  if (!confirmDelete) return;

  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });

  alert("✅ Alle gespeicherten Daten wurden gelöscht.");
  window.location.reload();
}
