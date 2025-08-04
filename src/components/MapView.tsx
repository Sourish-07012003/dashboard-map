import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";
import { computeCentroid, evaluateColorRules } from "../utils/helpers";
import { fetchDataFields } from "../utils/api";
import dayjs from "dayjs";
import Legend from "./Legend";

// Fix Leaflet icon paths (needed for bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url)
    .href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

const MapView: React.FC = () => {
  const {
    polygons,
    addPolygon,
    updatePolygon,
    selectedTimeRange,
  } = useStore();

  const mapRef = useRef<L.Map | null>(null);
  const initializedRef = useRef(false);
  const mapCenter: [number, number] = [20, 78];

  const refreshPolygon = async (poly: typeof polygons[number]) => {
    if (!poly.dataSource) return;
    const [lat, lon] = computeCentroid(poly.coordinates);
    const now = dayjs();
    const start = now.add(selectedTimeRange[0], "hour");
    const end = now.add(selectedTimeRange[1], "hour");

    try {
      const data = await fetchDataFields(
        lat,
        lon,
        start.toISOString(),
        end.toISOString(),
        [poly.dataSource]
      );
      const timeArr: string[] = data.hourly.time || [];
      const valueArr: number[] = data.hourly[poly.dataSource] || [];

      if (!timeArr.length || !valueArr.length) return;

      const pairs = timeArr.map((t: string, i: number) => ({
        t: dayjs(t),
        val: valueArr[i],
      }));

      const selected = pairs.filter(
        (p) =>
          p.t.isAfter(start.subtract(1, "second")) &&
          p.t.isBefore(end.add(1, "second"))
      );

      if (!selected.length) return;

      const avg =
        selected.reduce((sum, p) => sum + p.val, 0) / selected.length;

      const matchedColor = evaluateColorRules(avg, poly.rules);
      updatePolygon(poly.id, {
        currentValue: avg,
        color: matchedColor,
      });
    } catch (err) {
      console.warn("Fetch error for polygon", poly.id, err);
    }
  };

  // Recompute on changes
  useEffect(() => {
    polygons.forEach((p) => refreshPolygon(p));
    // eslint-disable-next-line
  }, [selectedTimeRange]);

  useEffect(() => {
    polygons.forEach((p) => refreshPolygon(p));
    // eslint-disable-next-line
  }, [
    polygons.map((p) => JSON.stringify(p.rules)).join("|"),
    polygons.map((p) => p.dataSource).join("|"),
  ]);

  // Setup draw control once
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
      edit: {
        featureGroup: featureGroup,
      },
    });
    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      const layer: L.Polygon = e.layer;
      featureGroup.addLayer(layer);
      const latlngs = (layer.getLatLngs() as any)[0] as L.LatLng[];
      const coordinates = latlngs.map((l) => [l.lat, l.lng] as [number, number]);
      const currentPolygons = useStore.getState().polygons;
      const newPoly = {
        id: uuidv4(),
        name: `Region ${currentPolygons.length + 1}`,
        coordinates,
        dataSource: "temperature_2m",
        rules: [
          {
            id: uuidv4(),
            operator: "<" as const,
            value: 10,
            color: "#ff4d4f",
          },
          {
            id: uuidv4(),
            operator: ">=" as const,
            value: 25,
            color: "#52c41a",
          },
        ],
        currentValue: undefined,
        color: undefined,
      };
      addPolygon(newPoly);
    };

    const handleEdited = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const latlngs = (layer.getLatLngs() as any)[0] as L.LatLng[];
          const coordinates = latlngs.map(
            (l: L.LatLng) => [l.lat, l.lng] as [number, number]
          );
          const centroid = computeCentroid(coordinates);
          const currentPolygons = useStore.getState().polygons;
          let matchedId: string | null = null;
          currentPolygons.forEach((p) => {
            const existingCentroid = computeCentroid(p.coordinates);
            const dist = Math.hypot(
              existingCentroid[0] - centroid[0],
              existingCentroid[1] - centroid[1]
            );
            if (dist < 0.01) {
              matchedId = p.id;
            }
          });
          if (matchedId) {
            updatePolygon(matchedId, { coordinates });
          }
        }
      });
    };

    const handleDeleted = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polygon) {
          const latlngs = (layer.getLatLngs() as any)[0] as L.LatLng[];
          const coordinates = latlngs.map(
            (l: L.LatLng) => [l.lat, l.lng] as [number, number]
          );
          const centroid = computeCentroid(coordinates);
          const currentPolygons = useStore.getState().polygons;
          currentPolygons.forEach((p) => {
            const existingCentroid = computeCentroid(p.coordinates);
            const dist = Math.hypot(
              existingCentroid[0] - centroid[0],
              existingCentroid[1] - centroid[1]
            );
            if (dist < 0.01) {
              updatePolygon(p.id, { coordinates: [] as any });
            }
          });
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
    // eslint-disable-next-line
  }, [mapRef.current]);

  return (
    <div style={{ height: "100%", position: "relative" }}>
    <MapContainer
  center={mapCenter}
  zoom={5}
  style={{ height: "100%", width: "100%" }}
  whenReady={() => {
    const map = mapRef.current;
    if (map) {
      map.setView(mapCenter, 5);
      map.options.maxZoom = 5;
      map.options.minZoom = 5;
    }
  }}
  ref={(ref) => {
    if (ref) {
      mapRef.current = ref;
    }
  }}
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
                <div>
                  <strong>{poly.name}</strong>
                </div>
                <div>Field: {poly.dataSource}</div>
                <div>
                  Value:{" "}
                  {poly.currentValue !== undefined
                    ? poly.currentValue.toFixed(2)
                    : "—"}
                </div>
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
