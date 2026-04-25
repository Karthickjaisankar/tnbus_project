import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Bus } from "../types";

function bucket(mins: number) {
  if (mins < 60) return { color: "#fb7185", label: "<1h" };
  if (mins < 180) return { color: "#fb923c", label: "1–3h" };
  if (mins < 360) return { color: "#fbbf24", label: "3–6h" };
  return { color: "#22d3ee", label: "6h+" };
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

  const corps = useMemo(
    () => ["ALL", ...Array.from(new Set(buses.map((b) => b.corporation))).sort()],
    [buses]
  );

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return buses
      .filter((b) => corp === "ALL" || b.corporation === corp)
      .filter(
        (b) =>
          !ql ||
          b.vehicle.toLowerCase().includes(ql) ||
          b.from_place.toLowerCase().includes(ql) ||
          b.last_place.toLowerCase().includes(ql) ||
          b.depot.toLowerCase().includes(ql)
      )
      .sort((a, b) => a.mins_to_arrive - b.mins_to_arrive);
  }, [buses, q, corp]);

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60">
      <div className="flex items-center justify-between p-3 border-b border-ink-600">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Inbound buses</h3>
          <p className="text-xs text-slate-500">{rows.length.toLocaleString()} of {buses.length.toLocaleString()} shown · sorted by ETA</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={corp}
            onChange={(e) => setCorp(e.target.value)}
            className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-accent-cyan/50 focus:outline-none"
          >
            {corps.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
          </tbody>
        </table>
      </div>
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
