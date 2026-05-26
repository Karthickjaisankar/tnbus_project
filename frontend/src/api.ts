import { Bus, CorpRow, ForecastHour, Meta } from "./types";

// Empty = same-origin relative requests. In production FastAPI serves both
// the API and this bundle from one Railway service, so "/api/..." resolves
// to the same host. In dev, the Vite proxy forwards "/api" to localhost:8000.
// Override with VITE_API_URL only if the API is hosted separately.
const API_BASE = import.meta.env.VITE_API_URL || "";

async function get<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export const api = {
  meta: () => get<Meta>("/api/meta"),
  forecast: () => get<{ hours: ForecastHour[]; refreshed_at: string }>("/api/forecast"),
  buses: () => get<{ buses: Bus[]; refreshed_at: string }>("/api/buses"),
  byCorp: () => get<{ by_corp: CorpRow[]; refreshed_at: string }>("/api/by-corporation"),
  refresh: async () => {
    const url = `${API_BASE}/api/refresh`;
    const r = await fetch(url, { method: "POST" });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  },
};
