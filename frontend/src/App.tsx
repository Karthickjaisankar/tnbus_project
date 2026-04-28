import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { Header } from "./components/Header";
import { KPITiles } from "./components/KPITiles";
import { MapPanel } from "./components/Map";
import { HourlyChart } from "./components/HourlyChart";
import { BusTable } from "./components/BusTable";
import { ErrorBanner, FormulaNoticeBanner, StaleDataBanner, DataNotRefreshedBanner } from "./components/Banners";

export default function App() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta });
  const forecast = useQuery({ queryKey: ["forecast"], queryFn: api.forecast });
  const buses = useQuery({ queryKey: ["buses"], queryFn: api.buses });

  const isLoading = meta.isLoading || forecast.isLoading || buses.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden w-full max-w-full">
      <Header meta={meta.data} />

      <main
        className="flex-1 px-3 sm:px-6 py-3 sm:py-5 grid gap-3 sm:gap-4 w-full max-w-full"
        style={{
          gridTemplateRows: "auto auto 1fr auto",
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <DataNotRefreshedBanner />
        <ErrorBanner meta={meta.data} />
        <StaleDataBanner meta={meta.data} />
        <FormulaNoticeBanner />

        <KPITiles meta={meta.data} />

        <section className="grid gap-3 sm:gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] w-full max-w-full">
          <div className="min-h-[420px] sm:min-h-[480px] lg:min-h-[560px] min-w-0 max-w-full">
            <HourlyChart hours={forecast.data?.hours ?? []} />
          </div>
          <div className="min-h-[420px] sm:min-h-[480px] lg:min-h-[560px] min-w-0 max-w-full">
            <MapPanel buses={buses.data?.buses ?? []} />
          </div>
        </section>

        <section className="w-full max-w-full min-w-0">
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
