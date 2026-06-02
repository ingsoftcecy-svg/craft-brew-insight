import { BRANDS, TANKS } from "./brands";
import { PurgaEntry, PurgaRow } from "../types/proceso";

const realizadores = ["VHN", "LAND", "PERG", "MJA"];

function r(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const purgasInitial: PurgaRow[] = Array.from({ length: 45 }, (_, i) => {
  const totalPurgas = 4 + Math.floor(r(i + 1) * 5); // 4 to 8 purgas
  const purgas: PurgaEntry[] = Array.from({ length: 8 }, (_, j) => {
    if (j >= totalPurgas) return { fechaHora: null, tiempo: null, realiza: null };
    const hour = 6 + j * 2;
    const realizaIdx = Math.floor(r(i * 13 + j) * realizadores.length);
    return {
      fechaHora: `24/05/2026 ${String(hour).padStart(2, "0")}:${j % 2 === 0 ? "00" : "45"}`,
      tiempo: 1 + Math.floor(r(i + j) * 4), // 1 to 4 minutes
      realiza: realizadores[realizaIdx],
    };
  });
  return {
    id: `purga-${i}`,
    tanque: TANKS[i],
    fecha: `20/05/2026`,
    marca: BRANDS[i % BRANDS.length],
    fechaLlenado: `24/05/2026 11:45`,
    horas: `2389 33:28`,
    historicas: `Historica`,
    purgas,
  };
});