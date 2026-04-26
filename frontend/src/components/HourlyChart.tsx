import { useEffect, useState } from "react";
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

function HourTick(props: any) {
  const { x, y, payload, data } = props;
  const item = data[payload.index] as ChartDatum | undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#475569" fontSize={11} fontWeight={500}>
        {payload.value}
      </text>
      {item && (
        <text x={0} y={0} dy={28} textAnchor="middle" fill="#7c3aed" fontSize={10} fontWeight={600}>
          {item.buses} buses
        </text>
      )}
    </g>
  );
}

function useIsMobile(breakpoint = 640) {
  const [m, setM] = useState(
    typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [breakpoint]);
  return m;
}

export function HourlyChart({ hours }: { hours: ForecastHour[] }) {
  const isMobile = useIsMobile();
  const data: ChartDatum[] = hours.map((h) => ({ ...h, label: fmtHour(h.hour) }));

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col shadow-card min-w-0 overflow-hidden">
      <div className="mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Arrivals per hour — next 5 hours
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          Bars = passengers expected in that 1-hour window. Orange line = minimum MTC Buses
          required (passengers ÷ 60 + 20% buffer). Number under each hour = inbound buses.
        </p>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 italic">
          ETA = travel time from each bus's last known location to Kilambakkam (live Google traffic).
        </p>
      </div>

      <div className="flex-1 min-h-[300px] sm:min-h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={
              isMobile
                ? { top: 28, right: 8, left: 0, bottom: 22 }
                : { top: 44, right: 24, left: 0, bottom: 28 }
            }
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#475569"
              tick={(props) => <HourTick {...props} data={data} />}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              height={44}
              interval={0}
            />
            <YAxis
              yAxisId="l"
              stroke="#0891b2"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 32 : 50}
              label={
                isMobile
                  ? undefined
                  : {
                      value: "Passengers expected",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#0891b2",
                      fontSize: 11,
                      offset: 10,
                    }
              }
            />
            <YAxis
              yAxisId="r"
              orientation="right"
              stroke="#ea580c"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={isMobile ? 24 : 40}
              label={
                isMobile
                  ? undefined
                  : {
                      value: "MTC Buses",
                      angle: 90,
                      position: "insideRight",
                      fill: "#ea580c",
                      fontSize: 11,
                      offset: 10,
                    }
              }
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
              height={24}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#475569" }}
            />
            <Bar
              yAxisId="l"
              dataKey="passengers"
              fill="#0891b2"
              radius={[6, 6, 0, 0]}
              name="Passengers expected"
              maxBarSize={isMobile ? 36 : 70}
            >
              <LabelList
                dataKey="passengers"
                position="top"
                fill="#0891b2"
                fontSize={isMobile ? 10 : 13}
                fontWeight={700}
                offset={4}
                formatter={(v: number) => v.toLocaleString("en-IN")}
              />
            </Bar>
            <Line
              yAxisId="r"
              dataKey="city_buses_needed"
              stroke="#ea580c"
              strokeWidth={2.5}
              dot={{ r: isMobile ? 4 : 5, fill: "#ea580c", stroke: "#ffffff", strokeWidth: 2 }}
              name="Min MTC Buses required"
            >
              {!isMobile && (
                <LabelList
                  dataKey="city_buses_needed"
                  position="top"
                  fill="#ea580c"
                  fontSize={12}
                  fontWeight={700}
                  offset={14}
                  formatter={(v: number) => `${v}`}
                />
              )}
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
