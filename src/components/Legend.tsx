import React from "react";
import { useStore } from "../store/useStore";

const Legend: React.FC = () => {
  const { polygons } = useStore();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        background: "rgba(255,255,255,0.95)",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        fontSize: 12,
        maxWidth: 280,
        zIndex: 1000,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Legend</div>
      {polygons.map((poly) => (
        <div key={poly.id} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 500 }}>
            <div>{poly.name}</div>
            <div style={{ fontSize: 11, color: "#555" }}>
              {poly.dataSources.join(", ")}
            </div>
          </div>
          {poly.rules.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: r.color,
                  borderRadius: 3,
                  border: "1px solid #ccc",
                  flexShrink: 0,
                }}
              />
              <div>
                {r.operator} {r.value}
              </div>
            </div>
          ))}
        </div>
      ))}
      {polygons.length === 0 && <div>No polygons to show.</div>}
    </div>
  );
};

export default Legend;
