import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { AgendaCalendar } from "@/components/calendar/agenda_calendar";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { obtenerTurnoPorHora } from "@/data/turno";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda de Control" },
      { name: "description", content: "Purgas y Extractos ." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const { eventosAgenda, extractos } = useOperacionesStore();
  const [cursor, set_cursor] = useState(new Date());

  const [turnoSeleccionado, set_turnoSeleccionado] = useState<string>(
    () => obtenerTurnoPorHora(new Date().toISOString()) || "TODOS",
  );
  const [purgaSeleccionada, set_purgaSeleccionada] = useState<number>(8);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventosFiltrados = useMemo(() => {
    // Derivar eventos de purga desde extractos (misma lógica que la pantalla de Purgas)
    const purgasEventos = extractos.flatMap((e) => {
      const fechaBase = e.fechaLlenado ? new Date(e.fechaLlenado) : null;
      if (!fechaBase) return [];

      const marcaConfig = useOperacionesStore.getState().purgasConfig?.[e.marca] || { cantidad: 8, cadaHrs: 8 };
      const cadaHrs = marcaConfig.cadaHrs || 8;
      const maxPurgas = marcaConfig.cantidad || 8;
      
      if (purgaSeleccionada > maxPurgas) return []; // No event if purga num exceeds configured for this brand

      const fechaPurga = new Date(fechaBase.getTime() + purgaSeleccionada * cadaHrs * 60 * 60 * 1000);
      return [
        {
          id: `purga-${e.id}-${purgaSeleccionada}`,
          titulo: `Purga ${purgaSeleccionada} - Tanque ${e.tanque}`,
          inicio: fechaPurga.toISOString(),
          fin: fechaPurga.toISOString(),
          tipo: "Purga" as const,
          descripcion: `Marca: ${e.marca}`,
          turno: obtenerTurnoPorHora(fechaPurga.toISOString()) || undefined,
          completado: false,
        },
      ];
    });

    // 1. Generar Chequeos Dinámicamente
    const chequeosEventos = extractos.flatMap((e) => {
      const horas = [24, 48, 72, 96, 120, 128, 136, 144];
      return horas.flatMap((h) => {
        const key = `h${h}` as keyof typeof e;
        const estadoKey = `estado${h}h` as keyof typeof e;
        const horaStr = e[key];
        if (!horaStr) return [];
        const dateObj = new Date(horaStr as string);
        if (isNaN(dateObj.getTime())) return [];

        return [
          {
            id: `chequeo-${e.id}-${h}`,
            titulo: `Chequeo Plato ${h}h - Tanque ${e.tanque}`,
            inicio: dateObj.toISOString(),
            fin: dateObj.toISOString(),
            tipo: "Turno" as const,
            descripcion: `Marca: ${e.marca}`,
            turno: obtenerTurnoPorHora(dateObj.toISOString()) || undefined,
            completado: e[estadoKey] === "Completado",
            extractoId: e.id,
          },
        ];
      });
    });

    // 2. Mantener eventos manuales de Firestore (ignorando Purgas y Chequeos viejos)
    const eventosManuales = eventosAgenda.filter(
      (e) => !e.titulo?.includes("Purga") && !e.titulo?.includes("Chequeo Plato")
    );

    const todosLosEventos = [
      ...eventosManuales,
      ...chequeosEventos,
      ...purgasEventos,
    ];

    if (turnoSeleccionado === "TODOS") return todosLosEventos;
    return todosLosEventos.filter((evento: any) => evento.turno === turnoSeleccionado);
  }, [eventosAgenda, extractos, turnoSeleccionado, purgaSeleccionada]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda General</h1>
          <p className="text-sm text-muted-foreground">Planificación operativa por turnos</p>
        </div>
      </div>

      {/*SELECCIÓN DE TURNO Y PURGA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-muted p-1 rounded-lg gap-1 border text-sm">
            {(["TODOS", "Turno 1", "Turno 2", "Turno 3"] as string[]).map((turno) => (
              <button
                key={turno}
                type="button"
                onClick={() => set_turnoSeleccionado(turno)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  turnoSeleccionado === turno
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                }`}
              >
                {turno === "TODOS" ? "Ver Todo" : turno}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Número de Purga:</span>
            <select
              value={purgaSeleccionada}
              onChange={(e) => set_purgaSeleccionada(Number(e.target.value))}
              className="bg-background border rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Array.from(
                { length: Math.max(9, ...useOperacionesStore.getState().purgas.map((p) => p.purgas.length)) },
                (_, num) => (
                  <option key={num} value={num}>
                    {num === 0 ? "Purga Inicial" : `Purga ${num}`}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/**/}
        {turnoSeleccionado !== "TODOS" && (
          <span className="text-xs text-muted-foreground animate-fade-in bg-secondary px-3 py-1.5 rounded-full font-medium">
            Purgas y Chequeo de Platos del Turno:{" "}
            <strong className="text-primary">{turnoSeleccionado}</strong>
          </span>
        )}
      </div>

      {/* Calendario con los datos ya filtrados */}
      <AgendaCalendar
        cursor={cursor}
        set_cursor={set_cursor}
        days={days}
        events={eventosFiltrados}
      />
    </div>
  );
}
