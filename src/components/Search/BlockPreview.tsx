"use client";
import React from "react";

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
    item.stereotype?.toLowerCase() === "block" || item.type === "uml:Class"; // optional anpassen

  if (!isBlock) return null;

  const width = 340;
  const height = 180;

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

  return (
    <div
      className="relative mx-auto"
      style={{
        width: "fit-content", // wichtig
        maxWidth: "100%", // verhindert Overflow in kleinen Panels
        overflow: "visible", // damit Ports NICHT abgeschnitten werden
      }}
    >
      <div
        className="rounded-lg bg-gray-800 p-4 mt-6 shadow-lg items-center flex justify-center"
        style={{
          background: "#F7DE9A",
          padding: "22px",
          position: "relative",
          minWidth: "260px",
        }}
      >
        <svg width={width} height={height}>
          {/* Block background */}
          <rect
            x="1"
            y="1"
            width={width - 2}
            height={height - 2}
            rx="8"
            fill="url(#gradYellow)"
            stroke="#444"
            strokeWidth="0"
          />

          <defs>
            <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fae7b2" />
              <stop offset="100%" stopColor="#f5d884" />
            </linearGradient>
          </defs>

          {/* Block title */}
          <text
            x="50%"
            y="32"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#222"
          >
            «{item.stereotype || "Block"}»
          </text>

          <text
            x="50%"
            y="55"
            textAnchor="middle"
            fontSize="18"
            fontWeight="600"
            fill="#000"
          >
            {item.name}
          </text>

          {/* LEFT PORTS */}
          {portsLeft.map((p, i) => (
            <g key={p.id}>
              <rect
                x="0"
                y={70 + i * (portHeight + portPadding)}
                width="85"
                height={portHeight}
                rx="6"
                fill="#f0f0f0"
                stroke="#777"
              />
              <text
                x="6"
                y={70 + i * (portHeight + portPadding) + 15}
                fontSize="11"
                fill="#333"
              >
                ◀ {p.name}
              </text>
            </g>
          ))}

          {/* RIGHT PORTS */}
          {portsRight.map((p, i) => (
            <g key={p.id}>
              <rect
                x={width - 120}
                y={70 + i * (portHeight + portPadding)}
                width="85"
                height={portHeight}
                rx="6"
                fill="#f0f0f0"
                stroke="#777"
              />
              <text
                x={width - 110}
                y={70 + i * (portHeight + portPadding) + 15}
                fontSize="11"
                fill="#333"
              >
                {p.name} ▶
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
