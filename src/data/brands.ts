import { MarcaCerveza } from "../types/proceso";

export const BRANDS: MarcaCerveza[] = [
  "Corona",
  "Corona Extra",
  "Corona C",
  "Corona E",
  "Corona Light Shine",
  "Corona Golden Light",
  "Victoria",
  "Negra Modelo",
  "Modelo Especial",
  "Modelo Pura Malta",
  "Modelo E",
  "Michelob Ultra",
  "Bud Light",
  "Bud Light Chelada",
  "Pacifico",
  "Pacifico Suave",
  "Barrilito",
  "Flying Fish",
  "Estrella E"
];

export const TANKS = Array.from({ length: 45 }, (_, i) => `TK-${101 + i}`);