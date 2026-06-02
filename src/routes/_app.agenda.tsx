import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { AgendaDialog } from "@/components/agenda_dialog";
import { AgendaCalendar } from "@/components/agenda_calendar";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import type { AgendaFormValues } from "@/lib/schemas/operaciones";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda General — Elaboración" },
      { name: "description", content: "Planificación de turnos, mantenimientos y limpiezas CIP." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const { eventosAgenda, addEventoAgenda } = useOperacionesStore();
  const [cursor, set_cursor] = useState(new Date());
  const [open, set_open] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  function submit(data: AgendaFormValues) {
    addEventoAgenda({
      id: `ev-${Date.now()}`,
      titulo: data.titulo,
      inicio: new Date(data.inicio).toISOString(),
      fin: new Date(data.fin || data.inicio).toISOString(),
      tipo: data.tipo,
      descripcion: data.descripcion,
    });
    set_open(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda General</h1>
          <p className="text-sm text-muted-foreground">Planificación operativa mensual</p>
        </div>
        <AgendaDialog 
          open={open} 
          set_open={set_open} 
          submit={submit} 
        />
      </div>

      <AgendaCalendar 
        cursor={cursor} 
        set_cursor={set_cursor} 
        days={days} 
        events={eventosAgenda} 
      />
    </div>
  );
}