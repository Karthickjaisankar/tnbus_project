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

interface ChartDatum extends ForecastHour {
  label: string;
}

// Custom X-axis tick: hour label on first line, "N inbound buses" on second.
// Putting the inbound-bus count here avoids overlap with the bar/line labels above.
function HourTick(props: any) {
  const { x, y, payload, data } = props;
  const item = data[payload.index] as ChartDatum | undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#475569" fontSize={12} fontWeight={500}>
        {payload.value}
      </text>
      {item && (
        <text x={0} y={0} dy={30} textAnchor="middle" fill="#7c3aed" fontSize={10.5} fontWeight={600}>
          {item.buses} inbound buses
        </text>
      )}
    </g>
  );
}

export function HourlyChart({ hours }: { hours: ForecastHour[] }) {
  const data: ChartDatum[] = hours.map((h) => ({ ...h, label: fmtHour(h.hour) }));

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col shadow-card">
      <div className="mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Arrivals per hour — next 5 hours
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          Bars = passengers in that 1-hour window. Orange line = MTC Buses needed (passengers ÷ 60).
          Number under each hour = inbound buses arriving in that window.
        </p>
      </div>

      <div className="flex-1 min-h-[340px] sm:min-h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 44, right: 24, left: 0, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#475569"
              tick={(props) => <HourTick {...props} data={data} />}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              height={50}
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
                value: "MTC Buses",
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
                offset={6}
                formatter={(v: number) => v.toLocaleString("en-IN")}
              />
            </Bar>
            <Line
              yAxisId="r"
              dataKey="city_buses_needed"
              stroke="#ea580c"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#ea580c", stroke: "#ffffff", strokeWidth: 2 }}
              name="MTC Buses needed"
            >
              <LabelList
                dataKey="city_buses_needed"
                position="top"
                fill="#ea580c"
                fontSize={12}
                fontWeight={700}
                offset={14}
                formatter={(v: number) => `~${v}`}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
