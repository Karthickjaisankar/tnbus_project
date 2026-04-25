import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { Header } from "./components/Header";
import { KPITiles } from "./components/KPITiles";
import { MapPanel } from "./components/Map";
import { HourlyChart } from "./components/HourlyChart";
import { BusTable } from "./components/BusTable";
import { BunchingBanner, ErrorBanner, StaleDataBanner } from "./components/Banners";

export default function App() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast });
  const buses = useQuery({ queryKey: ["buses"], queryFn: api.buses });

  const isLoading = meta.isLoading || forecast.isLoading || buses.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Header meta={meta.data} />

      <main className="flex-1 px-6 py-4 grid gap-4" style={{ gridTemplateRows: "auto auto 1fr auto" }}>
        <ErrorBanner meta={meta.data} />
        <StaleDataBanner meta={meta.data} />
        <BunchingBanner alert={meta.data?.bunching_alert} />

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
    </div>
  );
}
