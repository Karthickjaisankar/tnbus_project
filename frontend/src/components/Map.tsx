import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
import { Layers, MapPin, Maximize2, Minimize2 } from "lucide-react";
import { Bus } from "../types";

const KILAMBAKKAM: [number, number] = [12.7782, 80.0686];

// Color buckets by ETA — red <1h, amber 1–3h, yellow 3–6h, green >6h.
// Negative ETAs (already arrived) get a neutral gray so they don't pollute
// the urgency signal.
function bucket(mins: number): { color: string; label: string } {
  if (mins < 0) return { color: "#94a3b8", label: "arrived" };
  if (mins < 60) return { color: "#dc2626", label: "<1h" };
  if (mins < 180) return { color: "#f59e0b", label: "1–3h" };
  if (mins < 360) return { color: "#eab308", label: "3–6h" };
  return { color: "#16a34a", label: ">6h" };
}

function busDivIcon(b: Bus): L.DivIcon {
  const { color } = bucket(b.mins_to_arrive);
  return L.divIcon({
    html: `<div class="bus-marker" style="width:14px;height:14px;background:${color}"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function MapPanel({ buses }: { buses: Bus[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatRef = useRef<L.Layer | null>(null);
  const [mode, setMode] = useState<"clusters" | "heatmap" | "both">("clusters");
  const [fullscreen, setFullscreen] = useState(false);

  // Re-tile when entering/leaving fullscreen + ESC to exit
  useEffect(() => {
    const m = mapRef.current;
    if (m) {
      setTimeout(() => m.invalidateSize(), 60);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // init once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const m = L.map(mapEl.current, {
      center: [11.5, 78.7],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(m);

    // Destination marker
    const destIcon = L.divIcon({
      html: '<div class="destination-pulse" style="position:relative;width:18px;height:18px;border-radius:9999px;background:#0891b2;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.25)"></div>',
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker(KILAMBAKKAM, { icon: destIcon })
      .bindPopup("<b>Kilambakkam Bus Terminus</b><br/>Destination — Chennai")
      .addTo(m);

    mapRef.current = m;
  }, []);

  // Plot every bus that has coords. Each marker sits at LAST_TICKET_PLACE,
  // which we treat as the bus's current position for ETA purposes.
  const valid = useMemo(
    () => buses.filter((b) => b.lat != null && b.lng != null),
    [buses]
  );

  // render layers when buses or mode change
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    if (clusterRef.current) {
      m.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    if (heatRef.current) {
      m.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (mode === "clusters" || mode === "both") {
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (c: any) => {
          const n = c.getChildCount();
          const children = c.getAllChildMarkers();
          // Color by the SOONEST inbound bus (mins_to_arrive >= 0). Already-
          // arrived buses are excluded from the urgency calc — they would
          // otherwise turn every cluster red, since their ETAs are < 0.
          let minMins = Infinity;
          for (const m of children) {
            const v = (m.options as any).busMinsToArrive;
            if (typeof v === "number" && v >= 0 && v < minMins) minMins = v;
          }
          const color = minMins === Infinity ? "#94a3b8" : bucket(minMins).color;
          const size = n >= 50 ? 56 : n >= 15 ? 46 : 38;
          return L.divIcon({
            html: `<div class="cluster-pulse" style="width:${size}px;height:${size}px;background:${color}">${n}</div>`,
            className: "",
            iconSize: [size, size],
          });
        },
      });
      valid.forEach((b) => {
        const { color, label } = bucket(b.mins_to_arrive);
        const arr = new Date(b.arrival_dt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
        });
        const marker = L.marker([b.lat!, b.lng!], {
          icon: busDivIcon(b),
          busMinsToArrive: b.mins_to_arrive,
        } as any).bindPopup(
            `<div style="font-family:Inter;color:#0f172a;font-size:12px;min-width:220px">
              <div style="font-weight:700;color:#0891b2;margin-bottom:6px;font-size:13px">${b.vehicle} · ${b.corporation}</div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;color:#334155">
                <span style="color:#64748b">From</span><span>${b.from_place}</span>
                <span style="color:#64748b">Last seen</span><span>${b.last_place} @ ${b.last_ticket_time}</span>
                <span style="color:#64748b">Distance</span><span>${b.distance_km} km</span>
                <span style="color:#64748b">ETA</span><span>${arr} <span style="color:${color};font-weight:600">(${label})</span></span>
                <span style="color:#64748b">Passengers</span><span><b>${b.passengers}</b></span>
              </div>
            </div>`
          );
        cluster.addLayer(marker);
      });
      cluster.addTo(m);
      clusterRef.current = cluster;
    }

    if (mode === "heatmap" || mode === "both") {
      const points: [number, number, number][] = valid.map((b) => [
        b.lat!,
        b.lng!,
        Math.max(0.4, Math.min(1.5, (b.passengers + 5) / 50)),
      ]);
      heatRef.current = (L as any)
        .heatLayer(points, {
          radius: 30,
          blur: 25,
          maxZoom: 11,
          gradient: { 0.2: "#0891b2", 0.45: "#d97706", 0.7: "#ea580c", 1.0: "#e11d48" },
        })
        .addTo(m);
    }
  }, [valid, mode]);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[2000] rounded-none border-0 overflow-hidden bg-white"
          : "relative h-full rounded-xl overflow-hidden border border-slate-200 shadow-card"
      }
    >
      <div ref={mapEl} className="absolute inset-0" />

      {/* Mode toggle */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[1000] flex gap-1 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1 text-[11px] sm:text-xs shadow-card">
        {(["clusters", "heatmap", "both"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setMode(opt)}
            className={`px-2 sm:px-3 py-1 rounded transition flex items-center gap-1 ${
              mode === opt
                ? "bg-cyan-50 text-accent-cyan font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">{opt}</span>
            <span className="sm:hidden">{opt[0].toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setFullscreen((v) => !v)}
        className="absolute top-2 sm:top-3 right-2 sm:right-3 z-[1000] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur border border-slate-200 hover:border-accent-cyan/60 text-[11px] sm:text-xs text-slate-700 hover:text-accent-cyan transition shadow-card"
        title={fullscreen ? "Exit fullscreen (Esc)" : "Expand to fullscreen"}
      >
        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{fullscreen ? "Exit" : "Fullscreen"}</span>
      </button>

      {/* Legend */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-[1000] bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs shadow-card">
        <div className="flex items-center gap-2 mb-1 text-slate-700 font-medium">
          <MapPin className="w-3 h-3 text-accent-cyan" /> ETA
          <span className="hidden sm:inline"> to Kilambakkam</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-slate-600">
          <Dot color="#dc2626" /> &lt;1h
          <Dot color="#f59e0b" /> 1–3h
          <Dot color="#eab308" /> 3–6h
          <Dot color="#16a34a" /> &gt;6h
        </div>
      </div>

    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border border-white"
      style={{ background: color, boxShadow: "0 1px 2px rgba(15,23,42,0.2)" }}
    />
  );
}
