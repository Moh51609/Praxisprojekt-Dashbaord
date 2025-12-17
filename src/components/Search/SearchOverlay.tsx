"use client";

import { useEffect, useRef, useState } from "react";
import DetailPanel from "./DetailPanel";
import { useModel } from "@/context/ModelContext";

export default function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<any[]>([]);
  const { model } = useModel();
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!model) return;

    const index: any[] = [];

    // 🔹 Elemente
    model.elements.forEach((e) => {
      index.push({
        id: e.id,
        name: e.name,
        kind: "element",
        original: e,
      });
    });

    // 🔹 Beziehungen
    model.relationships?.forEach((r, i) => {
      index.push({
        id: `rel-${i}`,
        name: `${r.type}`,
        kind: "relation",
        original: r,
      });
    });

    setSearchIndex(index);
  }, [model]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sucheingabe Listener
  useEffect(() => {
    const handler = (e: any) => {
      const q = e.detail.trim();

      setQuery(q);
      setShowResults(q.length >= 2);

      // ✅ WICHTIG: DetailPanel schließen bei neuer Suche
      setSelectedItem(null);
    };

    window.addEventListener("global-search", handler);
    return () => window.removeEventListener("global-search", handler);
  }, []);

  // Wenn keine Ergebnisse angezeigt werden sollen → nichts rendern
  if (!showResults) return null;

  // Filterlogik
  const filtered = searchIndex.filter((item) =>
    item.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Kleine SUCHBOX direkt neben Sidebar */}
      <div
        ref={resultsRef}
        className={`
         fixed 
    top-[340px] 
    
    w-[380px]
    max-h-[60vh] overflow-y-auto
    bg-gray-900/80 backdrop-blur-md
    rounded-lg shadow-xl p-4
    z-[9999]
          ${showResults ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        <h2 className="text-md font-semibold mb-2 text-white">
          Ergebnisse für "{query}"
        </h2>

        <ul className="space-y-1">
          {filtered.map((res, i) => (
            <li
              key={i}
              className="p-2 bg-gray-700/70 rounded cursor-pointer hover:bg-gray-600/70"
              onClick={() => {
                if (!model) return;

                if (res.kind === "element") {
                  const element = res.original;

                  const incoming = model.relationships.filter(
                    (r) => r.target === element.id
                  );

                  const outgoing = model.relationships.filter(
                    (r) => r.source === element.id
                  );

                  setSelectedItem({
                    ...element,
                    incoming,
                    outgoing,
                  });
                }
              }}
            >
              <strong>{res.name}</strong>
              <span className="text-gray-300"></span>

              {res.parent && (
                <span className="text-gray-400">
                  {" "}
                  (in {searchIndex.find((x) => x.id === res.parent)?.name})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal */}
      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
