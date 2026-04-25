import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.heat";
import { Layers, MapPin } from "lucide-react";
import { Bus } from "../types";

const KILAMBAKKAM: [number, number] = [12.7782, 80.0686];

// Color buckets by ETA
function bucket(mins: number): { color: string; label: string } {
  if (mins < 60) return { color: "#fb7185", label: "<1h" };
  if (mins < 180) return { color: "#fb923c", label: "1–3h" };
  if (mins < 360) return { color: "#fbbf24", label: "3–6h" };
  return { color: "#22d3ee", label: "6h+" };
}

function busDivIcon(b: Bus): L.DivIcon {
  const { color } = bucket(b.mins_to_arrive);
  return L.divIcon({
    html: `<div class="bus-marker" style="width:14px;height:14px;background:${color};color:${color}"></div>`,
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
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(m);

    // Destination marker
    const destIcon = L.divIcon({
      html: '<div class="destination-pulse" style="position:relative;width:18px;height:18px;border-radius:9999px;background:#22d3ee;border:2px solid #fff;box-shadow:0 0 16px #22d3ee"></div>',
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker(KILAMBAKKAM, { icon: destIcon })
      .bindPopup("<b>Kilambakkam Bus Terminus</b><br/>Destination — Chennai")
      .addTo(m);

    mapRef.current = m;
  }, []);

  // valid coords
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
          const cls =
            n >= 50 ? "cluster-pulse cluster-pulse-rose" : n >= 15 ? "cluster-pulse cluster-pulse-orange" : "cluster-pulse";
          const size = n >= 50 ? 56 : n >= 15 ? 46 : 38;
          return L.divIcon({
            html: `<div class="${cls}" style="width:${size}px;height:${size}px">${n}</div>`,
            className: "",
            iconSize: [size, size],
          });
        },
      });
      valid.forEach((b) => {
        const { label } = bucket(b.mins_to_arrive);
        const arr = new Date(b.arrival_dt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
        });
        const marker = L.marker([b.lat!, b.lng!], { icon: busDivIcon(b) })
          .bindPopup(
            `<div style="font-family:Inter;color:#0d1322;font-size:12px;min-width:200px">
              <div style="font-weight:600;color:#22d3ee;margin-bottom:4px">${b.vehicle} · ${b.corporation}</div>
              <div><b>From:</b> ${b.from_place}</div>
              <div><b>Last seen:</b> ${b.last_place} @ ${b.last_ticket_time}</div>
              <div><b>Distance:</b> ${b.distance_km} km</div>
              <div><b>ETA:</b> ${arr} <span style="color:#fb923c">(${label})</span></div>
              <div><b>Passengers:</b> ${b.passengers}</div>
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
          gradient: { 0.2: "#22d3ee", 0.45: "#fbbf24", 0.7: "#fb923c", 1.0: "#fb7185" },
        })
        .addTo(m);
    }
  }, [valid, mode]);

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-ink-600">
      <div ref={mapEl} className="absolute inset-0" />

      {/* Mode toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-ink-800/85 backdrop-blur border border-ink-600 rounded-lg p-1 text-xs">
        {(["clusters", "heatmap", "both"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setMode(opt)}
            className={`px-3 py-1 rounded transition flex items-center gap-1 ${
              mode === opt ? "bg-accent-cyan/20 text-accent-cyan" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            {opt}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-ink-800/85 backdrop-blur border border-ink-600 rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2 mb-1 text-slate-300">
          <MapPin className="w-3 h-3 text-accent-cyan" /> ETA to Kilambakkam
        </div>
        <div className="flex items-center gap-3">
          <Dot color="#fb7185" /> &lt;1h
          <Dot color="#fb923c" /> 1–3h
          <Dot color="#fbbf24" /> 3–6h
          <Dot color="#22d3ee" /> 6h+
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}
