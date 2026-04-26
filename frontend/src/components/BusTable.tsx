import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Bus } from "../types";

const ETA_BUCKETS = [
  { value: "ALL", label: "All ETAs" },
  { value: "lt1", label: "<1h" },
  { value: "1to3", label: "1–3h" },
  { value: "3to6", label: "3–6h" },
  { value: "gt6", label: "6h+" },
] as const;

type EtaBucket = (typeof ETA_BUCKETS)[number]["value"];

function bucket(mins: number) {
  if (mins < 0) return { color: "#475569", bg: "#f1f5f9", border: "#cbd5e1", label: "arrived" };
  if (mins < 60) return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "<1h" };
  if (mins < 180) return { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "1–3h" };
  if (mins < 360) return { color: "#a16207", bg: "#fefce8", border: "#fde047", label: "3–6h" };
  return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: ">6h" };
}

function inEtaBucket(mins: number, b: EtaBucket): boolean {
  if (b === "ALL") return true;
  if (b === "lt1") return mins < 60;
  if (b === "1to3") return mins >= 60 && mins < 180;
  if (b === "3to6") return mins >= 180 && mins < 360;
  return mins >= 360;
}

function fmtArrival(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function BusTable({ buses }: { buses: Bus[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("ALL");
  const [lastSeen, setLastSeen] = useState<string>("ALL");
  const [eta, setEta] = useState<EtaBucket>("ALL");

  const fromPlaces = useMemo(
    () =>
      ["ALL", ...Array.from(new Set(buses.map((b) => b.from_place).filter(Boolean))).sort()],
    [buses]
  );
  const lastPlaces = useMemo(
    () =>
      ["ALL", ...Array.from(new Set(buses.map((b) => b.last_place).filter(Boolean))).sort()],
    [buses]
  );

  // If a filter's selected value disappears from the new dataset (e.g. file
  // refresh dropped that origin), reset to "ALL" so the table doesn't end up
  // empty with a stale filter the user can no longer see in the dropdown.
  useEffect(() => {
    if (from !== "ALL" && !fromPlaces.includes(from)) setFrom("ALL");
  }, [fromPlaces, from]);
  useEffect(() => {
    if (lastSeen !== "ALL" && !lastPlaces.includes(lastSeen)) setLastSeen("ALL");
  }, [lastPlaces, lastSeen]);

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return buses
      .filter((b) => from === "ALL" || b.from_place === from)
      .filter((b) => lastSeen === "ALL" || b.last_place === lastSeen)
      .filter((b) => inEtaBucket(b.mins_to_arrive, eta))
      .filter(
        (b) =>
          !ql ||
          b.vehicle.toLowerCase().includes(ql) ||
          b.from_place.toLowerCase().includes(ql) ||
          b.last_place.toLowerCase().includes(ql) ||
          b.depot.toLowerCase().includes(ql)
      )
      .sort((a, b) => a.mins_to_arrive - b.mins_to_arrive);
  }, [buses, q, from, lastSeen, eta]);

  const totalPax = useMemo(() => rows.reduce((s, b) => s + b.passengers, 0), [rows]);
  // 20% operational buffer over base (matches backend mtc_buses_required, 75-seat MTC bus).
  const cityBuses = totalPax > 0 ? Math.ceil(Math.ceil(totalPax / 75) * 1.2) : 0;

  const anyFilter = q !== "" || from !== "ALL" || lastSeen !== "ALL" || eta !== "ALL";
  const clearAll = () => {
    setQ("");
    setFrom("ALL");
    setLastSeen("ALL");
    setEta("ALL");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card min-w-0 w-full max-w-full overflow-hidden">
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Inbound buses</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
              <span className="text-slate-700 font-mono font-semibold">
                {rows.length.toLocaleString()}
              </span>{" "}
              of {buses.length.toLocaleString()} buses ·{" "}
              <span className="text-accent-cyan font-mono font-semibold">
                {totalPax.toLocaleString("en-IN")}
              </span>{" "}
              pax · minimum{" "}
              <span className="text-accent-orange font-mono font-semibold">{cityBuses}</span> MTC
              Buses required (incl. 20% buffer)
              {anyFilter && <span className="text-slate-400"> · filtered</span>}
            </p>
          </div>
          {anyFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-accent-rose transition px-2 py-1 rounded border border-slate-200 hover:border-accent-rose/50 flex-shrink-0"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect label="From" value={from} options={fromPlaces} onChange={setFrom} />
          <FilterSelect
            label="Last Seen"
            value={lastSeen}
            options={lastPlaces}
            onChange={setLastSeen}
          />
          <FilterSelect
            label="ETA"
            value={eta}
            options={ETA_BUCKETS.map((b) => b.value)}
            optionLabels={Object.fromEntries(ETA_BUCKETS.map((b) => [b.value, b.label]))}
            onChange={(v) => setEta(v as EtaBucket)}
          />
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="vehicle / place / depot…"
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 w-full sm:w-64 focus:border-accent-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
            <tr className="text-slate-600">
              <Th>Vehicle</Th>
              <Th>From</Th>
              <Th>Last seen</Th>
              <Th right hideOn="sm">Last @</Th>
              <Th right hideOn="md">km</Th>
              <Th right>Pax</Th>
              <Th right hideOn="lg">ETA</Th>
              <Th right>In</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const bk = bucket(b.mins_to_arrive);
              const inMins =
                b.mins_to_arrive < 0
                  ? "arrived"
                  : b.mins_to_arrive < 60
                  ? `${Math.round(b.mins_to_arrive)}m`
                  : `${Math.floor(b.mins_to_arrive / 60)}h ${Math.round(b.mins_to_arrive % 60)}m`;
              return (
                <tr key={b.waybill} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>
                    <span className="font-mono text-slate-900 font-medium">{b.vehicle}</span>
                  </Td>
                  <Td>
                    <span className="text-slate-700">{b.from_place}</span>
                  </Td>
                  <Td>
                    <span className="text-slate-900">{b.last_place}</span>
                  </Td>
                  <Td right mono hideOn="sm">
                    <span className="text-slate-600">{b.last_ticket_time}</span>
                  </Td>
                  <Td right mono hideOn="md">
                    <span className="text-slate-700">{b.distance_km.toFixed(0)}</span>
                  </Td>
                  <Td right mono>
                    <span className="text-slate-900 font-semibold">{b.passengers}</span>
                  </Td>
                  <Td right mono hideOn="lg">
                    <span className="text-slate-600">{fmtArrival(b.arrival_dt)}</span>
                  </Td>
                  <Td right>
                    <span
                      className="px-1.5 sm:px-2 py-0.5 rounded font-mono text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap"
                      style={{ background: bk.bg, color: bk.color, borderColor: bk.border }}
                    >
                      {inMins}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                  No buses match these filters.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="sticky bottom-0 bg-slate-50 z-10 border-t border-slate-200">
              <tr className="text-xs">
                <td colSpan={8} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 font-medium">
                      Total · {rows.length.toLocaleString()} bus{rows.length === 1 ? "" : "es"}
                    </span>
                    <span className="text-slate-700">
                      <span className="font-mono text-accent-cyan font-semibold">
                        {totalPax.toLocaleString("en-IN")}
                      </span>{" "}
                      pax · minimum{" "}
                      <span className="font-mono text-accent-orange font-semibold">{cityBuses}</span>{" "}
                      MTC Buses
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  optionLabels?: Record<string, string>;
  onChange: (v: string) => void;
}

function FilterSelect({ label, value, options, optionLabels, onChange }: FilterSelectProps) {
  const isActive = value !== "ALL";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-100 transition ${
          isActive
            ? "text-accent-cyan border-accent-cyan/60 font-semibold"
            : "text-slate-700 border-slate-200 hover:border-slate-300"
        }`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabels?.[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

type Hide = "sm" | "md" | "lg";

const HIDE_CLASS: Record<Hide, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const Th = ({
  children,
  right,
  hideOn,
}: {
  children: React.ReactNode;
  right?: boolean;
  hideOn?: Hide;
}) => (
  <th
    className={`px-2 sm:px-3 py-2 font-semibold text-[10px] uppercase tracking-wider ${
      right ? "text-right" : "text-left"
    } ${hideOn ? HIDE_CLASS[hideOn] : ""}`}
  >
    {children}
  </th>
);

const Td = ({
  children,
  right,
  mono,
  hideOn,
}: {
  children: React.ReactNode;
  right?: boolean;
  mono?: boolean;
  hideOn?: Hide;
}) => (
  <td
    className={`px-2 sm:px-3 py-2 ${right ? "text-right" : "text-left"} ${
      mono ? "font-mono" : ""
    } ${hideOn ? HIDE_CLASS[hideOn] : ""}`}
  >
    {children}
  </td>
);
