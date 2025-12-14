"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { useAccentColor } from "@/hooks/useAccentColor";

export default function UploadXmi({
  onLoaded,
}: {
  onLoaded: (model: any) => void;
}) {
  const accentColor = useAccentColor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/xmi/upload", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Upload failed");
      }

      // 🔥 hier passiert die Magie
      onLoaded(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        className="flex items-center gap-2 px-4 py-2 rounded-lg 
          dark:bg-gray-800 dark:text-gray-100  dark:hover:bg-gray-700 bg-white text-gray-800 hover:bg-gray-100  transition shadow"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Lade…" : "XMI hochladen"}
        <input type="file" accept=".xml,.xmi" hidden onChange={handleUpload} />
      </label>

      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}
