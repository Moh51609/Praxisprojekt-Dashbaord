"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ParsedModel } from "@/types/model";

const ModelContext = createContext<{
  model: ParsedModel | null;
  setModel: (m: ParsedModel) => void;
}>({
  model: null,
  setModel: () => {},
});

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<ParsedModel | null>(null);

  // ✅ 1. Beim Start aus LocalStorage laden
  useEffect(() => {
    const stored = localStorage.getItem("active-model");
    if (stored) {
      setModel(JSON.parse(stored));
    }
  }, []);

  // ✅ 2. Bei Änderung speichern
  useEffect(() => {
    if (model) {
      localStorage.setItem("active-model", JSON.stringify(model));
    }
  }, [model]);

  return (
    <ModelContext.Provider value={{ model, setModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export const useModel = () => useContext(ModelContext);
