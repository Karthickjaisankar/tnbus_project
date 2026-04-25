import { Bus, CorpRow, ForecastHour, Meta } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
