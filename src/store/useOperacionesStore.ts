import { create } from "zustand";
import { ExtractoRow, PurgaRow, AgendaEvent, PurgaEntry, PurgasConfig } from "../types/proceso";

import { addHours } from "date-fns";
import { obtenerTurnoPorHora } from "@/data/turno";

interface OperacionesState {
  periodoActual: string;
  periodosDisponibles: string[];
  periodosStats: { periodo: string; totalRegistros: number }[];
  extractos: ExtractoRow[];
  purgas: PurgaRow[];
  purgasConfig: PurgasConfig;
  eventosAgenda: AgendaEvent[];
  isLoading: boolean;
  error: string | null;

  fetchData: (periodoSeleccionado?: string) => Promise<void>;
  addPurga: (purga: PurgaRow) => void;
  updateExtracto: (id: string, data: Partial<ExtractoRow>) => void;
  toggleEstadoChequeo: (id: string, label: string, forceToggle?: boolean) => Promise<void>;
  addEventoAgenda: (evento: AgendaEvent) => void;
  updatePurgaRow: (
    tanque: string,
    numeroPurga: number,
    fechaHora: string,
    tiempo: number,
    realiza: string,
  ) => void;
  deletePurga: (id: string) => Promise<void>;
  deleteExtracto: (id: string) => Promise<void>;
  updatePurgaField: (
    id: string,
    numeroPurga: number,
    campo: "tiempo" | "realiza",
    valor: string | number,
  ) => Promise<void>;
  cargarPurgasDesdeArchivo: (filas: any[]) => void;
  cargarExtractosDesdeArchivo: (filas: any[]) => void;
  completarPurga: (
    id: string,
    numeroPurga: number,
    tiempo: number,
    realiza: string,
  ) => Promise<void>;
  addCustomChequeo: (hora: number, extractoId?: string) => Promise<void>;
  removeCustomChequeo: (hora: number, extractoId?: string) => Promise<void>;
  
  loadPurgasConfig: () => Promise<void>;
  updatePurgasConfig: (config: PurgasConfig) => Promise<void>;
  aplicarConfiguracionActivos: (config: PurgasConfig) => Promise<void>;
}

