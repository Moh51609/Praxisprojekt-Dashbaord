"use client";
import React, { useMemo } from "react";

type UmlPort = {
  id: string;
  name: string;
  direction?: "in" | "out" | "inout";
};

type UmlElement = {
  id: string;
  name: string;
  type: string;
  stereotype?: string;
  ports?: UmlPort[];
};

export default function BlockPreviewPro({ item }: { item: UmlElement }) {
  if (!item) return null;

  const isBlock =
    item.stereotype?.toLowerCase() === "block" || item.type === "uml:Class";

  if (!isBlock) return null;

  const portsLeft =
    item.ports?.filter(
      (p) => p.direction === "in" || p.direction === "inout"
    ) ?? [];

  const portsRight =
    item.ports?.filter(
      (p) => p.direction === "out" || p.direction === "inout"
    ) ?? [];

  const portHeight = 22;
  const portPadding = 6;
  const textPadding = 12;

  // ------------------------------------------------------
  // 📌 Dynamische Breite bestimmen
  // ------------------------------------------------------
  function measure(label: string) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 80;
    ctx.font = "12px Arial";
    return ctx.measureText(label).width + textPadding * 2;
  }

  const maxLeftPortWidth = Math.max(
    0,
    ...portsLeft.map((p) => measure("◀ " + p.name))
  );
  const maxRightPortWidth = Math.max(
    0,
    ...portsRight.map((p) => measure(p.name + " ▶"))
  );

  const titleWidth = measure(item.name) + 40;
  const stereotypeWidth = measure("«" + (item.stereotype || "Block") + "»");

  const minBlockWidth = Math.max(
    maxLeftPortWidth + maxRightPortWidth + 60, // Platz in der Mitte
    titleWidth,
    stereotypeWidth,
    260 // Mindestbreite
  );

  const svgWidth = minBlockWidth;
  const svgHeight =
    100 +
    Math.max(
      portsLeft.length * (portHeight + portPadding),
      portsRight.length * (portHeight + portPadding)
    );

  // ------------------------------------------------------
  // 📌 RENDER
  // ------------------------------------------------------
  return (
    <div className="relative mx-auto mt-6" style={{ width: "fit-content" }}>
      <div
        className="rounded-lg shadow-lg p-4"
        style={{
          background: "#F7DE9A",
          padding: "22px",
        }}
      >
        <svg width={svgWidth} height={svgHeight}>
          {/* Background */}
          <rect
            x="2"
            y="2"
            width={svgWidth - 4}
            height={svgHeight - 4}
            rx="10"
            fill="url(#gradYellow)"
          />

          <defs>
            <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fae7b2" />
              <stop offset="100%" stopColor="#f3d57f" />
            </linearGradient>
          </defs>

          {/* Stereotype */}
          <text
            x={svgWidth / 2}
            y={32}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#222"
          >
            «{item.stereotype || "Block"}»
          </text>

          {/* Title */}
          <text
            x={svgWidth / 2}
            y={58}
            textAnchor="middle"
            fontSize="18"
            fontWeight="600"
            fill="#000"
          >
            {item.name}
          </text>

          {/* LEFT PORTS */}
          {portsLeft.map((p, i) => {
            const label = "◀ " + p.name;
            const width = measure(label);

            return (
              <g key={p.id}>
                <rect
                  x={5}
                  y={80 + i * (portHeight + portPadding)}
                  width={width + 10}
                  height={portHeight}
                  rx="6"
                  fill="#ffffff"
                  stroke="#777"
                />
                <text
                  x={10}
                  y={80 + i * (portHeight + portPadding) + 15}
                  fontSize="12"
                  fill="#333"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* RIGHT PORTS */}
          {portsRight.map((p, i) => {
            const label = p.name + " ▶";
            const width = measure(label);

            return (
              <g key={p.id}>
                <rect
                  x={svgWidth - width - 15}
                  y={80 + i * (portHeight + portPadding)}
                  width={width + 10}
                  height={portHeight}
                  rx="6"
                  fill="#ffffff"
                  stroke="#777"
                />
                <text
                  x={svgWidth - width}
                  y={80 + i * (portHeight + portPadding) + 15}
                  fontSize="12"
                  fill="#333"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
