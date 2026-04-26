import { BellRing, Bus as BusIcon, Building2, Clock5, Flame, Users, Zap } from "lucide-react";
import { CorpBreakdown, Meta } from "../types";

const CAPACITY = 75;
const BUFFER_RATIO = 1.2; // 20% operational buffer over the raw base
const MAX_BUS_PILLS = 18;

function minMTCBuses(passengers: number): number {
  if (passengers <= 0) return 0;
  const base = Math.ceil(passengers / CAPACITY);
  return Math.ceil(base * BUFFER_RATIO);
}

// Visual: a row of mini bus pills, each = 1 MTC bus needed.
function MTCBusPills({ count, color }: { count: number; color: string }) {
  const visible = Math.min(count, MAX_BUS_PILLS);
  const overflow = count - visible;
  if (count === 0) {
    return <span className="text-[10px] text-slate-400 italic">none</span>;
  }
  return (
    <div className="flex items-center gap-[3px] flex-wrap">
      {Array.from({ length: visible }).map((_, i) => (
        <div
          key={i}
          className="w-[8px] h-[16px] rounded-sm shadow-sm transition"
          style={{ background: color }}
          title="1 MTC Bus"
        />
      ))}
      {overflow > 0 && (
        <span
          className="text-[11px] font-mono font-bold ml-1"
          style={{ color }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

interface Variant {
  border: string;
  bg: string;
  shadow: string;
  accent: string;
  accentText: string;
  badgeBg: string;
  iconBubbleBg: string;
  iconAnimate: string;
  badgeText?: string;
  badgeAnimate?: string;
}

const VARIANTS: Record<string, Variant> = {
  alarmRed: {
    border: "border-red-400",
    bg: "bg-gradient-to-br from-rose-50 via-red-50 to-orange-50",
    shadow: "animate-siren-red",
    accent: "#dc2626",
    accentText: "text-red-700",
    badgeBg: "bg-red-600",
    iconBubbleBg: "bg-red-100",
    iconAnimate: "",
    badgeText: "DISPATCH NOW",
    badgeAnimate: "animate-pulse",
  },
  warnOrange: {
    border: "border-orange-400",
    bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
    shadow: "animate-siren-orange",
    accent: "#ea580c",
    accentText: "text-orange-700",
    badgeBg: "bg-orange-500",
    iconBubbleBg: "bg-orange-100",
    iconAnimate: "",
    badgeText: "PREP NOW",
    badgeAnimate: "animate-pulse",
  },
  calmCyan: {
    border: "border-cyan-200",
    bg: "bg-gradient-to-br from-cyan-50 via-sky-50 to-white",
    shadow: "shadow-card",
    accent: "#0891b2",
    accentText: "text-cyan-700",
    badgeBg: "bg-cyan-500",
    iconBubbleBg: "bg-cyan-100",
    iconAnimate: "",
    badgeText: "PLAN",
  },
};

interface TileProps {
  hoursLabel: string;
  buses: number;
  passengers: number;
  byCorp: CorpBreakdown[];
  icon: React.ReactNode;
  variant: keyof typeof VARIANTS;
}

function CorpChips({ items, accent }: { items: CorpBreakdown[]; accent: string }) {
  if (!items || items.length === 0) {
    return <span className="text-[10px] text-slate-400 italic">no buses yet</span>;
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((it) => (
        <span
          key={it.corp}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/80 border text-[10px] font-mono"
          style={{ borderColor: `${accent}55`, color: accent }}
          title={`${it.buses} bus${it.buses === 1 ? "" : "es"} from ${it.corp}`}
        >
          <span className="font-bold">{it.buses}</span>
          <span className="text-slate-700 font-semibold">{it.corp}</span>
        </span>
      ))}
    </div>
  );
}

function Tile({ hoursLabel, buses, passengers, byCorp, icon, variant }: TileProps) {
  const v = VARIANTS[variant];
  const baseBuses = Math.ceil(passengers / CAPACITY);
  const cityBuses = minMTCBuses(passengers);
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 ${v.border} ${v.bg} ${v.shadow} p-3 sm:p-4 min-w-0 w-full`}
    >
      {/* Decorative blurred orb */}
      <div
        className="absolute -top-12 -right-12 w-32 sm:w-44 h-32 sm:h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: v.accent }}
      />

      {/* Header: label + status badge. Allows wrap on tight viewports. */}
      <div className="relative flex items-start justify-between gap-2 flex-wrap mb-2">
        <span
          className={`text-[11px] sm:text-xs uppercase tracking-wider font-bold ${v.accentText} min-w-0`}
        >
          {hoursLabel}
        </span>
        {v.badgeText && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${v.badgeBg} text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap flex-shrink-0 ${v.badgeAnimate ?? ""}`}
          >
            {variant === "alarmRed" && <BellRing className="w-3 h-3" />}
            {v.badgeText}
          </span>
        )}
      </div>

      {/* Icon bubble + big number row */}
      <div className="relative mb-2 flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 ${v.iconBubbleBg} ${v.iconAnimate}`}
          style={{ color: v.accent }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-3xl sm:text-4xl font-black font-mono leading-none truncate"
            style={{ color: v.accent }}
          >
            {buses}
          </div>
          <div className={`text-[10px] sm:text-[11px] font-semibold mt-1 ${v.accentText} truncate`}>
            inbound buses<span className="hidden sm:inline"> (cumulative)</span>
          </div>
        </div>
      </div>

      {/* Corporation breakdown */}
      <div className="relative mb-2 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            By corporation
          </span>
        </div>
        <CorpChips items={byCorp} accent={v.accent} />
      </div>

      {/* Passengers expected row */}
      <div className="relative flex items-center gap-2 mb-3 min-w-0 flex-wrap">
        <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-sm sm:text-base font-bold text-slate-800">
          {passengers.toLocaleString("en-IN")}
        </span>
        <span className="text-xs text-slate-500">passengers expected</span>
      </div>

      {/* Minimum MTC Buses required — infographic */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 border border-white shadow-sm">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <BusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: v.accent }} />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold truncate">
              Minimum MTC Buses required
            </span>
          </div>
          <span className="text-lg font-mono font-black" style={{ color: v.accent }}>
            {cityBuses}
          </span>
        </div>
        <MTCBusPills count={cityBuses} color={v.accent} />
        <div className="text-[10px] text-slate-500 mt-1.5 leading-snug">
          {passengers.toLocaleString("en-IN")} expected ÷ 75 seats = {baseBuses} base · +20% buffer ={" "}
          <span className="font-mono font-bold" style={{ color: v.accent }}>
            min {cityBuses}
          </span>
        </div>
      </div>
    </div>
  );
}

export function KPITiles({ meta }: { meta: Meta | undefined }) {
  const t = meta?.totals;
  if (!t) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 w-full max-w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-slate-200 bg-white p-4 h-[230px] shadow-card min-w-0"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 w-full max-w-full">
      <Tile
        hoursLabel="Next 1 hour"
        buses={t.next_1h}
        passengers={t.passengers_1h}
        byCorp={t.by_corp_1h}
        icon={<Zap className="w-5 h-5" />}
        variant="alarmRed"
      />
      <Tile
        hoursLabel="Next 2 hours"
        buses={t.next_2h}
        passengers={t.passengers_2h}
        byCorp={t.by_corp_2h}
        icon={<Flame className="w-5 h-5" />}
        variant="warnOrange"
      />
      <Tile
        hoursLabel="Next 5 hours"
        buses={t.next_5h}
        passengers={t.passengers_5h}
        byCorp={t.by_corp_5h}
        icon={<Clock5 className="w-5 h-5" />}
        variant="calmCyan"
      />
    </div>
  );
}
