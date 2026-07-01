import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { obtenerTurnoPorHora } from "@/data/turno";
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
      const turnoCalculado = obtenerTurnoPorHora(r[propNameFecha]);
      const match_t = turno === "all" || turnoCalculado === turno;

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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Chequeo a las {tipoChequeo}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Vista dinámica filtrada de Extractos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <Button
            variant="outline"
            className="gap-2 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium ml-auto"
            onClick={() => {
              setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              set_page(0);
            }}
          >
            {sortOrder === "desc" ? (
              <>
                <ArrowDownAZ className="h-4 w-4" /> Más recientes
              </>
            ) : (
              <>
                <ArrowUpZA className="h-4 w-4" /> Más antiguos
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
        <div className="p-0">
          <ChequeoDinamicoTable rows={rows} horaLabel={tipoChequeo} />

          <div className="mt-4 flex items-center justify-between text-sm p-4 bg-slate-50/50 border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              {filtered.length} registros · Página {page + 1} de {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => set_page((p) => p - 1)}
                className="font-semibold text-slate-600 hover:text-slate-800 shadow-sm"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages - 1}
                onClick={() => set_page((p) => p + 1)}
                className="font-semibold text-slate-600 hover:text-slate-800 shadow-sm"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
