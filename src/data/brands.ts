import { MarcaCerveza } from "../types/proceso";

export const BRANDS: MarcaCerveza[] = [
  "Corona",
  "Corona Extra",
  "Corona C",
  "Corona Golden Light",
  "Victoria",
  "Negra Modelo",
  "Modelo Especial",
  "Bud Light",
  "Bud Light Chelada",
  "Pacifico",
];

export const TANKS = Array.from({ length: 45 }, (_, i) => `TK-${101 + i}`);