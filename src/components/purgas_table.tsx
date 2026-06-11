import { Fragment, memo, useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PurgaRow as PurgaRowType } from "@/types/proceso";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { Circle } from "lucide-react";

const EMPLEADOS = ["LAMD", "MJFA", "VHAL", "OEVM", "ORC", "PLRG"];
const TIEMPOS = ["1", "2", "3", "4", "5", "6", "7"];

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM/yyyy HH:mm");
  } catch {
    return isoString;
  }
}

const PurgaRow = memo(({ r }: { r: PurgaRowType }) => {
  const updatePurgaField = useOperacionesStore(s => s.updatePurgaField);

  return (
    <TableRow className="hover:bg-muted/40 transition-colors border-b-muted group">
      {/* Marca */}
      <TableCell className="whitespace-nowrap">
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
          {r.marca}
        </span>
      </TableCell>

      {/* Tanque */}
      <TableCell className="font-bold text-base">{r.tanque}</TableCell>

      {/* Fecha Llenado */}
      <TableCell className="text-sm font-bold tracking-tight whitespace-nowrap text-emerald-700 dark:text-emerald-400">
        {formatDate(r.fechaLlenado)}
      </TableCell>

      {/* 8 Purgas */}
      {r.purgas.map((p, i) => (
        <Fragment key={i}>
          <TableCell className="text-xs whitespace-nowrap font-mono text-muted-foreground border-l">
            {formatDate(p.fechaHora)}
          </TableCell>
          <TableCell className="text-center p-1">
            <select
              value={p.tiempo ? String(p.tiempo) : ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "tiempo", e.target.value)}
              className="h-7 w-[55px] mx-auto bg-transparent border border-transparent hover:border-border rounded text-xs px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="" disabled className="text-muted-foreground">—</option>
              {TIEMPOS.map(t => <option key={t} value={t} className="bg-popover text-popover-foreground">{t} min</option>)}
            </select>
          </TableCell>
          <TableCell className="border-r text-center p-1">
            <select
              value={p.realiza || ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "realiza", e.target.value)}
              className="h-7 w-[65px] mx-auto bg-transparent border border-transparent hover:border-border rounded text-xs px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="" disabled className="text-muted-foreground">—</option>
              {EMPLEADOS.map(emp => <option key={emp} value={emp} className="bg-popover text-popover-foreground">{emp}</option>)}
            </select>
          </TableCell>
        </Fragment>
      ))}
    </TableRow>
  );
});

PurgaRow.displayName = "PurgaRow";

const ITEMS_PER_PAGE = 15;

export function PurgasTable({ rows }: { rows: PurgaRowType[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-max min-w-full text-sm">
          <TableHeader className="bg-emerald-900/5 dark:bg-emerald-500/10 sticky top-0 backdrop-blur-sm z-20">
            <TableRow className="border-b border-emerald-500/20 hover:bg-transparent">
              <TableHead rowSpan={2} className="border-r align-middle font-bold text-emerald-900 dark:text-emerald-100 min-w-[130px]">Marca</TableHead>
              <TableHead rowSpan={2} className="border-r align-middle font-bold text-emerald-900 dark:text-emerald-100 min-w-[80px]">Tanque</TableHead>
              <TableHead rowSpan={2} className="border-r align-middle font-bold text-emerald-900 dark:text-emerald-100 whitespace-nowrap min-w-[150px]">Fecha Llenado</TableHead>
              {Array.from({ length: 8 }, (_, i) => (
                <TableHead key={i} colSpan={3} className="text-center border-r font-bold text-emerald-900 dark:text-emerald-100 text-xs">
                  Purga {i + 1}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="border-b border-emerald-500/20 hover:bg-transparent">
              {Array.from({ length: 8 }, (_, i) => (
                <Fragment key={i}>
                  <TableHead className="text-[10px] whitespace-nowrap font-medium text-muted-foreground text-center min-w-[130px]">Fecha / Hora</TableHead>
                  <TableHead className="text-[10px] whitespace-nowrap font-medium text-muted-foreground text-center min-w-[60px]">Tiempo</TableHead>
                  <TableHead className="text-[10px] whitespace-nowrap font-medium text-muted-foreground text-center border-r min-w-[70px]">Realiza</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={27} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Circle className="h-8 w-8 opacity-50" />
                    <p>Sin resultados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => <PurgaRow key={r.id} r={r} />)
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, rows.length)} de {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm px-2">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
