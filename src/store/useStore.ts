import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ComparisonOp = "<" | "<=" | ">" | ">=" | "=";

export interface ColorRule {
  id: string;
  operator: ComparisonOp;
  value: number;
  color: string;
}

export interface PolygonData {
  id: string;
  name?: string;
  coordinates: [number, number][];
  dataSources: string[]; // allows multiple datasets
  rules: ColorRule[];
  currentValue?: number;
  color?: string;
  status?: "loading" | "error" | "ready";
  errorMsg?: string;
}

interface AppState {
  polygons: PolygonData[];
  selectedTimeRange: [number, number];
  setTimeRange: (range: [number, number]) => void;
  addPolygon: (polygon: PolygonData) => void;
  updatePolygon: (
    id: string,
    updates: Partial<Omit<PolygonData, "id">>
  ) => void;
  removePolygon: (id: string) => void;
  setPolygonColor: (id: string, color: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      polygons: [],
      selectedTimeRange: [0, 0],
      setTimeRange: (range) => set({ selectedTimeRange: range }),
      addPolygon: (polygon) =>
        set((s) => ({ polygons: [...s.polygons, polygon] })),
      updatePolygon: (id, updates) =>
        set((s) => ({
          polygons: s.polygons.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePolygon: (id) =>
        set((s) => ({ polygons: s.polygons.filter((p) => p.id !== id) })),
      setPolygonColor: (id, color) =>
        set((s) => ({
          polygons: s.polygons.map((p) =>
            p.id === id ? { ...p, color } : p
          ),
        })),
    }),
    {
      name: "dashboard-store",
    }
  )
);
