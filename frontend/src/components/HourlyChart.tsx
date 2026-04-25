import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ForecastHour } from "../types";

function fmtHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function HourlyChart({ hours }: { hours: ForecastHour[] }) {
  const data = hours.map((h) => ({ ...h, label: fmtHour(h.hour) }));
  return (
    <div className="h-full rounded-xl border border-ink-600 bg-ink-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Arrivals — next 5 hours · 30-min buckets
          </h3>
          <p className="text-xs text-slate-500">
            <span className="text-accent-cyan">Bars</span>: passengers arriving ·{" "}
            <span className="text-accent-orange">Line</span>: city buses needed (50 pax/bus)
          </p>
        </div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2742" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="l" stroke="#22d3ee" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" stroke="#fb923c" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "#0d1322",
                border: "1px solid #28344f",
                borderRadius: 8,
                color: "#e5e7eb",
                fontSize: 12,
              }}
              labelStyle={{ color: "#22d3ee" }}
              formatter={(value: number, name: string) => {
                if (name === "Passengers") return [value.toLocaleString("en-IN"), name];
                if (name === "Buses") return [value, "Inbound buses"];
                if (name === "City buses needed") return [value, name];
                return [value, name];
              }}
            />
            <Bar
              yAxisId="l"
              dataKey="passengers"
              fill="#22d3ee"
              radius={[4, 4, 0, 0]}
              name="Passengers"
            />
            <Line
              yAxisId="r"
              dataKey="city_buses_needed"
              stroke="#fb923c"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#fb923c" }}
              name="City buses needed"
            />
            <Line
              yAxisId="l"
              dataKey="buses"
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={{ r: 2, fill: "#a78bfa" }}
              name="Buses"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
