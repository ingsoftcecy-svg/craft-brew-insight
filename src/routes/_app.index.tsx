import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, Droplets, Database, Beaker } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  const { extractos, purgas, periodosStats, isLoading, fetchData } = useOperacionesStore();

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

  // --- CHEQUEOS DE PLATO (24h a 144h) ---
  const horasChequeo = [
    { key: "h24", label: "24h", color: "sky" as const },
    { key: "h48", label: "48h", color: "sky" as const },
    { key: "h72", label: "72h", color: "indigo" as const },
    { key: "h96", label: "96h", color: "indigo" as const },
    { key: "h120", label: "120h", color: "sky" as const },
    { key: "h144", label: "144h", color: "indigo" as const },
  ];

  const chequeosDelTurno = horasChequeo.map(({ key, label, color }) => {
    const items = extractos
      .filter((e: any) => e[key] && e[`estado${label}`] !== "Completado")
      .map((e: any) => ({ ...e, date: parseMexicanDate(e[key]) as Date, realId: e.id }))
      .filter(e => e.date && e.date >= inicioTurno && e.date <= finTurno)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6);
    return { key, label, color, items };
  });

  // --- PURGAS DE TRUB (Purga 1 a 8) ---
  const purgasDelTurno = Array.from({ length: 8 }, (_, i) => {
    const numeroPurga = i + 1;
    const items = purgas
      .filter(p => {
        const entry = p.purgas?.[i];
        if (!entry?.fechaHora) return false;
        // Solo mostrar si NO tiene tiempo ni realiza (pendiente)
        if (entry.tiempo && entry.realiza) return false;
        return true;
      })
      .map(p => {
        const entry = p.purgas[i];
        const date = parseMexicanDate(entry.fechaHora!);
        return {
          id: `${p.id}-p${numeroPurga}`,
          realId: p.id,
          tanque: p.tanque,
          marca: p.marca,
          date: date as Date,
          purgaId: p.id,
        };
      })
      .filter(item => item.date && item.date >= inicioTurno && item.date <= finTurno)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
    return { numeroPurga, items };
  });

  const totalPurgasPendientes = purgasDelTurno.reduce((acc, p) => acc + p.items.length, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Page title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Tablero General</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Monitor de Chequeos de Plato y Purgas de Trub · {turnoActual}</p>
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
            label="Purgas Pendientes Turno"
            value={totalPurgasPendientes}
            icon={Droplets}
            sub="Purgas de trub este turno"
            color="text-rose-600"
            bg="bg-gradient-to-br from-rose-100 to-rose-50 border-rose-200"
          />
        </div>
      )}
      
      {/* ═══════════════ SECCIÓN: CHEQUEOS DE PLATO ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Beaker className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Chequeos de Plato</h2>
            <p className="text-xs text-slate-500 font-medium">De 24 a 144 hrs · Turno actual</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {chequeosDelTurno.map(({ key, label, color, items }) => (
            <TaskListPanel
              key={key}
              title={`Chequeo ${label}`}
              subtitle="Pendientes de este turno"
              icon={Clock}
              emptyMessage="Todo al día"
              items={items}
              colorTheme={color as any}
              itemIcon={Database}
              linkTo="/chequeos"
              baseSearchParams={{ tipo: label }}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════ SECCIÓN: PURGAS DE TRUB ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
            <Droplets className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Purgas de Trub</h2>
            <p className="text-xs text-slate-500 font-medium">8 purgas por lote · Turno actual · Ligadas a QR</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {purgasDelTurno.map(({ numeroPurga, items }) => (
              <TaskListPanel
                key={`purga-${numeroPurga}`}
                title={`Purga ${numeroPurga}`}
                subtitle={`Pendientes de este turno`}
                icon={Droplets}
                emptyMessage="Todo al día"
                items={items}
                colorTheme="rose"
                itemIcon={Droplets}
                linkTo="/purgas"
              />
            ))}
          </div>
      </div>
      
      {/* Chart row */}
      <div className="grid gap-5 mt-5">
        <DashboardCharts extractos={extractos} periodosStats={periodosStats} />
      </div>
    </div>
  );
}
