import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { Header } from "./components/Header";
import { KPITiles } from "./components/KPITiles";
import { MapPanel } from "./components/Map";
import { HourlyChart } from "./components/HourlyChart";
import { BusTable } from "./components/BusTable";
import { ErrorBanner, StaleDataBanner } from "./components/Banners";

export default function App() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast });
  const buses = useQuery({ queryKey: ["buses"], queryFn: api.buses });

  const isLoading = meta.isLoading || forecast.isLoading || buses.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header meta={meta.data} />

      <main className="flex-1 px-3 sm:px-6 py-3 sm:py-5 grid gap-3 sm:gap-4" style={{ gridTemplateRows: "auto auto 1fr auto" }}>
        <ErrorBanner meta={meta.data} />
        <StaleDataBanner meta={meta.data} />

        <KPITiles meta={meta.data} />

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]">
            <HourlyChart hours={forecast.data?.hours ?? []} />
          </div>
          <div className="min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]">
            <MapPanel buses={buses.data?.buses ?? []} />
          </div>
        </section>

        <section>
          <BusTable buses={buses.data?.buses ?? []} />
        </section>
      </main>

      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 shadow-card">
          Loading…
        </div>
      )}
    </div>
  );
}
