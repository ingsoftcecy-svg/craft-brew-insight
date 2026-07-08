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
import { ExtractoTable } from "@/components/tables/extracto_table";
import { UploadExtractos } from "@/components/forms/subir_archivos_extracto";
import { BRANDS } from "@/data/brands";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { obtenerTurnoPorHora, getLimitesParaTurnoString } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";
import { TableFilters } from "@/components/tables/table_filters";

export const Route = createFileRoute("/_app/extracto")({
  head: () => ({
    meta: [
      { title: "Agenda de Control" },
      { name: "description", content: "Monitoreo de atenuación del mosto hasta 144 horas." },
    ],
  }),
  component: ExtractoPage,
});

const page_size = 50;

function ExtractoPage() {
  const { extractos, fetchData, periodoActual, periodosDisponibles } = useOperacionesStore();
  const searchParams: any = useSearch({ strict: false });
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
    const results = extractos.filter((r) => {
      if (targetId) {
        return r.id === targetId;
      }
      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      let match_t = turno === "all";
      if (!match_t) {
        const { end } = getLimitesParaTurnoString(turno, new Date());
        const chequeos = [
          { time: r.h24, state: r.estado24h },
          { time: r.h48, state: r.estado48h },
          { time: r.h72, state: r.estado72h },
          { time: r.h96, state: r.estado96h },
          { time: r.h120, state: r.estado120h },
          { time: r.h128, state: r.estado128h },
          { time: r.h136, state: r.estado136h },
          { time: r.h144, state: r.estado144h },
        ];
        match_t = chequeos.some((c) => {
          if (!c.time || c.state === "Completado") return false;
          const taskDate = parseMexicanDate(c.time);
          if (!taskDate) return false;
          // Pertenece a las horas del turno seleccionado, Y no es de un día en el futuro
          return obtenerTurnoPorHora(c.time) === turno && taskDate <= end;
        });
      }
      return match_q && match_m && match_t;
    });

    return results.sort((a, b) => {
      const parsedA = parseMexicanDate(a.fechaLlenado);
      const parsedB = parseMexicanDate(b.fechaLlenado);
      const dateA = parsedA ? parsedA.getTime() : 0;
      const dateB = parsedB ? parsedB.getTime() : 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [extractos, query, targetId, marca, turno, sortOrder]);

  const pages = Math.max(1, Math.ceil(filtered.length / page_size));
  const rows = filtered.slice(page * page_size, (page + 1) * page_size);

  return (
    <TablePageLayout
      title="Extracto 144 Hrs"
      subtitle="Purgas desde 24 Hrs hasta 144 Hrs"
      headerAction={<UploadExtractos />}
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
      <ExtractoTable rows={rows} />
    </TablePageLayout>
  );
}
