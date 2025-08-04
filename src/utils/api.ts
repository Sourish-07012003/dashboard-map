import axios from "axios";
import dayjs from "dayjs";

const CACHE_PREFIX = "open-meteo-cache-";
interface CachedEntry {
  timestamp: number;
  data: any;
}

const getCached = (key: string): any | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed: CachedEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 1000 * 60 * 60) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCached = (key: string, data: any) => {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {}
};

export const fetchDataFields = async (
  lat: number,
  lon: number,
  startISO: string,
  endISO: string,
  fields: string[]
) => {
  const startDate = dayjs(startISO).format("YYYY-MM-DD");
  const endDate = dayjs(endISO).format("YYYY-MM-DD");
  const joined = fields.sort().join(",");
  const key = `${lat.toFixed(4)}-${lon.toFixed(4)}-${startDate}-${endDate}-${joined}`;
  const cached = getCached(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: startDate,
    end_date: endDate,
    hourly: joined,
  } as any);

  const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
  const { data } = await axios.get(url);
  setCached(key, data);
  return data;
};
