import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { Header } from "./components/Header";
import { KPITiles } from "./components/KPITiles";
import { MapPanel } from "./components/Map";
import { HourlyChart } from "./components/HourlyChart";
import { BusTable } from "./components/BusTable";

export default function App() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast });
  const buses = useQuery({ queryKey: ["buses"], queryFn: api.buses });

  const isLoading = meta.isLoading || forecast.isLoading || buses.isLoading;
  const err = meta.error || forecast.error || buses.error;

  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Header meta={meta.data} />

      {meta.data?.error && (
        <div className="bg-rose-900/40 border-b border-rose-700/50 px-6 py-2 text-xs text-rose-200">
          Pipeline error: {meta.data.error}
        </div>
      )}

      <main className="flex-1 px-6 py-4 grid gap-4" style={{ gridTemplateRows: "auto 1fr auto" }}>
        <KPITiles meta={meta.data} />

        <section className="grid gap-4 lg:grid-cols-3 min-h-[480px]">
          <div className="lg:col-span-2 min-h-[480px]">
            <MapPanel buses={buses.data?.buses ?? []} />
          </div>
          <div className="min-h-[480px]">
            <HourlyChart hours={forecast.data?.hours ?? []} />
          </div>
        </section>

        <section>
          <BusTable buses={buses.data?.buses ?? []} />
        </section>
      </main>

      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-xs text-slate-300 shadow-glow">
          Loading…
        </div>
      )}
      {err && (
        <div className="fixed bottom-4 right-4 bg-rose-900/80 border border-rose-700 rounded-lg px-3 py-2 text-xs text-rose-100">
          {String(err)}
        </div>
      )}
    </div>
  );
}
