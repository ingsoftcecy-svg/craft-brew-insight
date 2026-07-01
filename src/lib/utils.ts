import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseMexicanDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;

  const str = String(dateString).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);

  if (match) {
    let part1 = parseInt(match[1], 10);
    let part2 = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    let hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;

    if (str.toLowerCase().includes("pm") && hour < 12) hour += 12;
    if (str.toLowerCase().includes("am") && hour === 12) hour = 0;

    let day = part1;
    let month = part2 - 1;
    if (part2 > 12) {
      day = part2;
      month = part1 - 1;
    }
    const parsed = new Date(year, month, day, hour, minute);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ── Timezone helpers para México (UTC-6) ──────────────────────────────
const MEXICO_OFFSET_HOURS = -6;
const MEXICO_OFFSET_MS = MEXICO_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Convierte un Date a un ISO string con el offset explícito de México (-06:00).
 * Esto preserva la hora local de México sin importar en qué timezone corra el código.
 *
 * Ejemplo: si `date` representa las 9:30 AM México →
 *   Retorna "2026-06-18T09:30:00.000-06:00"  (NO "2026-06-18T15:30:00.000Z")
 */
export function toMexicoISOString(date: Date): string {
  // Calcular la hora en México a partir del timestamp UTC
  const utcMs = date.getTime();
  const mexicoMs = utcMs + MEXICO_OFFSET_MS;
  const mx = new Date(mexicoMs);

  const Y = mx.getUTCFullYear();
  const M = String(mx.getUTCMonth() + 1).padStart(2, "0");
  const D = String(mx.getUTCDate()).padStart(2, "0");
  const h = String(mx.getUTCHours()).padStart(2, "0");
  const m = String(mx.getUTCMinutes()).padStart(2, "0");
  const s = String(mx.getUTCSeconds()).padStart(2, "0");
  const ms = String(mx.getUTCMilliseconds()).padStart(3, "0");

  return `${Y}-${M}-${D}T${h}:${m}:${s}.${ms}-06:00`;
}

/**
 * Parsea un ISO string (con Z, con offset, o sin offset) y devuelve un Date
 * cuya representación LOCAL corresponde a la hora de México.
 *
 * Uso principal: para mostrar horas. Llamas `parseDateToMexico(isoStr)` y luego
 * usas `getHours()`, `format(d, "HH:mm")`, etc. y obtienes la hora de México.
 */
export function parseDateToMexico(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    // Si ya es Date, extraer las componentes de México
    const utcMs = dateString.getTime();
    const mexicoMs = utcMs + MEXICO_OFFSET_MS;
    const mx = new Date(mexicoMs);
    return new Date(
      mx.getUTCFullYear(),
      mx.getUTCMonth(),
      mx.getUTCDate(),
      mx.getUTCHours(),
      mx.getUTCMinutes(),
      mx.getUTCSeconds(),
      mx.getUTCMilliseconds(),
    );
  }

  const str = String(dateString).trim();
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;

  // Convertir el instante UTC a componentes de hora México
  const utcMs = d.getTime();
  const mexicoMs = utcMs + MEXICO_OFFSET_MS;
  const mx = new Date(mexicoMs);

  // Devolver un Date local con las componentes de hora de México
  return new Date(
    mx.getUTCFullYear(),
    mx.getUTCMonth(),
    mx.getUTCDate(),
    mx.getUTCHours(),
    mx.getUTCMinutes(),
    mx.getUTCSeconds(),
    mx.getUTCMilliseconds(),
  );
}
