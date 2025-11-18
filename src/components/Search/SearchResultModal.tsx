"use client";

export default function SearchResultModal({ item, onClose }) {
  const isRelation = item.source && item.target;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600]">
      <div className="bg-gray-900 p-6 rounded-xl max-w-lg text-white">
        <h2 className="text-xl font-bold mb-4">
          {isRelation ? "Beziehungsdetails" : "Elementdetails"}
        </h2>

        {!isRelation && (
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {item.name}
            </p>
            <p>
              <strong>Typ:</strong> {item.type}
            </p>
            <p>
              <strong>Package:</strong> {item.packageName ?? "—"}
            </p>
            <p>
              <strong>Stereotyp:</strong> {item.stereotype ?? "—"}
            </p>
          </div>
        )}

        {isRelation && (
          <div className="space-y-2">
            <p>
              <strong>Quelle:</strong> {item.source}
            </p>
            <p>
              <strong>Ziel:</strong> {item.target}
            </p>
            <p>
              <strong>Typ:</strong> {item.type}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-red-600 px-4 py-2 rounded-lg"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
