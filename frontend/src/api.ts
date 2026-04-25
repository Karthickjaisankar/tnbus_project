import { Bus, CorpRow, ForecastHour, Meta } from "./types";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

export const api = {
  meta: () => get<Meta>("/api/meta"),
  forecast: () => get<{ hours: ForecastHour[]; refreshed_at: string }>("/api/forecast"),
  buses: () => get<{ buses: Bus[]; refreshed_at: string }>("/api/buses"),
  byCorp: () => get<{ by_corp: CorpRow[]; refreshed_at: string }>("/api/by-corporation"),
  refresh: async () => {
    const r = await fetch("/api/refresh", { method: "POST" });
    if (!r.ok) throw new Error(`refresh: ${r.status}`);
    return r.json();
  },
};
