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
          <h3 className="text-sm font-semibold text-slate-200">Hourly arrivals — next 5 hours</h3>
          <p className="text-xs text-slate-500">Bars: bus count · Line: passenger count (right axis)</p>
        </div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2742" />
            <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
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
            />
            <Bar yAxisId="l" dataKey="buses" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Buses" />
            <Line
              yAxisId="r"
              dataKey="passengers"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ r: 3, fill: "#fb923c" }}
              name="Passengers"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
