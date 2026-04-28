import { AlertTriangle, BellRing, Clock, Info, Pause } from "lucide-react";
import { BunchingAlert, Meta } from "../types";

export function AutoRefreshStoppedBanner() {
  return (
    <div className="rounded-xl border border-orange-300 bg-orange-100 p-3 flex items-center gap-3 shadow-card">
      <Pause className="w-5 h-5 text-orange-700 flex-shrink-0" />
      <div className="text-sm text-orange-900 font-semibold">
        Automatic Data Refresh has been stopped — displaying last known data
      </div>
    </div>
  );
}

export function FormulaNoticeBanner() {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-2.5 sm:p-3 flex items-start gap-2.5 sm:gap-3 shadow-card min-w-0 w-full">
      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 flex-shrink-0 mt-0.5" />
      <div className="text-[12px] sm:text-sm text-sky-900 leading-snug min-w-0">
        <span className="font-semibold">Note on passenger count estimates:</span> 
        <span className="font-mono font-semibold"> SETC × 45</span>{" "}
        and <span className="font-mono font-semibold">other corps × 65</span> per inbound bus.
        MTC city bus capacity assumed at <span className="font-mono font-semibold">75 seats</span>.
      </div>
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

function fmtRelativeMin(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  if (diff < 0) return `${Math.round(-diff)} min ago`;
  if (diff < 60) return `in ${Math.round(diff)} min`;
  return `in ${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
}

export function BunchingBanner({ alert }: { alert: BunchingAlert | null | undefined }) {
  if (!alert) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-3 shadow-card">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center">
        <BellRing className="w-5 h-5 text-accent-rose animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-accent-rose font-semibold text-sm">
          BUNCHING DETECTED
          <span className="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[10px] uppercase tracking-wider">
            action
          </span>
        </div>
        <div className="text-sm text-slate-800 mt-0.5">
          <span className="font-mono text-accent-rose font-semibold">{alert.buses} buses</span>{" "}
          arriving in a 15-min window{" "}
          <span className="font-mono">
            {fmtHHMM(alert.start)}–{fmtHHMM(alert.end)}
          </span>{" "}
          carrying{" "}
          <span className="font-mono font-semibold">{alert.passengers.toLocaleString("en-IN")}</span>{" "}
          passengers expected ({fmtRelativeMin(alert.start)})
        </div>
      </div>
      <div className="flex-shrink-0 text-right border-l border-rose-200 pl-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-500">Pre-stage</div>
        <div className="text-2xl font-mono font-bold text-accent-rose">
          ~{alert.city_buses_needed}
        </div>
        <div className="text-[10px] text-slate-500">city buses</div>
      </div>
    </div>
  );
}

export function StaleDataBanner({ meta }: { meta: Meta | undefined }) {
  if (!meta?.is_stale) return null;
  const ageStr = meta.snapshot_ts
    ? `Last data update: ${new Date(meta.snapshot_ts).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`
    : "No source data";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3 shadow-card">
      <Clock className="w-5 h-5 text-accent-amber flex-shrink-0" />
      <div className="text-sm text-amber-900">
        <span className="font-semibold">Stale data warning</span> — no fresh xlsx in over{" "}
        <span className="font-mono font-semibold">40 min</span>. {ageStr}. Forecasts may be
        inaccurate; check the Drive upload pipeline.
      </div>
    </div>
  );
}

export function ErrorBanner({ meta }: { meta: Meta | undefined }) {
  if (!meta?.error) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-3 shadow-card">
      <AlertTriangle className="w-5 h-5 text-accent-rose flex-shrink-0" />
      <div className="text-sm text-rose-900">
        <span className="font-semibold">Pipeline error:</span>{" "}
        <span className="font-mono text-xs">{meta.error}</span>
      </div>
    </div>
  );
}
