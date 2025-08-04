import React from "react";
import {
  Card,
  Select,
  InputNumber,
  Button,
  Space,
  Tooltip,
  Input,
  Tag,
} from "antd";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";

const availableFields = [
  { label: "Temperature", value: "temperature_2m" },
  { label: "Humidity", value: "relativehumidity_2m" },
  // add more as needed
];

const defaultRule = () => ({
  id: uuidv4(),
  operator: "<" as const,
  value: 10,
  color: "#ff4d4f",
});

const Sidebar: React.FC = () => {
  const {
    polygons,
    updatePolygon,
    removePolygon,
  } = useStore();

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
                onBlur={() => {
                  if (!poly.name || !poly.name.trim()) {
                    updatePolygon(poly.id, { name: "Unnamed Region" });
                  }
                }}
              />
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
                <Tooltip title="Delete polygon">
                  <Button
                    size="small"
                    danger
                    onClick={() => removePolygon(poly.id)}
                  >
                    ✕
                  </Button>
                </Tooltip>
              </div>
            </div>
          }
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Data Source(s)</div>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select data sources"
              value={poly.dataSources}
              options={availableFields}
              onChange={(val) => updatePolygon(poly.id, { dataSources: val })}
            />
          </div>

          <div style={{ fontWeight: 600, marginBottom: 4 }}>Color Rules</div>
          {poly.rules.map((rule, idx) => (
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
                    const updated = poly.rules.filter((r) => r.id !== rule.id);
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div>Current color:</div>
              <div
                style={{
                  display: "inline-block",
                  width: 16,
                  height: 16,
                  background: poly.color || "#ccc",
                  borderRadius: 4,
                  verticalAlign: "middle",
                  marginLeft: 4,
                  border: "1px solid #999",
                }}
              />
              {poly.status === "loading" && <Tag color="blue">Loading</Tag>}
              {poly.status === "error" && (
                <Tag color="red">{poly.errorMsg || "Error"}</Tag>
              )}
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
