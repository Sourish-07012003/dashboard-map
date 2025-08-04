import React from "react";
import { Card, Select, InputNumber, Button, Space, Tooltip, Input } from "antd";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";

// Inline rule shape (mirror of store)
type ColorRule = {
  id: string;
  operator: "<" | "<=" | ">" | ">=" | "=";
  value: number;
  color: string;
};

const defaultRule = (): ColorRule => ({
  id: uuidv4(),
  operator: "<",
  value: 10,
  color: "#ff4d4f",
});

const Sidebar: React.FC = () => {
  const { polygons, updatePolygon } = useStore();

  return (
    <div
      style={{
        padding: "10px",
        background: "#fafafa",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {polygons.map((poly) => (
        <Card
          key={poly.id}
          size="small"
          style={{ marginBottom: 12 }}
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Input
                size="small"
                value={poly.name}
                onChange={(e) =>
                  updatePolygon(poly.id, { name: e.target.value })
                }
                style={{ width: "60%" }}
                placeholder="Polygon name"
              />
              <Button
                size="small"
                onClick={() => {
                  updatePolygon(poly.id, {
                    rules: [...poly.rules, defaultRule()],
                  });
                }}
              >
                + Rule
              </Button>
            </div>
          }
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Data Source / Field</div>
            <Select
              style={{ width: "100%" }}
              value={poly.dataSource}
              placeholder="Select data source"
              onChange={(val) => updatePolygon(poly.id, { dataSource: val })}
            >
              <Select.Option value="temperature_2m">Temperature</Select.Option>
              <Select.Option value="relativehumidity_2m">
                Humidity
              </Select.Option>
            </Select>
          </div>

          <div style={{ fontWeight: 600, marginBottom: 4 }}>Color Rules</div>
          {poly.rules.map((rule: any, idx: number) => (
            <Space key={rule.id} style={{ display: "flex", marginBottom: 4 }}>
              <Select
                value={rule.operator}
                style={{ width: 70 }}
                onChange={(op) => {
                  const updated = [...poly.rules];
                  updated[idx] = { ...updated[idx], operator: op as any };
                  updatePolygon(poly.id, { rules: updated });
                }}
              >
                <Select.Option value="<">&lt;</Select.Option>
                <Select.Option value="<=">&le;</Select.Option>
                <Select.Option value="=">=</Select.Option>
                <Select.Option value=">=">&ge;</Select.Option>
                <Select.Option value=">">&gt;</Select.Option>
              </Select>
              <InputNumber
                value={rule.value}
                onChange={(v) => {
                  const updated = [...poly.rules];
                  updated[idx] = { ...updated[idx], value: v as number };
                  updatePolygon(poly.id, { rules: updated });
                }}
                placeholder="value"
              />
              <div
                onClick={() => {
                  const newColor =
                    prompt("Enter color hex", rule.color) || rule.color;
                  const updated = [...poly.rules];
                  updated[idx] = { ...updated[idx], color: newColor };
                  updatePolygon(poly.id, { rules: updated });
                }}
                style={{
                  width: 20,
                  height: 20,
                  background: rule.color,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  cursor: "pointer",
                }}
              />
              <Tooltip title="Remove rule">
                <Button
                  type="text"
                  onClick={() => {
                    const updated = poly.rules.filter(
                      (r: any) => r.id !== rule.id
                    );
                    updatePolygon(poly.id, { rules: updated });
                  }}
                >
                  ✕
                </Button>
              </Tooltip>
            </Space>
          ))}

          <div style={{ marginTop: 8 }}>
            <div>
              Current value:{" "}
              <strong>
                {poly.currentValue !== undefined
                  ? poly.currentValue.toFixed(2)
                  : "—"}
              </strong>
            </div>
            <div>
              Current color:{" "}
              <span
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  background: poly.color || "#ccc",
                  borderRadius: 4,
                  verticalAlign: "middle",
                  marginLeft: 4,
                }}
              />
            </div>
          </div>
        </Card>
      ))}
      {polygons.length === 0 && (
        <div style={{ padding: 20, textAlign: "center" }}>
          Draw a polygon on the map to begin.
        </div>
      )}
    </div>
  );
};

export default Sidebar;
