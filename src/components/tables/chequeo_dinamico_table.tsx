import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { format } from "date-fns";
import type { ExtractoRow } from "@/types/proceso";
import { CheckCircle2, Circle } from "lucide-react";
import { useOperacionesStore } from "@/store/useOperacionesStore";

interface ChequeoDinamicoTableProps {
  rows: ExtractoRow[];
  horaLabel: string; // e.g. "24h", "72h"
}

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM HH:mm");
  } catch {
    return isoString;
  }
}

export function ChequeoDinamicoTable({ rows, horaLabel }: ChequeoDinamicoTableProps) {
  const toggleEstadoChequeo = useOperacionesStore((s) => s.toggleEstadoChequeo);

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            <CustomTableHead>Marca</CustomTableHead>
            <CustomTableHead className="text-center">Tanque</CustomTableHead>
            <CustomTableHead className="text-center">Fecha Llenado</CustomTableHead>
            <CustomTableHead className="text-center">
              Fecha y Hora Chequeo {horaLabel}
            </CustomTableHead>
            <CustomTableHead className="border-r-0 text-center">Estado</CustomTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const propNameEstado = `estado${horaLabel}` as keyof ExtractoRow;
            const propNameFecha = `h${horaLabel.replace("h", "")}` as keyof ExtractoRow;

            const isCompletado = r[propNameEstado] === "Completado";
            const fechaChequeo = r[propNameFecha] as string | null;

            return (
              <TableRow
                key={r.id}
                className={`hover:bg-amber-50/60 transition-colors border-b border-slate-100 group ${isCompletado ? "opacity-75 bg-slate-50/40 hover:bg-slate-50/60" : ""}`}
              >
                <CustomTableCell className="py-3">
                  <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
                    {r.marca}
                  </span>
                </CustomTableCell>
                <CustomTableCell
                  className={`font-black text-sm text-slate-900 text-center ${isCompletado ? "line-through opacity-50" : ""}`}
                >
                  {r.tanque}
                </CustomTableCell>
                <CustomTableCell className="text-sm font-bold tracking-tight text-slate-700 tabular-nums text-center">
                  {formatDate(r.fechaLlenado)}
                </CustomTableCell>
                <CustomTableCell className="text-sm font-medium tracking-tight text-slate-500 tabular-nums text-center">
                  {formatDate(fechaChequeo)}
                </CustomTableCell>
                <CustomTableCell className="border-r-0">
                  <div className="flex justify-center">
                    <button
                      onClick={() => !isCompletado && toggleEstadoChequeo(r.id, horaLabel)}
                      disabled={isCompletado}
                      className={`
                        relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                        ${
                          isCompletado
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default"
                            : "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 hover:shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                        }
                      `}
                    >
                      {isCompletado ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completado</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-amber-600/70" />
                          <span>Pendiente</span>
                        </>
                      )}
                    </button>
                  </div>
                </CustomTableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                No hay chequeos de {horaLabel} para mostrar con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
