import { AgendaEvent, ExtractoRow, PurgaRow } from "../../types/proceso";
import { agendaInitial } from "../../data/agenda";
import { extractoData } from "../../data/extracto";
import { purgasInitial } from "../../data/purgas";

// Mocking some latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const procesoService = {
  getExtractos: async (): Promise<ExtractoRow[]> => {
    await delay(300);
    return [...extractoData];
  },

  getPurgas: async (): Promise<PurgaRow[]> => {
    await delay(300);
    return [...purgasInitial];
  },

  getEventosAgenda: async (): Promise<AgendaEvent[]> => {
    await delay(300);
    return [...agendaInitial];
  },

  createPurga: async (purga: PurgaRow): Promise<PurgaRow> => {
    await delay(300);
    // In a real app this would call an API
    return { ...purga };
  },

  updateExtracto: async (id: string, partial: Partial<ExtractoRow>): Promise<ExtractoRow> => {
    await delay(300);
    // In a real app this would call an API
    const existing = extractoData.find((e) => e.id === id);
    if (!existing) throw new Error("Extracto no encontrado");
    return { ...existing, ...partial };
  },
};
