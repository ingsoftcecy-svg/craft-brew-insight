import { Fragment, memo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PurgaRow as PurgaRowType } from "@/types/proceso";
import { useOperacionesStore } from "@/store/useOperacionesStore";

const EMPLEADOS = ["LAMD", "EMP 2", "EMP 3", "EMP 4", "EMP 5", "EMP 6"];
const TIEMPOS = ["1", "2", "3", "4", "5", "6", "7"];

const formatearFechaHora = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM/yyyy HH:mm");
  } catch (e) {
    return isoString;
  }
};

const mostrarFechaPurga = (fecha?: string | null) => {
  if (!fecha) return "—";
  // Si es un ISO string generado por el sistema, lo formateamos
  if (fecha.includes("T") && fecha.endsWith("Z")) {
    return formatearFechaHora(fecha);
  }
  // Si viene del Excel, lo dejamos intacto para no arruinar la hora
  return fecha;
};

const PurgaRow = memo(({ r }: { r: PurgaRowType }) => {
  const updatePurgaField = useOperacionesStore(s => s.updatePurgaField);

  return (
    <TableRow className="hover:bg-muted/5">
      <TableCell className="font-medium border-r min-w-[100px]">{r.tanque}</TableCell>
      <TableCell className="border-r whitespace-nowrap min-w-[120px]">{r.marca}</TableCell>
      <TableCell className="text-muted-foreground border-r whitespace-nowrap min-w-[150px]">{formatearFechaHora(r.fechaLlenado)}</TableCell>
      {r.purgas.map((p, i) => (
        <Fragment key={i}>
          <TableCell className="text-[10px] whitespace-nowrap border-l">{mostrarFechaPurga(p.fechaHora)}</TableCell>
          <TableCell className="text-center p-1">
            <select
              value={p.tiempo ? String(p.tiempo) : ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "tiempo", e.target.value)}
              className="h-7 w-[50px] mx-auto bg-transparent border border-transparent hover:border-border rounded text-xs px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="" disabled className="text-muted-foreground">—</option>
              {TIEMPOS.map(t => <option key={t} value={t} className="bg-popover text-popover-foreground">{t} min</option>)}
            </select>
          </TableCell>
          <TableCell className="border-r text-center p-1 font-medium">
            <select
              value={p.realiza || ""}
              onChange={(e) => updatePurgaField(r.id, i + 1, "realiza", e.target.value)}
              className="h-7 w-[60px] mx-auto bg-transparent border border-transparent hover:border-border rounded text-xs px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
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

export function PurgasTable({ rows }: { rows: PurgaRowType[] }) {
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-auto rounded-xl border bg-card shadow-sm max-h-[70vh]">
        <Table className="w-max min-w-full text-sm">
          <TableHeader className="bg-secondary/80 sticky top-0 z-20 backdrop-blur-sm">
            <TableRow>
              <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground min-w-[100px]">TANQUE</TableHead>
              <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground min-w-[120px]">MARCA</TableHead>
              <TableHead rowSpan={2} className="border-r align-middle whitespace-nowrap text-xs font-bold text-foreground min-w-[150px]">FECHA LLENADO</TableHead>
              {Array.from({ length: 8 }, (_, i) => (
                <TableHead key={i} colSpan={3} className="text-center border-r border-l font-bold bg-muted/30 text-foreground text-xs uppercase min-w-[240px]">
                  PURGA {i + 1}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              {Array.from({ length: 8 }, (_, i) => (
                <Fragment key={i}>
                  <TableHead className="text-[10px] whitespace-nowrap bg-muted/10 text-center border-l min-w-[100px]">FECHA/HORA</TableHead>
                  <TableHead className="text-[10px] whitespace-nowrap bg-muted/10 text-center min-w-[60px]">TIEMPO</TableHead>
                  <TableHead className="text-[10px] whitespace-nowrap bg-muted/10 text-center border-r min-w-[80px]">REALIZA</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={27} className="h-24 text-center text-muted-foreground">
                  No hay datos de purgas para mostrar.
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
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, rows.length)} de {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm px-2">
              Página {page} de {totalPages}
            </span>
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
