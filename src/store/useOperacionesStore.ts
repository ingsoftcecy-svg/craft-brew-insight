import { create } from "zustand";
import { ExtractoRow, PurgaRow, AgendaEvent, PurgaEntry, MarcaCerveza } from "../types/proceso";

import { addHours } from "date-fns";
import { obtenerTurnoPorHora } from "@/data/turno";

interface OperacionesState {
  periodoActual: string;
  extractos: ExtractoRow[];
  purgas: PurgaRow[];
  eventosAgenda: AgendaEvent[];
  isLoading: boolean;
  error: string | null;

  fetchData: () => Promise<void>;
  addPurga: (purga: PurgaRow) => void;
  updateExtracto: (id: string, data: Partial<ExtractoRow>) => void;
  toggleEstado72h: (id: string) => Promise<void>;
  addEventoAgenda: (evento: AgendaEvent) => void;
  updatePurgaRow: (tanque: string, numeroPurga: number, fechaHora: string, tiempo: number, realiza: string) => void;
  updatePurgaField: (id: string, numeroPurga: number, campo: "tiempo" | "realiza", valor: string | number) => Promise<void>;
  cargarPurgasDesdeArchivo: (filas: any[]) => void;
  cargarExtractosDesdeArchivo: (filas: any[]) => void;
}

