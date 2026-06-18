import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, Droplets, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useEffect } from "react";
import { format } from "date-fns";
import { obtenerTurnoPorHora } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";

import { KpiCard } from "@/components/dashboard/kpi_card";
import { TaskListPanel } from "@/components/dashboard/task_list_panel";
import { DashboardCharts } from "@/components/dashboard/dashboard_charts";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Control de Elaboración" },
      { name: "description", content: "Resumen operativo del departamento de elaboración cervecera." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { extractos, periodosStats, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => { fetchData("todos"); }, [fetchData]);

  const periodoActivo = useOperacionesStore.getState().periodoActual || "2026-06";
  const extractosPeriodoActivo = extractos.filter(e => {
    if (!e.fechaLlenado) return false;
    const date = parseMexicanDate(e.fechaLlenado);
    if (!date) return false;
    return format(date, "yyyy-MM") === periodoActivo;
  });

  const fermentando   = extractosPeriodoActivo.length;
  const completados72 = extractosPeriodoActivo.filter(e => e.h72 && e.estado72h === "Completado").length;
  const pendientes72  = extractosPeriodoActivo.filter(e => e.h72 && e.estado72h !== "Completado").length;
  const pendientes24  = extractosPeriodoActivo.filter(e => e.h24 && e.estado24h !== "Completado").length;
  const completados24  = extractosPeriodoActivo.filter(e => e.h24 && e.estado24h === "Completado").length;

  const ahora = new Date();
  const turnoActual = obtenerTurnoPorHora(ahora.toISOString());

  const getLimitesTurnoActual = (now: Date) => {
    const start = new Date(now);
    const end = new Date(now);
    start.setSeconds(0); start.setMilliseconds(0);
    end.setSeconds(59); end.setMilliseconds(999);
    const h = now.getHours();
    const m = now.getMinutes();
    const mins = h * 60 + m;

    if (mins >= 6 * 60 && mins < 15 * 60 + 30) {
      start.setHours(6, 0);
      end.setHours(15, 29);
    } else if (mins >= 15 * 60 + 30 && mins < 23 * 60) {
      start.setHours(15, 30);
      end.setHours(22, 59);
    } else {
      if (h >= 23) {
        start.setHours(23, 0);
        end.setDate(end.getDate() + 1);
        end.setHours(5, 59);
      } else {
        start.setDate(start.getDate() - 1);
        start.setHours(23, 0);
        end.setHours(5, 59);
      }
    }
    return { start, end };
  };

  const { start: inicioTurno, end: finTurno } = getLimitesTurnoActual(ahora);

  const proximos72 = extractos
    .filter(e => e.h72 && e.estado72h !== "Completado")
    .map(e => ({ ...e, date: parseMexicanDate(e.h72) as Date }))
    .filter(e => e.date && e.date >= inicioTurno && e.date <= finTurno)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

   const proximos24 = extractos
    .filter(e => e.h24 && e.estado24h !== "Completado")
    .map(e => ({ ...e, date: parseMexicanDate(e.h24) as Date }))
    .filter(e => e.date && e.date >= inicioTurno && e.date <= finTurno)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const proximasPurgas = extractos
    .filter(e => e.fechaLlenado)
    .map(e => {
      const parsedLlenado = parseMexicanDate(e.fechaLlenado);
      return {
        id: e.id,
        tanque: e.tanque,
        marca: e.marca,
        date: parsedLlenado ? new Date(parsedLlenado.getTime() + 64 * 60 * 60 * 1000) : null as unknown as Date,
      };
    })
    .filter(e => e.date && e.date >= inicioTurno && e.date <= finTurno)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Page title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Tablero General</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Monitor de Purgas y Chequeo de Platos</p>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50 border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3">
          <KpiCard
            label="Tanques en Fermentación"
            value={fermentando}
            icon={FlaskConical}
            sub="Registros Activos"
            color="text-amber-600"
            bg="bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200"
          />
          <KpiCard
            label="Chequeos 72h Pendientes"
            value={pendientes72}
            icon={Clock}
            sub="Por realizar"
            color="text-sky-600"
            bg="bg-gradient-to-br from-sky-100 to-sky-50 border-sky-200"
          />
          <KpiCard
            label="Chequeos 72h Completados"
            value={completados72}
            icon={CheckCircle2}
            sub="Confirmados"
            color="text-emerald-600"
            bg="bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200"
          />
        </div>
      )}
      
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 mb-5">
        <TaskListPanel
          title="Próximos Chequeos 24h"
          subtitle="Chequeos de tu turno actual"
          icon={Clock}
          emptyMessage="Todo al día"
          items={proximos24}
          colorTheme="sky"
          itemIcon={Database}
          linkTo="/extracto"
        />

        <TaskListPanel
          title="Próximos Chequeos 72h"
          subtitle="Chequeos de tu turno actual"
          icon={Clock}
          emptyMessage="Todo al día"
          items={proximos72}
          colorTheme="indigo"
          itemIcon={Database}
          linkTo="/extracto72"
        />

        <TaskListPanel
          title="Próximas Purgas"
          subtitle="Purgas de tu turno actual (8ª - 64 hrs)"
          icon={Droplets}
          emptyMessage="Sin purgas en este turno"
          items={proximasPurgas}
          colorTheme="rose"
          itemIcon={Droplets}
          linkTo="/purgas"
        />
      </div>
      
      {/* Chart row */}
      <div className="grid gap-5 mt-5">
        <DashboardCharts extractos={extractos} periodosStats={periodosStats} />
      </div>
    </div>
  );
}
