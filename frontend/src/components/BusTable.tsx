import { useMemo, useState } from "react";
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
  if (mins < 60) return { color: "#fb7185", label: "<1h" };
  if (mins < 180) return { color: "#fb923c", label: "1–3h" };
  if (mins < 360) return { color: "#fbbf24", label: "3–6h" };
  return { color: "#22d3ee", label: "6h+" };
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
  const [corp, setCorp] = useState<string>("ALL");
  const [from, setFrom] = useState<string>("ALL");
  const [lastSeen, setLastSeen] = useState<string>("ALL");
  const [eta, setEta] = useState<EtaBucket>("ALL");

  const corps = useMemo(
    () => ["ALL", ...Array.from(new Set(buses.map((b) => b.corporation))).sort()],
    [buses]
  );
  const fromPlaces = useMemo(
    () => ["ALL", ...Array.from(new Set(buses.map((b) => b.from_place).filter(Boolean))).sort()],
    [buses]
  );
  const lastPlaces = useMemo(
    () => ["ALL", ...Array.from(new Set(buses.map((b) => b.last_place).filter(Boolean))).sort()],
    [buses]
  );

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return buses
      .filter((b) => corp === "ALL" || b.corporation === corp)
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
  }, [buses, q, corp, from, lastSeen, eta]);

  const totalPax = useMemo(() => rows.reduce((s, b) => s + b.passengers, 0), [rows]);
  const cityBuses = Math.ceil(totalPax / 60);

  const anyFilter =
    q !== "" || corp !== "ALL" || from !== "ALL" || lastSeen !== "ALL" || eta !== "ALL";
  const clearAll = () => {
    setQ("");
    setCorp("ALL");
    setFrom("ALL");
    setLastSeen("ALL");
    setEta("ALL");
  };

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60">
      <div className="p-3 border-b border-ink-600 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Inbound buses</h3>
            <p className="text-xs text-slate-500">
              <span className="text-slate-300 font-mono">{rows.length.toLocaleString()}</span> of{" "}
              {buses.length.toLocaleString()} buses ·{" "}
              <span className="text-accent-cyan font-mono">{totalPax.toLocaleString("en-IN")}</span>{" "}
              passengers · ~
              <span className="text-accent-orange font-mono">{cityBuses}</span> city buses needed
              {anyFilter && <span className="text-slate-400"> · filtered</span>}
            </p>
          </div>
          {anyFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-accent-rose transition px-2 py-1 rounded border border-ink-600 hover:border-accent-rose/50"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect label="Corp" value={corp} options={corps} onChange={setCorp} />
          <FilterSelect label="From" value={from} options={fromPlaces} onChange={setFrom} />
          <FilterSelect label="Last seen" value={lastSeen} options={lastPlaces} onChange={setLastSeen} />
          <FilterSelect
            label="ETA"
            value={eta}
            options={ETA_BUCKETS.map((b) => b.value)}
            optionLabels={Object.fromEntries(ETA_BUCKETS.map((b) => [b.value, b.label]))}
            onChange={(v) => setEta(v as EtaBucket)}
          />
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="vehicle / place / depot…"
              className="bg-ink-700 border border-ink-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 w-64 focus:border-accent-cyan/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-ink-800/95 backdrop-blur z-10">
            <tr className="text-slate-400 border-b border-ink-600">
              <Th>Vehicle</Th>
              <Th>Corp</Th>
              <Th>From</Th>
              <Th>Last seen</Th>
              <Th right>Last @</Th>
              <Th right>km</Th>
              <Th right>Pax</Th>
              <Th right>ETA</Th>
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
                  ? `${Math.round(b.mins_to_arrive)} min`
                  : `${Math.floor(b.mins_to_arrive / 60)}h ${Math.round(b.mins_to_arrive % 60)}m`;
              return (
                <tr key={b.waybill} className="border-b border-ink-700 hover:bg-ink-700/40">
                  <Td>
                    <span className="font-mono text-slate-200">{b.vehicle}</span>
                  </Td>
                  <Td>
                    <span className="text-slate-400">{b.corporation}</span>
                  </Td>
                  <Td>{b.from_place}</Td>
                  <Td>
                    <span className="text-slate-300">{b.last_place}</span>
                  </Td>
                  <Td right mono>
                    {b.last_ticket_time}
                  </Td>
                  <Td right mono>
                    {b.distance_km.toFixed(0)}
                  </Td>
                  <Td right mono>
                    {b.passengers}
                  </Td>
                  <Td right mono>
                    {fmtArrival(b.arrival_dt)}
                  </Td>
                  <Td right>
                    <span
                      className="px-2 py-0.5 rounded font-mono text-[11px]"
                      style={{
                        background: `${bk.color}22`,
                        color: bk.color,
                        border: `1px solid ${bk.color}55`,
                      }}
                    >
                      {inMins}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                  No buses match these filters.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="sticky bottom-0 bg-ink-800/95 backdrop-blur z-10 border-t border-ink-600">
              <tr className="text-xs">
                <td colSpan={6} className="px-3 py-2 text-slate-400 text-right">
                  Total ({rows.length.toLocaleString()} bus{rows.length === 1 ? "" : "es"})
                </td>
                <td className="px-3 py-2 text-right font-mono text-accent-cyan">
                  {totalPax.toLocaleString("en-IN")}
                </td>
                <td colSpan={2} className="px-3 py-2 text-right text-slate-400">
                  ~<span className="font-mono text-accent-orange">{cityBuses}</span> city buses
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
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-ink-700 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition ${
          isActive
            ? "text-accent-cyan border-accent-cyan/50"
            : "text-slate-200 border-ink-600 focus:border-accent-cyan/50"
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

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th
    className={`px-3 py-2 font-medium text-[10px] uppercase tracking-wider ${
      right ? "text-right" : "text-left"
    }`}
  >
    {children}
  </th>
);

const Td = ({
  children,
  right,
  mono,
}: {
  children: React.ReactNode;
  right?: boolean;
  mono?: boolean;
}) => (
  <td
    className={`px-3 py-2 ${right ? "text-right" : "text-left"} ${
      mono ? "font-mono" : ""
    }`}
  >
    {children}
  </td>
);
