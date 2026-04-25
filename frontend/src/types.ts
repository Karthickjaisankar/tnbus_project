export interface Bus {
  waybill: string;
  vehicle: string;
  corporation: string;
  depot: string;
  from_place: string;
  last_place: string;
  last_ticket_time: string;
  last_ticket_dt: string;
  passengers: number;
  distance_km: number;
  duration_min: number;
  arrival_dt: string;
  mins_to_arrive: number;
  lat: number | null;
  lng: number | null;
}

export interface ForecastHour {
  hour: string;
  buses: number;
  passengers: number;
}

export interface CorpRow {
  corporation: string;
  buses: number;
  passengers: number;
}

export interface Meta {
  snapshot_ts: string | null;
  filename: string | null;
  refreshed_at: string | null;
  totals: {
    buses: number;
    passengers: number;
    next_1h: number; passengers_1h: number;
    next_2h: number; passengers_2h: number;
    next_3h: number; passengers_3h: number;
    next_4h: number; passengers_4h: number;
    next_5h: number; passengers_5h: number;
  };
  error: string | null;
}
