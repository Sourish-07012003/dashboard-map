import React from "react";
import { Card } from "antd";
import { useStore } from "../store/useStore";

const Legend: React.FC = () => {
  const { polygons } = useStore();

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1001,
        width: 260,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      {polygons.map((poly) => (
        <Card
          size="small"
          key={poly.id}
          title={poly.name || poly.id.slice(0, 4)}
          style={{ marginBottom: 8 }}
        >
          {poly.rules.map((r) => (
            <div
              key={r.id}
              style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: r.color,
                  borderRadius: 3,
                  marginRight: 6,
                  border: "1px solid #ccc",
                }}
              />
              <div style={{ fontSize: 12 }}>
                {r.operator} {r.value}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Current:{" "}
            {poly.currentValue !== undefined
              ? poly.currentValue.toFixed(1)
              : "—"}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Legend;
