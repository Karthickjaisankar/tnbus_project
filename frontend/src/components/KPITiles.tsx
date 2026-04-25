import { Bus as BusIcon, Clock3, Clock4, Clock5, Flame, TrendingUp, Users } from "lucide-react";
import { Meta } from "../types";

interface TileProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}

function Tile({ label, value, sub, icon, accent }: TileProps) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60 backdrop-blur p-4 relative overflow-hidden group">
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between relative">
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <div
        className="mt-2 text-3xl font-semibold font-mono relative"
        style={{ color: accent }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500 relative">{sub}</div>}
    </div>
  );
}

export function KPITiles({ meta }: { meta: Meta | undefined }) {
  const t = meta?.totals;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <Tile
        label="In flight"
        value={t?.buses ?? "—"}
        sub="buses inbound"
        icon={<BusIcon className="w-4 h-4" />}
        accent="#22d3ee"
      />
      <Tile
        label="Next 1 hour"
        value={t?.next_1h ?? "—"}
        sub={t ? `buses · ${t.passengers_1h.toLocaleString("en-IN")} passengers` : "—"}
        icon={<Flame className="w-4 h-4" />}
        accent="#fb7185"
      />
      <Tile
        label="Next 2 hours"
        value={t?.next_2h ?? "—"}
        sub={t ? `buses · ${t.passengers_2h.toLocaleString("en-IN")} passengers` : "—"}
        icon={<TrendingUp className="w-4 h-4" />}
        accent="#fb923c"
      />
      <Tile
        label="Next 3 hours"
        value={t?.next_3h ?? "—"}
        sub={t ? `buses · ${t.passengers_3h.toLocaleString("en-IN")} passengers` : "—"}
        icon={<Clock3 className="w-4 h-4" />}
        accent="#fbbf24"
      />
      <Tile
        label="Next 4 hours"
        value={t?.next_4h ?? "—"}
        sub={t ? `buses · ${t.passengers_4h.toLocaleString("en-IN")} passengers` : "—"}
        icon={<Clock4 className="w-4 h-4" />}
        accent="#a78bfa"
      />
      <Tile
        label="Next 5 hours"
        value={t?.next_5h ?? "—"}
        sub={t ? `buses · ${t.passengers_5h.toLocaleString("en-IN")} passengers` : "—"}
        icon={<Clock5 className="w-4 h-4" />}
        accent="#22d3ee"
      />
      <Tile
        label="Total passengers"
        value={t?.passengers?.toLocaleString("en-IN") ?? "—"}
        sub="onboard right now"
        icon={<Users className="w-4 h-4" />}
        accent="#34d399"
      />
    </div>
  );
}
