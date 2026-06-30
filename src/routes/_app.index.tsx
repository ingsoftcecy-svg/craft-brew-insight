import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, Droplets, Database, Beaker, Printer } from "lucide-react";
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
  const { extractos, purgas, periodosStats, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => { fetchData("todos"); }, [fetchData]);

  const periodoActivo = useOperacionesStore.getState().periodoActual || "2026-06";
  const extractosPeriodoActivo = extractos.filter(e => {
    if (!e.fechaLlenado) return false;
    const date = parseMexicanDate(e.fechaLlenado);
    if (!date) return false;
    return format(date, "yyyy-MM") === periodoActivo;
  });

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

  const handlePrint = () => {
    document.body.classList.remove("dlp-active");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.add("dlp-active");
      }, 500);
    }, 50);
  };

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

  // Identificar tanques únicos que no han terminado su ciclo (hasta la h144).
  // Como se importó historial, filtramos los que tengan un h144 muy viejo (más de 7 días en el pasado)
  // para que no salgan los 140 tanques como "ocupados".
  const limiteViejo = new Date();
  limiteViejo.setDate(limiteViejo.getDate() - 7);

  const tanquesOcupados = new Set(
    extractos.filter(e => {
      if (e.estado144h === "Completado") return false;
      const h144Date = parseMexicanDate(e.h144);
      if (!h144Date) return false;
      return h144Date >= limiteViejo;
    }).map(e => e.tanque)
  );

  const fermentando = tanquesOcupados.size;
  const totalChequeosPendientes = chequeosDelTurno.reduce((acc, c) => acc + c.items.length, 0);
  
  // Para completados del turno, necesitamos buscar en extractos los que sí estén completados
  // y su fecha caiga en este turno.
  const completados72 = extractos
    .map(e => ({ ...e, date: parseMexicanDate(e.h72) as Date }))
    .filter(e => e.date && e.date >= inicioTurno && e.date <= finTurno && e.estado72h === "Completado")
    .length;

  // --- PURGAS DE TRUB (Purga Inicial + 1 a 8) ---
  const purgasDelTurno = Array.from({ length: 9 }, (_, i) => {
    const tituloPurga = i === 0 ? "Purga Inicial" : `Purga ${i}`;
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
          id: `${p.id}-p${i}`,
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
    return { tituloPurga, items, index: i };
  });

  const totalPurgasPendientes = purgasDelTurno.reduce((acc, p) => acc + p.items.length, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Page title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Tablero General</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Monitor de Chequeos de Plato y Purgas de Trub · {turnoActual}</p>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-3 print:hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50 border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3 print:hidden">
          <KpiCard
            label="Tanques en Fermentación"
            value={fermentando}
            icon={FlaskConical}
            sub="Registros Activos"
            color="text-amber-600"
            bg="bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200"
          />
          <KpiCard
            label="Chequeos de Platos Pendientes"
            value={totalChequeosPendientes}
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
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-sm">
              <Beaker className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Chequeos de Plato</h2>
              <p className="text-xs text-slate-500 font-medium">De 24 a 144 hrs · Turno actual</p>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Imprimir Lista
          </button>
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
        <div className="print:hidden">
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
              {purgasDelTurno.map(({ tituloPurga, items, index }) => (
                <TaskListPanel
                  key={`purga-${index}`}
                  title={tituloPurga}
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
      </div>
      
      
      {/* ═══════════════ VISTA DE IMPRESIÓN ═══════════════ */}
      <div className="hidden print:block w-full text-black bg-white">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase">Checklist de Operación - Chequeos de Plato</h1>
          <p className="text-sm text-gray-600 mt-1">Turno: {turnoActual} | Fecha: {format(ahora, "dd/MM/yyyy HH:mm")}</p>
        </div>
        
        <table className="w-full border-collapse border border-black text-left text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 font-bold text-center w-20">Hora</th>
              <th className="border border-black p-2 font-bold w-24">Tanque</th>
              <th className="border border-black p-2 font-bold w-32">Marca</th>
              <th className="border border-black p-2 font-bold w-24 text-center">Plato</th>
              <th className="border border-black p-2 font-bold">PH</th>
              <th className="border border-black p-2 font-bold">Presión</th>
            </tr>
          </thead>
          <tbody>
            {chequeosDelTurno.flatMap(c => 
              c.items.map(item => ({
                tipo: c.label,
                tanque: item.tanque,
                marca: item.marca,
                date: item.date,
              }))
            ).sort((a, b) => a.date.getTime() - b.date.getTime()).map((item, i) => (
              <tr key={i} className="h-12">
                <td className="border border-black p-2 text-center font-medium">{format(item.date, "HH:mm")}</td>
                <td className="border border-black p-2 font-semibold">T-{item.tanque}</td>
                <td className="border border-black p-2">{item.marca}</td>
                <td className="border border-black p-2 text-center text-gray-700">{item.tipo}</td>
                
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
            {chequeosDelTurno.flatMap(c => c.items).length === 0 && (
              <tr>
                <td colSpan={7} className="border border-black p-4 text-center text-gray-500 italic">No hay chequeos programados para este turno</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
