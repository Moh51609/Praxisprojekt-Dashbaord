"use client";

import { useEffect, useState } from "react";
import SearchResultModal from "./SearchResultModal";
import DetailPanel from "./DetailPanel";

export default function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [elements, setElements] = useState([]);
  const [relations, setRelations] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Daten laden
  useEffect(() => {
    fetch("/api/xmi")
      .then((r) => r.json())
      .then((j) => setElements(j.elements ?? []));

    fetch("/api/xmi-relations")
      .then((r) => r.json())
      .then((j) => setRelations(j.relations ?? []));
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
  const filteredElements = elements.filter((e) =>
    e.name?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRelations = relations.filter(
    (r) =>
      r.source?.toLowerCase().includes(query.toLowerCase()) ||
      r.target?.toLowerCase().includes(query.toLowerCase()) ||
      r.type?.toLowerCase().includes(query.toLowerCase())
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

        {filteredElements.length === 0 && filteredRelations.length === 0 && (
          <div className="text-gray-300">Keine Treffer gefunden.</div>
        )}

        {filteredElements.length > 0 && (
          <>
            <h3 className="text-sm font-semibold mt-4 mb-2">Elemente</h3>
            <ul className="space-y-1">
              {filteredElements.map((e, i) => (
                <li
                  key={i}
                  className="p-2 bg-gray-700/70 rounded cursor-pointer hover:bg-gray-600/70"
                  onClick={() => setSelectedItem(e)}
                >
                  <strong>{e.name}</strong> – {e.type.replace("uml:", "")}
                </li>
              ))}
            </ul>
          </>
        )}

        {filteredRelations.length > 0 && (
          <>
            <h3 className="text-sm font-semibold mt-4 mb-2">Beziehungen</h3>
            <ul className="space-y-1 mb-4">
              {filteredRelations.map((r, i) => (
                <li
                  key={i}
                  className="p-2 bg-gray-700/70 rounded cursor-pointer hover:bg-gray-600/70"
                  onClick={() => setSelectedItem(r)}
                >
                  {r.source} → {r.target} ({r.type})
                </li>
              ))}
            </ul>
          </>
        )}
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