export const useOperacionesStore = create<OperacionesState>((set) => ({
  periodoActual: "2026-06",
  extractos: [],
  purgas: [],
  eventosAgenda: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Importamos las funciones dinámicamente para evitar dependencias circulares si las hubiera
      const { obtenerExtractosPorPeriodo, listarPeriodosExtractos } = await import("@/lib/api/extractosFirebaseService");
      const { obtenerEventosAgenda } = await import("@/lib/api/agendaFirebaseService");
      const { obtenerPurgasPorPeriodo } = await import("@/lib/api/purgasFirebaseService");
      
      const periodosDisponibles = await listarPeriodosExtractos().catch(() => []);
      
      // Por defecto agarramos el periodo más reciente (índice 0, ya que Firebase nos los devuelve ordenados descendentes)
      const periodoMasReciente = periodosDisponibles.length > 0 ? periodosDisponibles[0].periodo : "2026-06";
      
      const [extractosFb, purgasFb, eventosAgendaFb] = await Promise.all([
        obtenerExtractosPorPeriodo(periodoMasReciente).catch(() => []),
        obtenerPurgasPorPeriodo(periodoMasReciente).catch(() => []),
        obtenerEventosAgenda().catch(() => []),
      ]);
  
      const extractos = extractosFb;
      const purgas = purgasFb;
      const eventosAgenda = eventosAgendaFb;

      set({ extractos, purgas, eventosAgenda, periodoActual: periodoMasReciente, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar datos", isLoading: false });
    }
  },

  addPurga: (purga) => set((state) => ({ purgas: [purga, ...state.purgas] })),
  
  updatePurgaRow: (tanque, numeroPurga, fechaHora, tiempo, realiza) => set((state) => ({
    purgas: state.purgas.map((r) => {
      if (r.tanque !== tanque) return r;
      
      const newPurgas = [...r.purgas];
      newPurgas[numeroPurga - 1] = {
        fechaHora: fechaHora || null,
        tiempo: tiempo || null,
        realiza: realiza || null
      };
      
      return { ...r, purgas: newPurgas };
    })
  })),

  updatePurgaField: async (id, numeroPurga, campo, valor) => {
    // 1. Optimistic update
    set((state) => ({
      purgas: state.purgas.map((r) => {
        if (r.id !== id) return r;
        const newPurgas = [...r.purgas];
        if (!newPurgas[numeroPurga - 1]) newPurgas[numeroPurga - 1] = { fechaHora: null, tiempo: null, realiza: null };
        if (campo === "tiempo") {
          newPurgas[numeroPurga - 1].tiempo = Number(valor);
        } else {
          newPurgas[numeroPurga - 1].realiza = String(valor);
        }
        return { ...r, purgas: newPurgas };
      })
    }));
  },

  cargarPurgasDesdeArchivo: (filas) => set((state) => {
    const nuevosEventosAgenda: AgendaEvent[] = [];
    const purgasMapeadas: PurgaRow[] = filas.map((fila: any, index: number) => {
      const purgas: PurgaEntry[] = fila.purgas || [];
      const tanque = fila.tanque || String(fila.TANQUE || "");
      const marca = fila.marca || String(fila.MARCA || "");

      // Generar eventos de agenda para cada purga con fecha válida
      purgas.forEach((p: PurgaEntry, i: number) => {
        if (p.fechaHora) {
          const fechaEvento = new Date(p.fechaHora);
          if (!isNaN(fechaEvento.getTime())) {
            const turnoCalculado = obtenerTurnoPorHora(fechaEvento.toISOString());

            nuevosEventosAgenda.push({
              id: `ev-auto-${tanque || index}-p${i + 1}`,
              titulo: `Purga ${i + 1} - Tanque ${tanque || "S/N"}`,
              inicio: fechaEvento.toISOString(),
              fin: addHours(fechaEvento, 0.5).toISOString(),
              tipo: "Turno",
              descripcion: `Operador: ${p.realiza || "No registrado"} | Tiempo: ${p.tiempo || 0} min | Marca: ${marca}`,
              turno: turnoCalculado,
            } as any);
          }
        }
      });

      return {
        id: fila.id || `pr-${Date.now()}-${index}`,
        tanque,
        fecha: fila.fecha || fila.fechaLlenado || "",
        marca,
        fechaLlenado: fila.fechaLlenado || "",
        horas: String(fila.horas || "0"),
        historicas: String(fila.historicas || "0"),
        purgas,
      };
    });

    return {
      purgas: purgasMapeadas,
      eventosAgenda: [...state.eventosAgenda, ...nuevosEventosAgenda],
    };
  }),

  cargarExtractosDesdeArchivo: (filas) => set((state) => {
    const nuevosEventosAgenda: AgendaEvent[] = [];

    const extractosMapeados: ExtractoRow[] = filas.map((fila: any, index: number) => {
      const tanque = fila.tanque || String(fila.FERMENTADOR || "");
      const marca = fila.marca || String(fila.MARCA || "Modelo Especial");
      
      const fechaVal = fila.h72;
      if (fechaVal) {
        const fechaEvento = new Date(fechaVal);
        if (!isNaN(fechaEvento.getTime())) {
          const turnoCalculado = obtenerTurnoPorHora(fechaEvento.toISOString());
          nuevosEventosAgenda.push({
            id: `ev-auto-ext-72-h72-${tanque || index}`,
            titulo: `Chequeo Plato 72h - Tanque ${tanque || "S/N"}`,
            inicio: fechaEvento.toISOString(),
            fin: addHours(fechaEvento, 0.5).toISOString(),
            tipo: "Turno",
            descripcion: `Marca: ${marca}`,
            turno: turnoCalculado,
          } as any);
        }
      }

      return {
        ...fila,
      };
    });

    // Guardar en Firebase los nuevos eventos de agenda
    if (nuevosEventosAgenda.length > 0) {
      import("@/lib/api/agendaFirebaseService").then(({ guardarEventosEnFirestore }) => {
        guardarEventosEnFirestore(nuevosEventosAgenda).catch(err => {
          console.error("Error guardando eventos de agenda:", err);
        });
      });
    }

    return {
      extractos: extractosMapeados,
      eventosAgenda: [...state.eventosAgenda, ...nuevosEventosAgenda],
    };
  }),

  updateExtracto: (id, data) => set((state) => ({
    extractos: state.extractos.map((e) => e.id === id ? { ...e, ...data } : e)
  })),

  toggleEstado72h: async (id: string) => {
    const state = useOperacionesStore.getState();
    const target = state.extractos.find(e => e.id === id);
    if (!target) return;

    const nuevoEstado = target.estado72h === "Completado" ? "Pendiente" : "Completado";
    const periodo = state.periodoActual;

    // Optimistic UI update
    set((s) => ({
      extractos: s.extractos.map(e => e.id === id ? { ...e, estado72h: nuevoEstado } : e)
    }));

    try {
      const { actualizarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");
      await actualizarExtractoEnFirestore(periodo, id, { estado72h: nuevoEstado });
    } catch (error) {
      // Revertir en caso de error
      set((s) => ({
        extractos: s.extractos.map(e => e.id === id ? { ...e, estado72h: target.estado72h } : e)
      }));
      console.error("Error al actualizar estado 72h:", error);
    }
  },

  addEventoAgenda: (evento) => set((state) => ({
    eventosAgenda: [...state.eventosAgenda, evento]
  })),
}));
