import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpZA } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PurgasTable } from "@/components/tables/purgas_table";
import { TablePageLayout } from "@/components/layout/table_page_layout";
import { useOperacionesStore } from "@/store/useOperacionesStore";

import { obtenerTurnoPorHora, getLimitesParaTurnoString } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";
import { TableFilters } from "@/components/tables/table_filters";
import { useAuthStore } from "@/store/useAuthStore";
import { ConfiguracionPurgasModal } from "@/components/modals/ConfiguracionPurgasModal";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Agenda de Control" },
      { name: "description", content: "Registro y Control de Purgas." },
    ],
  }),
  component: PurgasPage,
});

import { useEffect } from "react";

function PurgasPage() {
  const { purgas, fetchData, periodoActual, periodosDisponibles } = useOperacionesStore();
  const searchParams: any = useSearch({ strict: false });
  const [query, set_query] = useState(searchParams.tanque || "");
  const [targetId, setTargetId] = useState(searchParams.targetId || "");
  const [marca, set_marca] = useState<string>("all");
  const [turno, set_turno] = useState<string>(
    () => obtenerTurnoPorHora(new Date().toISOString()) || "all",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showConfig, setShowConfig] = useState(false);
  const isSuperUser = useAuthStore((s) => s.isSuperUser);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const results = purgas.filter((r) => {
      if (targetId) {
        return r.id === targetId;
      }
      const match_q = !query || r.tanque.toLowerCase().includes(query.toLowerCase());
      const match_m = marca === "all" || r.marca === marca;
      let match_t = turno === "all";
      if (!match_t) {
        const { end } = getLimitesParaTurnoString(turno, new Date());
        match_t = r.purgas.some((p) => {
          if (!p.fechaHora) return false;
          const isPending = !p.tiempo || !p.realiza;
          if (!isPending) return false;
          const taskDate = parseMexicanDate(p.fechaHora);
          if (!taskDate) return false;
          return obtenerTurnoPorHora(p.fechaHora) === turno && taskDate <= end;
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
  }, [purgas, query, targetId, marca, turno, sortOrder]);

  return (
    <TablePageLayout
      title="Control de Purgas de Trub en Frío"
      subtitle="Purga Inicial + 8 purgas cada 8 Hr hasta las 64 Hr"
      filters={
        <TableFilters
          query={query}
          setQuery={set_query}
          periodoActual={periodoActual}
          setPeriodo={(v) => fetchData(v)}
          periodosDisponibles={periodosDisponibles}
          marca={marca}
          setMarca={set_marca}
          turno={turno}
          setTurno={set_turno}
        />
      }
      sortOrder={sortOrder}
      onSortToggle={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
    >
      <div className="mb-4 flex justify-end print:hidden">
        {isSuperUser && (
          <Button
            onClick={() => setShowConfig(true)}
            variant="outline"
            className="gap-2 border-border text-foreground hover:bg-muted hover:border-muted-foreground rounded-lg h-9 px-4 text-sm font-medium transition-all"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            Configurar Purgas
          </Button>
        )}
      </div>
      <PurgasTable rows={filtered} />
      {showConfig && <ConfiguracionPurgasModal onClose={() => setShowConfig(false)} />}
    </TablePageLayout>
  );
}
