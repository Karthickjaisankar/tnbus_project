import { useEffect, useState } from "react";
import { Bus as BusIcon, RefreshCw, Wifi } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
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
    <header className="border-b border-ink-700 bg-ink-800/60 backdrop-blur-md">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 border border-accent-cyan/30 flex items-center justify-center shadow-glow">
            <BusIcon className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wide">
              TN Bus Inflow → <span className="text-accent-cyan">Kilambakkam, Chennai</span>
            </h1>
            <p className="text-xs text-slate-400">
              Live tracker of inbound state buses · estimated hourly arrivals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Source data</div>
            <div className="text-sm font-mono text-slate-200">{formatIST(meta?.snapshot_ts ?? null)}</div>
            <div className="text-[10px] text-slate-500">{meta?.filename ?? "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">IST clock</div>
            <div className="text-sm font-mono text-accent-cyan">{istNow}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
              <Wifi className="w-3 h-3" /> auto-refresh 60s
            </div>
          </div>
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 border border-ink-600 hover:border-accent-cyan/50 transition text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refresh.isPending ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
