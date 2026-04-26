import { Clock3, Clock4, Clock5, Flame, Zap } from "lucide-react";
import { Meta } from "../types";

const CAPACITY = 60;

interface TileProps {
  hoursLabel: string;
  buses: number;
  passengers: number;
  icon: React.ReactNode;
  accent: string;
  highlight?: boolean;
}

function Tile({ hoursLabel, buses, passengers, icon, accent, highlight }: TileProps) {
  const cityBuses = Math.ceil(passengers / CAPACITY);
  return (
    <div
      className={`rounded-xl border bg-ink-800/60 backdrop-blur p-4 relative overflow-hidden group ${
        highlight
          ? "border-accent-rose/60 shadow-[0_0_24px_rgba(251,113,133,0.25)]"
          : "border-ink-600"
      }`}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-slate-400">{hoursLabel}</span>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2 relative">
        <div className="text-3xl font-semibold font-mono" style={{ color: accent }}>
          {buses}
        </div>
        <div className="text-xs text-slate-500">buses (cumulative)</div>
      </div>
      <div className="mt-1 text-xs text-slate-300 relative">
        {passengers.toLocaleString("en-IN")} passengers
      </div>
      <div className="mt-2 pt-2 border-t border-ink-700 text-[11px] text-slate-400 relative leading-snug">
        {passengers.toLocaleString("en-IN")} ÷ {CAPACITY} ={" "}
        <span style={{ color: accent }} className="font-mono font-semibold">
          ~{cityBuses}
        </span>{" "}
        city buses needed
        <div className="text-[10px] text-slate-500 mt-0.5">assuming 60 seats per city bus</div>
      </div>
    </div>
  );
}

export function KPITiles({ meta }: { meta: Meta | undefined }) {
  const t = meta?.totals;
  if (!t) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-ink-600 bg-ink-800/40 p-4 h-[150px]" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Tile
        hoursLabel="Next 1 hour"
        buses={t.next_1h}
        passengers={t.passengers_1h}
        icon={<Zap className="w-4 h-4" />}
        accent="#fb7185"
        highlight
      />
      <Tile
        hoursLabel="Next 2 hours"
        buses={t.next_2h}
        passengers={t.passengers_2h}
        icon={<Flame className="w-4 h-4" />}
        accent="#fb923c"
        highlight
      />
      <Tile
        hoursLabel="Next 3 hours"
        buses={t.next_3h}
        passengers={t.passengers_3h}
        icon={<Clock3 className="w-4 h-4" />}
        accent="#fbbf24"
      />
      <Tile
        hoursLabel="Next 4 hours"
        buses={t.next_4h}
        passengers={t.passengers_4h}
        icon={<Clock4 className="w-4 h-4" />}
        accent="#a78bfa"
      />
      <Tile
        hoursLabel="Next 5 hours"
        buses={t.next_5h}
        passengers={t.passengers_5h}
        icon={<Clock5 className="w-4 h-4" />}
        accent="#22d3ee"
      />
    </div>
  );
}
