"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ParsedModel } from "@/types/model";

type ModelContextType = {
  model: ParsedModel | null;
  setModel: (model: ParsedModel) => void;
};

const ModelContext = createContext<ModelContextType | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<ParsedModel | null>(null);
  useEffect(() => {
    if (model) return;

    fetch("/api/xmi")
      .then((r) => r.json())
      .then((data) => {
        if (!("error" in data)) {
          setModel(data);
        }
      })
      .catch(console.error);
  }, [model]);

  return (
    <ModelContext.Provider value={{ model, setModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error("useModel must be used inside ModelProvider");
  }
  return ctx;
}
