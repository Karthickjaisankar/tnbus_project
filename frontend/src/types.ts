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
  city_buses_needed: number;
}

export interface PeakWindow {
  start: string;
  buses: number;
  passengers: number;
  city_buses_needed: number;
}

export interface BunchingAlert {
  start: string;
  end: string;
  buses: number;
  passengers: number;
  city_buses_needed: number;
}

export interface ApproachTraffic {
  origin: string;
  destination: string;
  distance_km: number;
  duration_normal_min: number;
  duration_traffic_min: number;
  ratio: number;
  status: "clear" | "moderate" | "heavy";
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
    next_30min: number; passengers_30min: number;
    next_1h: number; passengers_1h: number;
    next_5h: number; passengers_5h: number;
  };
  peak_window: PeakWindow | null;
  bunching_alert: BunchingAlert | null;
  approach_traffic: ApproachTraffic | null;
  is_stale: boolean;
  error: string | null;
}
