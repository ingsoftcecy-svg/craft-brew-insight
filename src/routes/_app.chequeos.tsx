import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TablePageLayout } from "@/components/layout/table_page_layout";
import { TablePagination } from "@/components/ui/table_pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChequeoDinamicoTable } from "@/components/tables/chequeo_dinamico_table";
import { BRANDS } from "@/data/brands";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { obtenerTurnoPorHora, getLimitesParaTurnoString } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";
import { TableFilters } from "@/components/tables/table_filters";

export const Route = createFileRoute("/_app/chequeos")({
  head: () => ({
    meta: [
      { title: `Agenda de Control` },
      { name: "description", content: `Vista dinámica de los chequeos de Plato.` },
    ],
  }),
  component: ChequeosDinamicoPage,
});

const page_size = 50;

function ChequeosDinamicoPage() {
  const { extractos, fetchData, periodoActual, periodosDisponibles } = useOperacionesStore();
  const searchParams: any = useSearch({ strict: false });

  const tipoChequeo = searchParams.tipo || "72h"; // ej: "24h", "48h", "72h"

  const [query, set_query] = useState(searchParams.tanque || "");
  const [targetId, setTargetId] = useState(searchParams.targetId || "");
  const [marca, set_marca] = useState<string>("all");
  const [turno, set_turno] = useState<string>(
    () => obtenerTurnoPorHora(new Date().toISOString()) || "all",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, set_page] = useState(0);

  const handleSetQuery = (val: string) => {
    set_query(val);
    setTargetId("");
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const results = extractos.filter((r: any) => {
      // Nombre de la propiedad de fecha, ej: "h72"
      const propNameFecha = `h${tipoChequeo.replace("h", "")}`;

      // Solo mostrar los que tienen fecha asignada para esta hora
      if (!r[propNameFecha]) return false;

      if (targetId) {
        return r.id === targetId;
      }

      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      const isPending = r[`estado${tipoChequeo}`] !== "Completado";
      let match_t = turno === "all";
      if (!match_t) {
        const { end } = getLimitesParaTurnoString(turno, new Date());
        if (isPending) {
          const taskDate = parseMexicanDate(r[propNameFecha]);
          if (taskDate && obtenerTurnoPorHora(r[propNameFecha]) === turno && taskDate <= end) {
            match_t = true;
          }
        }
      }

      return match_q && match_m && match_t;
    });

    return results.sort((a: any, b: any) => {
      const propNameFecha = `h${tipoChequeo.replace("h", "")}`;
      const dateA = new Date(a[propNameFecha]!).getTime();
      const dateB = new Date(b[propNameFecha]!).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [extractos, query, targetId, marca, turno, sortOrder, tipoChequeo]);

  const pages = Math.max(1, Math.ceil(filtered.length / page_size));
  const rows = filtered.slice(page * page_size, (page + 1) * page_size);

  return (
    <TablePageLayout
      title={`Chequeo a las ${tipoChequeo}`}
      subtitle="Vista dinámica filtrada de Extractos"
      filters={
        <TableFilters
          query={query}
          setQuery={handleSetQuery}
          periodoActual={periodoActual}
          setPeriodo={(v) => fetchData(v)}
          periodosDisponibles={periodosDisponibles}
          marca={marca}
          setMarca={set_marca}
          turno={turno}
          setTurno={set_turno}
          resetPage={() => set_page(0)}
        />
      }
      sortOrder={sortOrder}
      onSortToggle={() => {
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        set_page(0);
      }}
      pagination={
        <TablePagination
          page={page}
          setPage={set_page}
          totalItems={filtered.length}
          itemsPerPage={page_size}
          isZeroIndexed={true}
        />
      }
    >
      <ChequeoDinamicoTable rows={rows} horaLabel={tipoChequeo} />
    </TablePageLayout>
  );
}
