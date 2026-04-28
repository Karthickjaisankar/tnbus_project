import { useEffect, useState } from "react";
import { Bus as BusIcon } from "lucide-react";
import { Meta } from "../types";

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

        </div>

        <div className="mt-2 sm:mt-3 flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex-shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Last updated</div>
            <div className="text-xs sm:text-sm font-mono text-slate-900 whitespace-nowrap">
              <span className="hidden sm:inline">{formatIST(meta?.snapshot_ts ?? null)}</span>
              <span className="sm:hidden">{formatISTShort(meta?.snapshot_ts ?? null)}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[180px] hidden sm:block">
              {meta?.filename ?? "—"}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-auto">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">IST clock</div>
            <div className="text-xs sm:text-sm font-mono text-accent-cyan font-semibold whitespace-nowrap">
              {istNow}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
