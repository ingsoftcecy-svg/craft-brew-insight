import { createFileRoute } from "@tanstack/react-router";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { DashboardCharts } from "@/components/dashboard/dashboard_charts";
import { CpCpkChart } from "@/components/dashboard/cp_cpk_chart";
import { LlenadoBoxplotChart } from "@/components/dashboard/llenado_boxplot_chart";
import { TiempoPurgaCharts } from "@/components/dashboard/tiempo_purga_charts";

export const Route = createFileRoute("/_app/graficos")({
  head: () => ({
    meta: [
      { title: "Gráficos" },
      { name: "description", content: "Gráficos y Estadísticas." },
    ],
  }),
  component: GraficosPage,
});

function GraficosPage() {
  const extractos = useOperacionesStore(state => state.extractos);
  const purgas = useOperacionesStore(state => state.purgas);
  const periodosStats = useOperacionesStore(state => state.periodosStats);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Gráficos y Estadísticas</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Análisis visual de Purgas y Chequeos de Plato</p>
        </div>
      </div>

      <div className="grid gap-5 mt-5">
        <DashboardCharts extractos={extractos} periodosStats={periodosStats} />
        <CpCpkChart purgas={purgas} />
        <LlenadoBoxplotChart purgas={purgas} />
        <TiempoPurgaCharts purgas={purgas} />
      </div>
    </div>
  );
}
