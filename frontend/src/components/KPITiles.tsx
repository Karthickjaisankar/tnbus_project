import { Clock5, Flame, TrendingUp, Zap } from "lucide-react";
import { Meta } from "../types";

interface TileProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  highlight?: boolean;
}

function Tile({ label, value, sub, icon, accent, highlight }: TileProps) {
  return (
    <div
      className={`rounded-xl border bg-ink-800/60 backdrop-blur p-4 relative overflow-hidden group ${
        highlight ? "border-accent-rose/60 shadow-[0_0_24px_rgba(251,113,133,0.25)]" : "border-ink-600"
      }`}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold font-mono relative" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500 relative">{sub}</div>}
    </div>
  );
}

function fmtHHMM(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function KPITiles({ meta }: { meta: Meta | undefined }) {
  const t = meta?.totals;
  const peak = meta?.peak_window;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile
        label="Next 30 min"
        value={t?.next_30min ?? "—"}
        sub={t ? `${t.passengers_30min.toLocaleString("en-IN")} pax · dispatch ~${Math.ceil(t.passengers_30min / 50)} city buses` : "—"}
        icon={<Zap className="w-4 h-4" />}
        accent="#fb7185"
        highlight
      />
      <Tile
        label="Next 1 hour"
        value={t?.next_1h ?? "—"}
        sub={t ? `${t.passengers_1h.toLocaleString("en-IN")} pax · ~${Math.ceil(t.passengers_1h / 50)} city buses` : "—"}
        icon={<Flame className="w-4 h-4" />}
        accent="#fb923c"
      />
      <Tile
        label="Next 5 hours"
        value={t?.next_5h ?? "—"}
        sub={t ? `${t.passengers_5h.toLocaleString("en-IN")} pax across the shift` : "—"}
        icon={<Clock5 className="w-4 h-4" />}
        accent="#22d3ee"
      />
      <Tile
        label="Peak window"
        value={peak ? `${fmtHHMM(peak.start)}` : "—"}
        sub={peak ? `${peak.buses} buses · ${peak.passengers.toLocaleString("en-IN")} pax · ~${peak.city_buses_needed} city buses` : "no peak in horizon"}
        icon={<TrendingUp className="w-4 h-4" />}
        accent="#a78bfa"
      />
    </div>
  );
}