const getCurrentPeriod = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export const useOperacionesStore = create<OperacionesState>((set) => ({
  periodoActual: getCurrentPeriod(),
  periodosDisponibles: [],
  periodosStats: [],
  extractos: [],
  purgas: [],
  purgasConfig: {} as PurgasConfig,
  eventosAgenda: [],
  isLoading: true,
  error: null,

  fetchData: async (periodoSeleccionado?: string) => {
    set({ isLoading: true, error: null });
    try {
      // First try loading purgas config
      await useOperacionesStore.getState().loadPurgasConfig();
      // Importamos las funciones dinámicamente para evitar dependencias circulares si las hubiera
      const { obtenerExtractosPorPeriodo, listarPeriodosExtractos, obtenerTodosLosExtractos } =
        await import("@/lib/api/extractosFirebaseService");
      const { obtenerEventosAgenda } = await import("@/lib/api/agendaFirebaseService");
      const { obtenerPurgasPorPeriodo, obtenerTodasLasPurgas } =
        await import("@/lib/api/purgasFirebaseService");

      const periodosResumen = await listarPeriodosExtractos().catch(() => []);
      const periodos = periodosResumen.map((p) => p.periodo);
      const periodosStats = periodosResumen.map((p) => ({
        periodo: p.periodo,
        totalRegistros: p.totalRegistros,
      }));

      // Si no se especifica periodo, cargamos el periodoActual (si es válido), o el más reciente, o fallback a "2026-06"
      const targetPeriodo =
        periodoSeleccionado ||
        (periodos.includes(useOperacionesStore.getState().periodoActual)
          ? useOperacionesStore.getState().periodoActual
          : null) ||
        (periodos.length > 0 ? periodos[0] : getCurrentPeriod());

      const extractosPromise =
        targetPeriodo === "todos"
          ? obtenerTodosLosExtractos()
          : obtenerExtractosPorPeriodo(targetPeriodo);

      const purgasPromise =
        targetPeriodo === "todos"
          ? obtenerTodasLasPurgas()
          : obtenerPurgasPorPeriodo(targetPeriodo);

      const [extractosFb, purgasFb, eventosAgendaFb] = await Promise.all([
        extractosPromise.catch((err) => {
          console.error("Error cargando extractos:", err);
          return [];
        }),
        purgasPromise.catch((err) => {
          console.error("Error cargando purgas:", err);
          return [];
        }),
        obtenerEventosAgenda().catch((err) => {
          console.error("Error cargando agenda:", err);
          return [];
        }),
      ]);

      const fixMarca = (marca: string) => {
        if (!marca) return marca;
        // Solo corregir si es exactamente "pacifico", "pacífico", "pacfico", o con caracteres corruptos (ej. "Pacfico")
        // No debe afectar a "Pacifico Light" ni "Pacifico Suave" ni "Pacifico E"
        if (/^pac.?fico$/i.test(marca.trim())) {
          return "Pacifico";
        }
        return marca;
      };

      const extractos = extractosFb.map((e) => {
        const ret = { ...e, marca: fixMarca(e.marca) as any };
        
        if (ret.fechaLlenado) {
          const d = new Date(ret.fechaLlenado);
          if (!isNaN(d.getTime())) {
            const esViejo = d.getTime() < new Date("2026-07-01T00:00:00").getTime();
            const horasBase = [24, 48, 72, 96, 120, 128, 136, 144];
            
            horasBase.forEach((h) => {
              const hKey = `h${h}`;
              const estadoKey = `estado${h}h`;
              
              if (!ret[hKey]) {
                ret[hKey] = new Date(d.getTime() + h * 60 * 60 * 1000).toISOString();
                if (!ret[estadoKey]) {
                  ret[estadoKey] = (esViejo || ret.estado144h === "Completado") ? "Completado" : "Pendiente";
                }
              }
            });
          }
        }
        return ret;
      });
      const purgas = purgasFb.map((p) => ({ ...p, marca: fixMarca(p.marca) as any }));
      const eventosAgenda = eventosAgendaFb;

      set({
        extractos,
        purgas,
        eventosAgenda,
        periodoActual:
          targetPeriodo === "todos"
            ? periodos.length > 0
              ? periodos[0]
              : "2026-06"
            : targetPeriodo,
        periodosDisponibles: periodos,
        periodosStats,
        isLoading: false,
      });
    } catch (_) {
      set({ error: "Error al cargar datos", isLoading: false });
    }
  },

  addPurga: (purga) => set((state) => ({ purgas: [purga, ...state.purgas] })),

  updatePurgaRow: (tanque, numeroPurga, fechaHora, tiempo, realiza) =>
    set((state) => ({
      purgas: state.purgas.map((r) => {
        if (r.tanque !== tanque) return r;

        const newPurgas = [...r.purgas];
        newPurgas[numeroPurga - 1] = {
          fechaHora: fechaHora || null,
          tiempo: tiempo || null,
          realiza: realiza || null,
        };

        return { ...r, purgas: newPurgas };
      }),
    })),

  updatePurgaField: async (id, numeroPurga, campo, valor) => {
    // 1. Optimistic update
    let updatedRow: PurgaRow | undefined;
    set((state) => ({
      purgas: state.purgas.map((r) => {
        if (r.id !== id) return r;
        const newPurgas = [...r.purgas];
        if (!newPurgas[numeroPurga - 1])
          newPurgas[numeroPurga - 1] = { fechaHora: null, tiempo: null, realiza: null };
        if (campo === "tiempo") {
          newPurgas[numeroPurga - 1].tiempo = valor === "" ? null : Number(valor);
        } else {
          newPurgas[numeroPurga - 1].realiza = valor === "" ? null : String(valor);
        }
        updatedRow = { ...r, purgas: newPurgas };
        return updatedRow;
      }),
    }));

    // 2. Persist to Firebase
    if (updatedRow) {
      try {
        const { actualizarPurgaEnFirestore } = await import("@/lib/api/purgasFirebaseService");
        const periodo = useOperacionesStore.getState().periodoActual;
        await actualizarPurgaEnFirestore(periodo, id, { purgas: updatedRow.purgas });
      } catch (error) {
        console.error("Error al actualizar purga:", error);
      }
    }
  },

  completarPurga: async (id, numeroPurga, tiempo, realiza) => {
    let updatedRow: PurgaRow | undefined;
    set((state) => ({
      purgas: state.purgas.map((r) => {
        if (r.id !== id) return r;
        const newPurgas = [...r.purgas];
        if (!newPurgas[numeroPurga - 1])
          newPurgas[numeroPurga - 1] = { fechaHora: null, tiempo: null, realiza: null };

        newPurgas[numeroPurga - 1].tiempo = tiempo;
        newPurgas[numeroPurga - 1].realiza = realiza;

        updatedRow = { ...r, purgas: newPurgas };
        return updatedRow;
      }),
    }));

    if (updatedRow) {
      try {
        const { actualizarPurgaEnFirestore } = await import("@/lib/api/purgasFirebaseService");
        const periodo = useOperacionesStore.getState().periodoActual;
        await actualizarPurgaEnFirestore(periodo, id, { purgas: updatedRow.purgas });
      } catch (error) {
        console.error("Error al completar purga:", error);
      }
    }
  },

  cargarPurgasDesdeArchivo: (filas) =>
    set((state) => {
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
          id: `pr-${tanque}-${new Date(fila.fechaLlenado || fila.fecha || "").getTime() || Date.now()}`,
          tanque,
          fecha: fila.fecha || fila.fechaLlenado || "",
          marca,
          fechaInicioLlenado: fila.fechaInicioLlenado || "",
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

  cargarExtractosDesdeArchivo: (filas) =>
    set((state) => {
      const nuevosEventosAgenda: AgendaEvent[] = [];

      const extractosMapeados: ExtractoRow[] = filas.map((fila: any, index: number) => {
        const tanque = fila.tanque || String(fila.FERMENTADOR || "");
        const marca = fila.marca || String(fila.MARCA || "");

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
          guardarEventosEnFirestore(nuevosEventosAgenda).catch((err) => {
            console.error("Error guardando eventos de agenda:", err);
          });
        });
      }

      return {
        extractos: extractosMapeados,
        eventosAgenda: [...state.eventosAgenda, ...nuevosEventosAgenda],
      };
    }),

  updateExtracto: (id, data) =>
    set((state) => ({
      extractos: state.extractos.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),

  deletePurga: async (id) => {
    const estado = useOperacionesStore.getState();
    const periodo = estado.periodoActual;

    // Optimistic update
    set((state) => ({
      purgas: state.purgas.filter((p) => p.id !== id),
    }));

    try {
      const { eliminarPurgaEnFirestore } = await import("@/lib/api/purgasFirebaseService");
      await eliminarPurgaEnFirestore(periodo, id);
    } catch (err) {
      console.error("Error al eliminar purga:", err);
      estado.fetchData(periodo); // Revert on failure
    }
  },

  deleteExtracto: async (id) => {
    const estado = useOperacionesStore.getState();
    const periodo = estado.periodoActual;

    // Optimistic update
    set((state) => ({
      extractos: state.extractos.filter((e) => e.id !== id),
    }));

    try {
      const { eliminarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");
      await eliminarExtractoEnFirestore(periodo, id);
    } catch (err) {
      console.error("Error al eliminar extracto:", err);
      estado.fetchData(periodo); // Revert on failure
    }
  },

  toggleEstadoChequeo: async (id: string, label: string, forceToggle: boolean = false) => {
    const state = useOperacionesStore.getState();
    const target = state.extractos.find((e) => e.id === id);
    if (!target) return;

    const propName = `estado${label}` as keyof typeof target;
    const currentState = target[propName];

    // Si ya está completado y no tenemos forceToggle (superuser), no permitir regresarlo a pendiente
    if (currentState === "Completado" && !forceToggle) return;

    const nuevoEstado = currentState === "Completado" ? "Pendiente" : "Completado";
    const periodo = state.periodoActual;

    set((s) => ({
      extractos: s.extractos.map((e) => (e.id === id ? { ...e, [propName]: nuevoEstado } : e)),
    }));

    try {
      const { actualizarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");
      await actualizarExtractoEnFirestore(periodo, id, { [propName]: nuevoEstado });
    } catch (error) {
      set((s) => ({
        extractos: s.extractos.map((e) =>
          e.id === id ? { ...e, [propName]: target[propName] } : e,
        ),
      }));
      console.error(`Error al actualizar estado ${label}:`, error);
    }
  },

  toggleEstado24h: async (id: string) => {
    const state = useOperacionesStore.getState();
    const target = state.extractos.find((e) => e.id === id);
    if (!target) return;

    const nuevoEstado = target.estado24h === "Completado" ? "Pendiente" : "Completado";
    const periodo = state.periodoActual;

    // Optimistic UI update
    set((s) => ({
      extractos: s.extractos.map((e) => (e.id === id ? { ...e, estado24h: nuevoEstado } : e)),
    }));

    try {
      const { actualizarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");
      await actualizarExtractoEnFirestore(periodo, id, { estado24h: nuevoEstado });
    } catch (error) {
      // Revertir en caso de error
      set((s) => ({
        extractos: s.extractos.map((e) =>
          e.id === id ? { ...e, estado24h: target.estado24h } : e,
        ),
      }));
      console.error("Error al actualizar estado 24h:", error);
    }
  },

  addEventoAgenda: (evento) =>
    set((state) => ({
      eventosAgenda: [...state.eventosAgenda, evento],
    })),

  addCustomChequeo: async (hora: number, extractoId?: string) => {
    const state = useOperacionesStore.getState();
    const periodo = state.periodoActual;
    const { actualizarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");

    let updatedIds: string[] = [];
    
    set((s) => {
      const newExtractos = s.extractos.map((e) => {
        if (extractoId && e.id !== extractoId) return e;
        
        updatedIds.push(e.id);
        const fechaBase = e.fechaLlenado ? new Date(e.fechaLlenado) : null;
        if (!fechaBase || isNaN(fechaBase.getTime())) return e;

        const newFecha = new Date(fechaBase.getTime() + hora * 60 * 60 * 1000).toISOString();
        return {
          ...e,
          [`h${hora}`]: newFecha,
          [`estado${hora}h`]: "Pendiente"
        };
      });
      return { extractos: newExtractos };
    });

    // Save all modified to Firebase
    const updatedState = useOperacionesStore.getState();
    for (const id of updatedIds) {
      const e = updatedState.extractos.find(x => x.id === id);
      if (e) {
        try {
          await actualizarExtractoEnFirestore(periodo, id, {
            [`h${hora}`]: e[`h${hora}`],
            [`estado${hora}h`]: e[`estado${hora}h`]
          });
        } catch (error) {
          console.error(`Error guardando chequeo ${hora}h para ${id}:`, error);
        }
      }
    }
  },

  removeCustomChequeo: async (hora: number, extractoId?: string) => {
    const state = useOperacionesStore.getState();
    const periodo = state.periodoActual;
    const { actualizarExtractoEnFirestore } = await import("@/lib/api/extractosFirebaseService");

    let updatedIds: string[] = [];
    
    set((s) => {
      const newExtractos = s.extractos.map((e) => {
        if (extractoId && e.id !== extractoId) return e;
        
        updatedIds.push(e.id);
        const copy = { ...e };
        // Delete properties locally to prevent rendering
        delete copy[`h${hora}`];
        delete copy[`estado${hora}h`];
        return copy;
      });
      return { extractos: newExtractos };
    });

    // Save all modified to Firebase
    for (const id of updatedIds) {
      try {
        // Enviar null o string vacio dependiendo de como esté implementado
        // Firebase `update` with FieldValue.delete() is ideal, but here we can send null
        // so the frontend ignores it.
        const updatePayload: Record<string, any> = {};
        const { deleteField } = await import("firebase/firestore");
        updatePayload[`h${hora}`] = deleteField();
        updatePayload[`estado${hora}h`] = deleteField();
        
        await actualizarExtractoEnFirestore(periodo, id, updatePayload);
      } catch (error) {
        console.error(`Error eliminando chequeo ${hora}h para ${id}:`, error);
      }
    }
  },

  loadPurgasConfig: async () => {
    try {
      const { getPurgasConfig } = await import("@/lib/api/purgasFirebaseService");
      const config = await getPurgasConfig();
      set({ purgasConfig: config });
    } catch (err) {
      console.error("Error loading purgas config:", err);
    }
  },

  updatePurgasConfig: async (config: PurgasConfig) => {
    try {
      const { savePurgasConfig } = await import("@/lib/api/purgasFirebaseService");
      await savePurgasConfig(config);
      set({ purgasConfig: config });
    } catch (err) {
      console.error("Error saving purgas config:", err);
      throw err;
    }
  },

  aplicarConfiguracionActivos: async (config: PurgasConfig) => {
    try {
      const state = useOperacionesStore.getState();
      const periodo = state.periodoActual;
      const { firestore } = await import("@/lib/firebase");
      const { doc, writeBatch } = await import("firebase/firestore");

      let batchEscritura = writeBatch(firestore);
      let updates = 0;
      let batchesCommitted = 0;

      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const normalizedConfig = Object.entries(config).reduce((acc, [k, v]) => {
        acc[normalize(k)] = v;
        return acc;
      }, {} as Record<string, { cantidad: number; cadaHrs: number }>);

      const newPurgas = state.purgas.map((row) => {
        const marcaConfig = normalizedConfig[normalize(row.marca)];
        if (!marcaConfig) return row; // No config, no change

        // Only apply if the tank has pending purgas (or is completely new). 
        // We consider active if at least one purga is pending.
        const isCompleted = row.purgas.slice(1).every((p) => p.tiempo && p.realiza);
        if (isCompleted && row.purgas.length > 1) return row; 

        // Let's rebuild the purgas array.
        // Keep the ones that already exist, recalculate dates based on new `cadaHrs`
        // and adjust length to `cantidad` + 1 (initial)
        const fechaInicio = row.purgas[0]?.fechaHora ? new Date(row.purgas[0].fechaHora) : (row.fechaInicioLlenado ? new Date(row.fechaInicioLlenado) : null);
        if (!fechaInicio) return row;
        
        const fechaBase = row.fechaLlenado ? new Date(row.fechaLlenado) : fechaInicio;

        const maxPurgas = marcaConfig.cantidad || 8;
        const cadaHrs = marcaConfig.cadaHrs || 8;

        const newPurgasArray = [];
        
        // Push initial purga
        newPurgasArray.push(row.purgas[0]);

        for (let i = 1; i <= maxPurgas; i++) {
          const expectedDate = new Date(fechaBase.getTime() + i * cadaHrs * 3600000).toISOString();
          if (row.purgas[i]) {
            // keep existing times/realiza but update date
            newPurgasArray.push({
              ...row.purgas[i],
              fechaHora: expectedDate,
            });
          } else {
            // create new
            newPurgasArray.push({
              fechaHora: expectedDate,
              tiempo: null,
              realiza: null,
            });
          }
        }

        const newRow = { ...row, purgas: newPurgasArray };

        // Schedule for firebase update
        const docRef = doc(firestore, "purgas_historico", periodo, "registros", row.id);
        batchEscritura.update(docRef, { purgas: newPurgasArray });
        updates++;

        if (updates >= 500) {
          batchEscritura.commit();
          batchEscritura = writeBatch(firestore);
          updates = 0;
          batchesCommitted++;
        }

        return newRow;
      });

      if (updates > 0) {
        await batchEscritura.commit();
      }

      set({ purgas: newPurgas });
      
      // Need to re-fetch to rebuild agenda correctly or we can just rely on the store state changing.
      // The agenda derives from purgas list indirectly through extractos. Wait!
      // In this app, Agenda derives purgas from extractos, wait, Agenda uses extractos!
      // I should trigger fetchData.
      await state.fetchData(periodo);

    } catch (err) {
      console.error("Error al aplicar config a activos:", err);
      throw err;
    }
  },
}));
