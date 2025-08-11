import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
} from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet"; // ✅ Import Map type

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";
import { computeCentroid, evaluateColorRules } from "../utils/helpers";
import { fetchDataFields } from "../utils/api";
import dayjs from "dayjs";
import Legend from "./Legend";

// Fix default icon paths for bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

// simple color interpolation
const lerpColor = (a: string, b: string, amount: number) => {
  const ah = parseInt(a.replace("#", ""), 16);
  const ar = (ah >> 16) & 0xff;
  const ag = (ah >> 8) & 0xff;
  const ab = ah & 0xff;

  const bh = parseInt(b.replace("#", ""), 16);
  const br = (bh >> 16) & 0xff;
  const bg = (bh >> 8) & 0xff;
  const bb = bh & 0xff;

  const rr = Math.round(ar + (br - ar) * amount);
  const gg = Math.round(ag + (bg - ag) * amount);
  const bb2 = Math.round(ab + (bb - ab) * amount);

  return "#" + ((1 << 24) + (rr << 16) + (gg << 8) + bb2).toString(16).slice(1);
};

// animate color change
const animateColor = (polyId: string, from: string, to: string) => {
  const duration = 300;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const intermediate = lerpColor(from, to, t);
    useStore.getState().setPolygonColor(polyId, intermediate);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const MapView: React.FC = () => {
  const {
    polygons,
    addPolygon,
    updatePolygon,
    removePolygon,
    selectedTimeRange,
  } = useStore();

  const mapRef = useRef<LeafletMap | null>(null); // ✅ Typed ref
  const layerMap = useRef<Map<number, string>>(new Map());
  const initializedRef = useRef(false);
  const mapCenter: [number, number] = [20, 78];

  const refreshPolygon = async (poly: typeof polygons[number]) => {
    if (!poly.dataSources || poly.dataSources.length === 0) return;
    updatePolygon(poly.id, { status: "loading" });

    const [lat, lon] = computeCentroid(poly.coordinates);
    const now = dayjs();
    const start = now.add(selectedTimeRange[0], "hour");
    const end = now.add(selectedTimeRange[1], "hour");

    try {
      const allData = await Promise.all(
        poly.dataSources.map((ds) =>
          fetchDataFields(lat, lon, start.toISOString(), end.toISOString(), [ds])
        )
      );

      if (!allData.length) {
        updatePolygon(poly.id, { status: "error", errorMsg: "No data returned" });
        return;
      }

      const timeArr: string[] = allData[0].hourly.time || [];
      const perHour = timeArr.map((t: string, i: number) => {
        const vals = allData.map(
          (d, idx) => d.hourly[poly.dataSources[idx]][i] ?? 0
        );
        const sum = vals.reduce((s: number, v: number) => s + v, 0);
        return { t: dayjs(t), val: sum / vals.length };
      });

      const selected = perHour.filter(
        (p) =>
          p.t.isAfter(start.subtract(1, "second")) &&
          p.t.isBefore(end.add(1, "second"))
      );

      if (!selected.length) {
        updatePolygon(poly.id, {
          status: "error",
          errorMsg: "No data in selected window",
        });
        return;
      }

      const avg = selected.reduce((sum, p) => sum + p.val, 0) / selected.length;
      const matchedColor = evaluateColorRules(avg, poly.rules);

      if (poly.color && matchedColor && poly.color !== matchedColor) {
        animateColor(poly.id, poly.color, matchedColor);
      } else if (matchedColor) {
        updatePolygon(poly.id, { currentValue: avg, color: matchedColor, status: "ready" });
      } else {
        updatePolygon(poly.id, { currentValue: avg, color: undefined, status: "ready" });
      }
    } catch (err) {
      updatePolygon(poly.id, {
        status: "error",
        errorMsg: (err as any)?.message || "Fetch failed",
      });
    }
  };

  useEffect(() => {
    polygons.forEach((p) => refreshPolygon(p));
  }, [selectedTimeRange]);

  useEffect(() => {
    polygons.forEach((p) => refreshPolygon(p));
  }, [
    polygons.map((p) => JSON.stringify(p.rules)).join("|"),
    polygons.map((p) => p.dataSources.join(",")).join("|"),
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || initializedRef.current) return;
    initializedRef.current = true;

    const featureGroup = L.featureGroup().addTo(map);

    const drawControl = new (L as any).Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#3388ff" },
        },
      },
      edit: { featureGroup },
    });
    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      const layer: L.Polygon = e.layer;
      const latlngs = (layer.getLatLngs() as any)[0] as L.LatLng[];
      if (latlngs.length < 3) {
        alert("Polygon must have at least 3 points.");
        return;
      }
      if (latlngs.length > 12) {
        alert("Polygon may not have more than 12 vertices.");
        return;
      }
      featureGroup.addLayer(layer);
      const coordinates = latlngs.map((l) => [l.lat, l.lng] as [number, number]);

      const currentPolygons = useStore.getState().polygons;
      const newPoly = {
        id: uuidv4(),
        name: `Region ${currentPolygons.length + 1}`,
        coordinates,
        dataSources: ["temperature_2m"],
        rules: [
          { id: uuidv4(), operator: "<" as const, value: 10, color: "#ff4d4f" },
          { id: uuidv4(), operator: ">=" as const, value: 25, color: "#52c41a" },
        ],
        currentValue: undefined,
        color: undefined,
        status: "ready" as const,
      };
      addPolygon(newPoly);

      const lid = (layer as any)?._leaflet_id;
      if (typeof lid === "number") {
        layerMap.current.set(lid, newPoly.id);
      }
    };

    const handleEdited = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const lid = (layer as any)?._leaflet_id;
          const matchedId = lid ? layerMap.current.get(lid) : null;
          if (!matchedId) return;

          const latlngs = (layer.getLatLngs() as any)[0] as L.LatLng[];
          if (latlngs.length < 3 || latlngs.length > 12) return;
          const coordinates = latlngs.map((l: L.LatLng) => [l.lat, l.lng] as [number, number]);
          updatePolygon(matchedId, { coordinates });
        }
      });
    };

    const handleDeleted = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const lid = (layer as any)?._leaflet_id;
          const matchedId = lid ? layerMap.current.get(lid) : null;
          if (!matchedId) return;
          removePolygon(matchedId);
          layerMap.current.delete(lid);
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
      featureGroup.remove();
    };
  }, [mapRef.current]);

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef} // ✅ Use ref instead of whenCreated
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polygons.map((poly) => (
          <Polygon
            key={poly.id}
            positions={poly.coordinates as any}
            pathOptions={{
              color: poly.color || "#888",
              weight: 2,
              fillOpacity: 0.4,
            }}
          >
            <Tooltip direction="top" sticky>
              <div style={{ fontSize: 12 }}>
                <div><strong>{poly.name}</strong></div>
                <div>Field(s): {poly.dataSources.join(", ")}</div>
                <div>
                  Value:{" "}
                  {poly.currentValue !== undefined
                    ? poly.currentValue.toFixed(2)
                    : "—"}
                </div>
                {poly.status === "loading" && <div>Loading…</div>}
                {poly.status === "error" && (
                  <div style={{ color: "red" }}>{poly.errorMsg}</div>
                )}
              </div>
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>
      <Legend />
    </div>
  );
};

export default MapView;
