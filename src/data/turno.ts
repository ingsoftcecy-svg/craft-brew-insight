import { parseMexicanDate, parseDateToMexico } from "@/lib/utils";

export type TipoTurno = "Turno 1" | "Turno 2" | "Turno 3";

export function obtenerTurnoPorHora(fechaInput: Date | string): TipoTurno | null {
  const fecha = parseDateToMexico(fechaInput);
  if (!fecha) return null;

  const hora = fecha.getHours();
  const minutos = fecha.getMinutes();

  const minutosTotales = hora * 60 + minutos;

  const inicioT2 = 6 * 60; // 06:00
  const inicioT3 = 15 * 60 + 30; // 15:30
  const inicioT1 = 23 * 60; // 23:00

  if (minutosTotales >= inicioT2 && minutosTotales < inicioT3) {
    return "Turno 2";
  } else if (minutosTotales >= inicioT3 && minutosTotales < inicioT1) {
    return "Turno 3";
  } else {
    // Cubre de 23:00 a 23:59 y de 00:00 a 05:59 del día siguiente
    return "Turno 1";
  }
}

export function getLimitesTurnoActual(now: Date) {
  const start = new Date(now);
  const end = new Date(now);
  start.setSeconds(0);
  start.setMilliseconds(0);
  end.setSeconds(59);
  end.setMilliseconds(999);
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;

  if (mins >= 6 * 60 && mins < 15 * 60 + 30) {
    start.setHours(6, 0);
    end.setHours(15, 29);
  } else if (mins >= 15 * 60 + 30 && mins < 23 * 60) {
    start.setHours(15, 30);
    end.setHours(22, 59);
  } else {
    if (h >= 23) {
      start.setHours(23, 0);
      end.setDate(end.getDate() + 1);
      end.setHours(5, 59);
    } else {
      start.setDate(start.getDate() - 1);
      start.setHours(23, 0);
      end.setHours(5, 59);
    }
  }
  return { start, end };
}

export function getLimitesParaTurnoString(turnoId: string, now: Date) {
  const base = new Date(now);
  if (base.getHours() < 6) {
    base.setDate(base.getDate() - 1);
  }
  base.setHours(0, 0, 0, 0);

  const start = new Date(base);
  const end = new Date(base);

  if (turnoId === "Turno 2") {
    start.setHours(6, 0, 0, 0);
    end.setHours(15, 29, 59, 999);
  } else if (turnoId === "Turno 3") {
    start.setHours(15, 30, 0, 0);
    end.setHours(22, 59, 59, 999);
  } else {
    start.setHours(23, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(5, 59, 59, 999);
  }
  return { start, end };
}
