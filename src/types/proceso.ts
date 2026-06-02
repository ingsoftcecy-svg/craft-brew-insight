export type MarcaCerveza =
  | "Corona"
  | "Corona Extra"
  | "Corona C"
  | "Corona Golden Light"
  | "Victoria"
  | "Negra Modelo"
  | "Modelo Especial"
  | "Bud Light"
  | "Bud Light Chelada"
  | "Pacifico";

export type EventType = "Turno" | "Mantenimiento" | "CIP";

export interface AgendaEvent {
  id: string;
  titulo: string;
  inicio: string; // ISO date
  fin: string;
  tipo: EventType;
  descripcion?: string;
}

export type ExtractoEstado = "En Rango" | "En Observación" | "Desviado";

export interface ExtractoRow {
  id: string;
  marca: MarcaCerveza;
  tanque: string;
  fechaLlenado: string;
  og: number;
  h24: number;
  h48: number;
  h72: number;
  estado: ExtractoEstado;
}

export interface FermentPoint {
  dia: number;
  extracto: number;
  temperatura: number;
  fase: "Fermentación" | "Diacetilo" | "Maduración";
}

export interface PurgaEntry {
  fechaHora: string | null;
  tiempo: number | null;
  realiza: string | null;
}

export interface PurgaRow {
  id: string;
  tanque: string;
  fecha: string;
  marca: MarcaCerveza;
  fechaLlenado: string;
  horas: string;
  historicas: string;
  purgas: PurgaEntry[]; // length 8
}
