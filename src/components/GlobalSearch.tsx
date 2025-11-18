"use client";
import { useState } from "react";
import { Search } from "lucide-react";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative w-64">
      <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
      <input
        className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-800 text-gray-200 
                   border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Suche nach Elementen, Ports, Regeln..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
