import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, Droplets, Database, Beaker, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";

import { KpiCard } from "@/components/dashboard/kpi_card";
import { TaskListPanel } from "@/components/dashboard/task_list_panel";
import { DashboardPrintView } from "@/components/dashboard/dashboard_print_view";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Agenda de Control" },
      {
        name: "description",
        content: "Resumen operativo del departamento de elaboración cervecera.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { isSuperUser } = useAuthStore();
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  const baseDate = React.useMemo(() => {
    if (!selectedDateStr) return undefined;
    const parts = selectedDateStr.split("-");
    if (parts.length === 3) {
      const d = new Date();
      d.setFullYear(parseInt(parts[0], 10));
      d.setMonth(parseInt(parts[1], 10) - 1);
      d.setDate(parseInt(parts[2], 10));
      // Fijamos a mediodía para que las funciones de turno.ts no resten 1 día si es de madrugada
      d.setHours(12, 0, 0, 0);
      return d;
    }
    return undefined;
  }, [selectedDateStr]);

  const {
    isLoading,
    ahora,
    turnoActual,
    fermentando,
    chequeosDelTurno,
    totalChequeosPendientes,
    purgasDelTurno,
    totalPurgasPendientes,
  } = useDashboardData(selectedTurnoId, baseDate);

  const handlePrint = () => {
    document.body.classList.remove("dlp-active");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.add("dlp-active");
      }, 500);
    }, 50);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Page title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Tablero General</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Monitor de Chequeos de Plato y Purgas de Trub · {turnoActual}
          </p>
        </div>
        {isSuperUser && (
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 bg-white h-9"
            />
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedTurnoId(null)}
                className={`text-xs px-3 py-1.5 font-semibold rounded-md transition-all duration-150 ${
                  !selectedTurnoId
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Actual
              </button>
              {["Turno 1", "Turno 2", "Turno 3"].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setSelectedTurnoId(t)}
                  className={`text-xs px-3 py-1.5 font-semibold rounded-md transition-all duration-150 ${
                    selectedTurnoId === t
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  T{i + 1}
                </button>
              ))}
            </div>
            
          </div>
        )}
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 print:hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50 border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 print:hidden">
          <KpiCard
            label="Lotes Activos (Global)"
            value={fermentando}
            icon={FlaskConical}
            sub="Ciclos sin finalizar (0 a 144h)"
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
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold bg-blue-600 border border-transparent text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Imprimir Lista
          </button>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-slate-500 font-medium">
                8 purgas por lote · Turno actual · Ligadas a QR
              </p>
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
      <DashboardPrintView
        turnoActual={turnoActual}
        ahora={ahora}
        chequeosDelTurno={chequeosDelTurno}
        purgasDelTurno={purgasDelTurno}
      />
    </div>
  );
}
