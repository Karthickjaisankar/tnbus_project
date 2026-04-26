import { Clock5, Flame, Zap } from "lucide-react";
import { Meta } from "../types";

const CAPACITY = 60;

interface TileProps {
  hoursLabel: string;
  buses: number;
  passengers: number;
  icon: React.ReactNode;
  accent: string;
  tint: string;
  highlight?: boolean;
}

function Tile({ hoursLabel, buses, passengers, icon, accent, tint, highlight }: TileProps) {
  const cityBuses = Math.ceil(passengers / CAPACITY);
  return (
    <div
      className="rounded-xl border bg-white p-3 sm:p-4 relative overflow-hidden transition shadow-card hover:shadow-cardHover"
      style={
        highlight
          ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}33, 0 4px 14px ${accent}22` }
          : { borderColor: "#e2e8f0" }
      }
    >
      <div
        className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 rounded-full opacity-50 blur-2xl"
        style={{ background: tint }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-medium">
          {hoursLabel}
        </span>
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
          style={{ background: tint, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2 flex-wrap relative">
        <div className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: accent }}>
          {buses}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-500">buses (cumulative)</div>
      </div>
      <div className="mt-1 text-xs sm:text-sm text-slate-700 relative font-medium">
        {passengers.toLocaleString("en-IN")} passengers
      </div>
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-600 relative leading-snug">
        {passengers.toLocaleString("en-IN")} ÷ {CAPACITY} ={" "}
        <span style={{ color: accent }} className="font-mono font-semibold text-xs sm:text-sm">
          ~{cityBuses}
        </span>{" "}
        city buses needed
        <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
          assuming 60 seats per city bus
        </div>
      </div>
    </div>
  );
}

export function KPITiles({ meta }: { meta: Meta | undefined }) {
  const t = meta?.totals;
  if (!t) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4 h-[170px] shadow-card"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile
        hoursLabel="Next 1 hour · dispatch now"
        buses={t.next_1h}
        passengers={t.passengers_1h}
        icon={<Zap className="w-4 h-4" />}
        accent="#e11d48"
        tint="#fff1f2"
        highlight
      />
      <Tile
        hoursLabel="Next 2 hours"
        buses={t.next_2h}
        passengers={t.passengers_2h}
        icon={<Flame className="w-4 h-4" />}
        accent="#ea580c"
        tint="#fff7ed"
        highlight
      />
      <Tile
        hoursLabel="Next 5 hours · staffing horizon"
        buses={t.next_5h}
        passengers={t.passengers_5h}
        icon={<Clock5 className="w-4 h-4" />}
        accent="#0891b2"
        tint="#ecfeff"
      />
    </div>
  );
}
