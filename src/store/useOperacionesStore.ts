import { create } from "zustand";
import { ExtractoRow, PurgaRow, AgendaEvent } from "../types/proceso";
import { procesoService } from "../lib/api/procesoService";

interface OperacionesState {
  extractos: ExtractoRow[];
  purgas: PurgaRow[];
  eventosAgenda: AgendaEvent[];
  isLoading: boolean;
  error: string | null;

  fetchData: () => Promise<void>;
  addPurga: (purga: PurgaRow) => void;
  updateExtracto: (id: string, data: Partial<ExtractoRow>) => void;
  addEventoAgenda: (evento: AgendaEvent) => void;
  updatePurgaRow: (tanque: string, numero: number, fechaHora: string, tiempo: number, realiza: string) => void;
}

export const useOperacionesStore = create<OperacionesState>((set) => ({
  extractos: [],
  purgas: [],
  eventosAgenda: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [extractos, purgas, eventosAgenda] = await Promise.all([
        procesoService.getExtractos(),
        procesoService.getPurgas(),
        procesoService.getEventosAgenda(),
      ]);
      set({ extractos, purgas, eventosAgenda, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar datos", isLoading: false });
    }
  },

  addPurga: (purga) => set((state) => ({ purgas: [purga, ...state.purgas] })),
  
  updatePurgaRow: (tanque, numero, fechaHora, tiempo, realiza) => set((state) => ({
    purgas: state.purgas.map((r) => {
      if (r.tanque !== tanque) return r;
      const newPurgas = [...r.purgas];
      newPurgas[numero - 1] = { fechaHora, tiempo, realiza };
      return { ...r, purgas: newPurgas };
    })
  })),

  updateExtracto: (id, data) => set((state) => ({
    extractos: state.extractos.map((e) => e.id === id ? { ...e, ...data } : e)
  })),

  addEventoAgenda: (evento) => set((state) => ({
    eventosAgenda: [...state.eventosAgenda, evento]
  })),
}));
