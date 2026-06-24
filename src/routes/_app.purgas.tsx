import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PurgasTable } from "@/components/tables/purgas_table";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { BRANDS } from "@/data/brands";
import { obtenerTurnoPorHora } from "@/data/turno";
import { parseMexicanDate } from "@/lib/utils";
import { TableFilters } from "@/components/tables/table_filters";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Purgas de Trub" },
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
  const [turno, set_turno] = useState<string>(() => obtenerTurnoPorHora(new Date().toISOString()) || "all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const handleSetQuery = (val: string) => {
    set_query(val);
    setTargetId("");
  };

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
      const turnoCalculado = obtenerTurnoPorHora(r.fechaLlenado);
      const match_t = turno === "all" || turnoCalculado === turno;
      
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Purga Inicial + 8 purgas cada 8 Hr hasta las 64 Hr</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TableFilters 
            query={query} setQuery={set_query}
            periodoActual={periodoActual} setPeriodo={(v) => fetchData(v)} periodosDisponibles={periodosDisponibles}
            marca={marca} setMarca={set_marca}
            turno={turno} setTurno={set_turno}
          />
          <Button 
            variant="outline" 
            className="gap-2 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium ml-auto"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? (
              <><ArrowDownAZ className="h-4 w-4" /> Más recientes</>
            ) : (
              <><ArrowUpZA className="h-4 w-4" /> Más antiguos</>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
        <div className="p-0">
          <div className="pt-0">
            <PurgasTable rows={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
}
