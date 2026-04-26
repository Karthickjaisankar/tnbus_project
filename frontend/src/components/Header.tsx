import { useEffect, useState } from "react";
import { Bus as BusIcon, RefreshCw, TrafficCone, Wifi } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { ApproachTraffic, Meta } from "../types";

const TRAFFIC_STYLES: Record<
  ApproachTraffic["status"],
  { color: string; bg: string; border: string; label: string }
> = {
  clear:    { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "CLEAR" },
  moderate: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "MODERATE" },
  heavy:    { color: "#e11d48", bg: "#fff1f2", border: "#fda4af", label: "HEAVY" },
};

function ApproachChip({ t }: { t: ApproachTraffic | null | undefined }) {
  if (!t) {
    return (
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Approach</div>
        <div className="text-xs text-slate-400">unknown</div>
      </div>
    );
  }
  const s = TRAFFIC_STYLES[t.status];
  return (
    <div
      className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border flex-shrink-0"
      style={{ background: s.bg, borderColor: s.border }}
      title={`${t.origin} → ${t.destination} (${t.distance_km} km) · ${t.duration_traffic_min} min vs ${t.duration_normal_min} min normal · ratio ${t.ratio}`}
    >
      <TrafficCone className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          <span className="hidden sm:inline">Chennai </span>approach
        </div>
        <div className="text-xs font-mono font-semibold whitespace-nowrap" style={{ color: s.color }}>
          {s.label} · {Math.round(t.duration_traffic_min)}m
        </div>
      </div>
    </div>
  );
}

function formatIST(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatISTShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function Header({ meta }: { meta: Meta | undefined }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const qc = useQueryClient();
  const refresh = useMutation({
    mutationFn: api.refresh,
    onSuccess: () => qc.invalidateQueries(),
  });

  const istNow = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Brand row — always at top */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center flex-shrink-0">
              <BusIcon className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold tracking-wide text-slate-900 truncate">
                TN Bus Inflow → <span className="text-accent-cyan">Kilambakkam</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
                Live tracker of inbound state buses · estimated hourly arrivals
              </p>
            </div>
          </div>

          {/* Refresh button — always visible */}
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-accent-cyan/50 hover:text-accent-cyan transition text-sm text-slate-700 disabled:opacity-50 shadow-card flex-shrink-0"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${refresh.isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Status row — scrolls horizontally on tiny screens */}
        <div className="mt-2 sm:mt-3 flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <ApproachChip t={meta?.approach_traffic} />
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Source</div>
            <div className="text-xs sm:text-sm font-mono text-slate-900 whitespace-nowrap">
              <span className="hidden sm:inline">{formatIST(meta?.snapshot_ts ?? null)}</span>
              <span className="sm:hidden">{formatISTShort(meta?.snapshot_ts ?? null)}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[180px] hidden sm:block">
              {meta?.filename ?? "—"}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-auto sm:ml-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">IST clock</div>
            <div className="text-xs sm:text-sm font-mono text-accent-cyan font-semibold whitespace-nowrap">
              {istNow}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end whitespace-nowrap">
              <Wifi className="w-3 h-3" /> 60s
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
