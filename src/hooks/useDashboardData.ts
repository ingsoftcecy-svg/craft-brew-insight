import { useEffect, useMemo, useState } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { obtenerTurnoPorHora, getLimitesTurnoActual } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";

export interface ChequeoItem {
  id: string;
  realId: string;
  tanque: string;
  marca: string;
  date: Date;
  [key: string]: any;
}

export interface PurgaItem {
  id: string;
  realId: string;
  purgaId: string;
  tanque: string;
  marca: string;
  date: Date;
}

export interface ChequeoGrupo {
  key: string;
  label: string;
  color: "sky" | "indigo";
  items: ChequeoItem[];
}

export interface PurgaGrupo {
  tituloPurga: string;
  items: PurgaItem[];
  index: number;
}

export function useDashboardData() {
  const { extractos, purgas, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => {
    fetchData("todos");
  }, [fetchData]);

  const [ahora] = useState(() => new Date());

  const turnoActual = useMemo(() => obtenerTurnoPorHora(ahora.toISOString()), [ahora]);
  const { start: inicioTurno, end: finTurno } = useMemo(
    () => getLimitesTurnoActual(ahora),
    [ahora],
  );

  const horasChequeo = useMemo(
    () => [
      { key: "h24", label: "24h", color: "sky" as const },
      { key: "h48", label: "48h", color: "sky" as const },
      { key: "h72", label: "72h", color: "indigo" as const },
      { key: "h96", label: "96h", color: "indigo" as const },
      { key: "h120", label: "120h", color: "sky" as const },
      { key: "h128", label: "128h", color: "indigo" as const },
      { key: "h136", label: "136h", color: "sky" as const },
      { key: "h144", label: "144h", color: "indigo" as const },
    ],
    [],
  );

  const chequeosDelTurno: ChequeoGrupo[] = useMemo(() => {
    return horasChequeo.map(({ key, label, color }) => {
      const items = extractos
        .filter((e: any) => e[key] && e[`estado${label}`] !== "Completado")
        .map((e: any) => ({
          ...e,
          date: parseMexicanDate(e[key]) as Date,
          realId: e.id,
          tipo: label,
        }))
        .filter((e) => e.date && e.date >= inicioTurno && e.date <= finTurno)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 6);
      return { key, label, color, items };
    });
  }, [extractos, horasChequeo, inicioTurno, finTurno]);

  const fermentando = useMemo(() => {
    const limiteViejo = new Date();
    limiteViejo.setDate(limiteViejo.getDate() - 7);

    const tanquesOcupados = new Set(
      extractos
        .filter((e) => {
          if (e.estado144h === "Completado") return false;
          const h144Date = parseMexicanDate(e.h144);
          if (!h144Date) return false;
          return h144Date >= limiteViejo;
        })
        .map((e) => e.tanque),
    );
    return tanquesOcupados.size;
  }, [extractos]);

  const totalChequeosPendientes = useMemo(() => {
    return chequeosDelTurno.reduce((acc, c) => acc + c.items.length, 0);
  }, [chequeosDelTurno]);

  const purgasDelTurno: PurgaGrupo[] = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const tituloPurga = i === 0 ? "Purga Inicial" : `Purga ${i}`;
      const items = purgas
        .filter((p) => {
          const entry = p.purgas?.[i];
          if (!entry?.fechaHora) return false;
          if (entry.tiempo && entry.realiza) return false;
          return true;
        })
        .map((p) => {
          const entry = p.purgas[i];
          const date = parseMexicanDate(entry.fechaHora!);
          return {
            id: `${p.id}-p${i}`,
            realId: p.id,
            tanque: p.tanque,
            marca: p.marca,
            date: date as Date,
            purgaId: p.id,
            tipo: tituloPurga,
          };
        })
        .filter((item) => item.date && item.date >= inicioTurno && item.date <= finTurno)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 8);
      return { tituloPurga, items, index: i };
    });
  }, [purgas, inicioTurno, finTurno]);

  const totalPurgasPendientes = useMemo(() => {
    return purgasDelTurno.reduce((acc, p) => acc + p.items.length, 0);
  }, [purgasDelTurno]);

  return {
    isLoading,
    ahora,
    turnoActual,
    fermentando,
    chequeosDelTurno,
    totalChequeosPendientes,
    purgasDelTurno,
    totalPurgasPendientes,
  };
}
