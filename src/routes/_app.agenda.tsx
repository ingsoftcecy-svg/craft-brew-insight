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

      const fechaPurga = new Date(fechaBase.getTime() + purgaSeleccionada * 8 * 60 * 60 * 1000);
      return [
        {
          id: `purga-${e.id}-${purgaSeleccionada}`,
          titulo: `Purga ${purgaSeleccionada} - Tanque ${e.tanque}`,
          inicio: fechaPurga.toISOString(),
          fin: fechaPurga.toISOString(),
          tipo: "Purga" as const,
          descripcion: `Marca: ${e.marca}`,
          turno: obtenerTurnoPorHora(fechaPurga.toISOString()),
          completado: false,
        },
      ];
    });

    // Calcular "completado" para eventosAgenda (Chequeo Plato)
    const eventosMapeados = eventosAgenda.map((evento: any) => {
      let completado = false;
      let extractoId: string | undefined = undefined;
      if (evento.titulo?.includes("Chequeo Plato 72h")) {
        const match = evento.titulo.match(/Tanque\s+([\w-]+)/i);
        if (match) {
          const tanque = match[1];
          const extracto = extractos.find((e) => e.tanque === tanque);
          if (extracto) {
            extractoId = extracto.id;
            if (extracto.estado72h === "Completado") {
              completado = true;
            }
          }
        }
      }
      return { ...evento, completado, extractoId };
    });

    const todosLosEventos = [
      ...eventosMapeados.filter((e) => !e.titulo?.includes("Purga")),
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  Purga {num}
                </option>
              ))}
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
