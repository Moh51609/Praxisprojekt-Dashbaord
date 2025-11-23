"use client";

import { useEffect, useState } from "react";
import SearchResultModal from "./SearchResultModal";
import DetailPanel from "./DetailPanel";

export default function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<any[]>([]);

  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Daten laden
  useEffect(() => {
    fetch("/api/xmi")
      .then((r) => r.json())
      .then((j) => {
        setSearchIndex(j.searchIndex ?? []);
      });
  }, []);

  // Sucheingabe Listener
  useEffect(() => {
    const handler = (e: any) => {
      const q = e.detail.trim();
      setQuery(q);
      setShowResults(q.length >= 2); // 👈 Nur zeigen, wenn min. 2 Zeichen
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
                if (res.kind === "element") {
                  setSelectedItem(res.original);
                } else if (res.original?.parentElement) {
                  setSelectedItem(res.original.parentElement);
                } else {
                  setSelectedItem(res.original);
                }
              }}
            >
              <strong>{res.name}</strong>
              <span className="text-gray-300"> — {res.kind}</span>

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
