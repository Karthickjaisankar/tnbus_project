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
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4 flex flex-col shadow-card">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-slate-900">
          Arrivals per hour — next 5 hours
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Each bar = buses arriving <span className="text-slate-700 font-medium">within</span> that
          1-hour window (not cumulative). City buses needed = passengers ÷ 60 seats.
        </p>
      </div>

      <div className="flex-1 min-h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 36, right: 32, left: 8, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#475569"
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              yAxisId="l"
              stroke="#0891b2"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Passengers",
                angle: -90,
                position: "insideLeft",
                fill: "#0891b2",
                fontSize: 11,
                offset: 10,
              }}
            />
            <YAxis
              yAxisId="r"
              orientation="right"
              stroke="#ea580c"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Buses",
                angle: 90,
                position: "insideRight",
                fill: "#ea580c",
                fontSize: 11,
                offset: 10,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#0f172a",
                fontSize: 12,
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.10)",
              }}
              labelStyle={{ color: "#0891b2", fontWeight: 600 }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: "#475569" }}
            />
            <Bar
              yAxisId="l"
              dataKey="passengers"
              fill="#0891b2"
              radius={[6, 6, 0, 0]}
              name="Passengers"
              maxBarSize={70}
            >
              <LabelList
                dataKey="passengers"
                position="top"
                fill="#0891b2"
                fontSize={13}
                fontWeight={700}
                formatter={(v: number) => v.toLocaleString("en-IN")}
              />
            </Bar>
            <Line
              yAxisId="r"
              dataKey="city_buses_needed"
              stroke="#ea580c"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#ea580c", stroke: "#ffffff", strokeWidth: 2 }}
              name="City buses needed"
            >
              <LabelList
                dataKey="city_buses_needed"
                position="top"
                fill="#ea580c"
                fontSize={12}
                fontWeight={700}
                offset={10}
                formatter={(v: number) => `~${v}`}
              />
            </Line>
            <Line
              yAxisId="r"
              dataKey="buses"
              stroke="#7c3aed"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={{ r: 4, fill: "#7c3aed", stroke: "#ffffff", strokeWidth: 2 }}
              name="Inbound buses"
            >
              <LabelList
                dataKey="buses"
                position="bottom"
                fill="#7c3aed"
                fontSize={11}
                fontWeight={600}
                offset={8}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
