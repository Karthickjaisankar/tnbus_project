import { BellRing, Bus as BusIcon, Clock5, Flame, Users, Zap } from "lucide-react";
import { Meta } from "../types";

const CAPACITY = 60;
const MAX_BUS_PILLS = 18;

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
    border: "border-red-300",
    bg: "bg-gradient-to-br from-rose-50 via-red-50 to-orange-50",
    shadow: "shadow-alarm",
    accent: "#dc2626",
    accentText: "text-red-700",
    badgeBg: "bg-red-600",
    iconBubbleBg: "bg-red-100",
    iconAnimate: "animate-alarm-pulse",
    badgeText: "DISPATCH NOW",
    badgeAnimate: "animate-pulse",
  },
  warnOrange: {
    border: "border-orange-300",
    bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
    shadow: "shadow-warn",
    accent: "#ea580c",
    accentText: "text-orange-700",
    badgeBg: "bg-orange-500",
    iconBubbleBg: "bg-orange-100",
    iconAnimate: "animate-soft-pulse",
    badgeText: "PREP NOW",
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
  icon: React.ReactNode;
  variant: keyof typeof VARIANTS;
}

function Tile({ hoursLabel, buses, passengers, icon, variant }: TileProps) {
  const v = VARIANTS[variant];
  const cityBuses = Math.ceil(passengers / CAPACITY);
  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 ${v.border} ${v.bg} ${v.shadow} p-4`}
    >
      {/* Decorative blurred orb */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: v.accent }}
      />

      {/* Header: label + status badge */}
      <div className="relative flex items-start justify-between mb-2">
        <span className={`text-xs uppercase tracking-wider font-bold ${v.accentText}`}>
          {hoursLabel}
        </span>
        {v.badgeText && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${v.badgeBg} text-white text-[10px] font-bold uppercase tracking-wider shadow-sm ${v.badgeAnimate ?? ""}`}
          >
            {variant === "alarmRed" && <BellRing className="w-3 h-3" />}
            {v.badgeText}
          </span>
        )}
      </div>

      {/* Icon bubble with pulse animation for urgent variants */}
      <div className="relative mb-2 flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center ${v.iconBubbleBg} ${v.iconAnimate}`}
          style={{ color: v.accent }}
        >
          {icon}
        </div>
        <div>
          <div className="text-4xl font-black font-mono leading-none" style={{ color: v.accent }}>
            {buses}
          </div>
          <div className={`text-[11px] font-semibold mt-1 ${v.accentText}`}>
            inbound buses (cumulative)
          </div>
        </div>
      </div>

      {/* Passenger count with icon */}
      <div className="relative flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-slate-500" />
        <span className="text-base font-bold text-slate-800">
          {passengers.toLocaleString("en-IN")}
        </span>
        <span className="text-xs text-slate-500">passengers</span>
      </div>

      {/* MTC Buses needed — infographic */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-white shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <BusIcon className="w-3.5 h-3.5" style={{ color: v.accent }} />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            MTC Buses needed
          </span>
        </div>
        <MTCBusPills count={cityBuses} color={v.accent} />
        <div className="text-[10px] text-slate-500 mt-1.5 leading-snug">
          {passengers.toLocaleString("en-IN")} passengers ÷ 60 seats ={" "}
          <span className="font-mono font-bold" style={{ color: v.accent }}>
            ~{cityBuses}
          </span>{" "}
          MTC Buses
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
            className="rounded-xl border-2 border-slate-200 bg-white p-4 h-[230px] shadow-card"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile
        hoursLabel="Next 1 hour"
        buses={t.next_1h}
        passengers={t.passengers_1h}
        icon={<Zap className="w-5 h-5" />}
        variant="alarmRed"
      />
      <Tile
        hoursLabel="Next 2 hours"
        buses={t.next_2h}
        passengers={t.passengers_2h}
        icon={<Flame className="w-5 h-5" />}
        variant="warnOrange"
      />
      <Tile
        hoursLabel="Next 5 hours"
        buses={t.next_5h}
        passengers={t.passengers_5h}
        icon={<Clock5 className="w-5 h-5" />}
        variant="calmCyan"
      />
    </div>
  );
}
