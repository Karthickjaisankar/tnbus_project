import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
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
    <div className="h-full rounded-xl border border-ink-600 bg-ink-800/60 p-4 flex flex-col">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-slate-100">
          Arrivals per hour — next 5 hours
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Each bar = buses arriving <span className="text-slate-200 font-medium">within</span> that
          1-hour window (not cumulative). City buses needed = passengers ÷ 60 seats.
        </p>
      </div>

      <div className="flex-1 min-h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 36, right: 32, left: 8, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2742" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              tick={{ fontSize: 12, fill: "#cbd5e1" }}
              tickLine={false}
              axisLine={{ stroke: "#28344f" }}
            />
            <YAxis
              yAxisId="l"
              stroke="#22d3ee"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Passengers",
                angle: -90,
                position: "insideLeft",
                fill: "#22d3ee",
                fontSize: 11,
                offset: 10,
              }}
            />
            <YAxis
              yAxisId="r"
              orientation="right"
              stroke="#fb923c"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Buses",
                angle: 90,
                position: "insideRight",
                fill: "#fb923c",
                fontSize: 11,
                offset: 10,
              }}
            />
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
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              yAxisId="l"
              dataKey="passengers"
              fill="#22d3ee"
              radius={[6, 6, 0, 0]}
              name="Passengers"
              maxBarSize={70}
            >
              <LabelList
                dataKey="passengers"
                position="top"
                fill="#22d3ee"
                fontSize={13}
                fontWeight={600}
                formatter={(v: number) => v.toLocaleString("en-IN")}
              />
            </Bar>
            <Line
              yAxisId="r"
              dataKey="city_buses_needed"
              stroke="#fb923c"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#fb923c", stroke: "#0d1322", strokeWidth: 2 }}
              name="City buses needed"
            >
              <LabelList
                dataKey="city_buses_needed"
                position="top"
                fill="#fb923c"
                fontSize={12}
                fontWeight={600}
                offset={10}
                formatter={(v: number) => `~${v}`}
              />
            </Line>
            <Line
              yAxisId="r"
              dataKey="buses"
              stroke="#a78bfa"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={{ r: 4, fill: "#a78bfa", stroke: "#0d1322", strokeWidth: 2 }}
              name="Inbound buses"
            >
              <LabelList
                dataKey="buses"
                position="bottom"
                fill="#a78bfa"
                fontSize={11}
                offset={8}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
