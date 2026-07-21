import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { format } from "date-fns";
import type { ExtractoRow } from "@/types/proceso";
import { Circle, CheckCircle2, Trash2, Eye, EyeOff } from "lucide-react";
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

import { useAuthStore } from "@/store/useAuthStore";

export function ChequeoDinamicoTable({ rows, horaLabel }: ChequeoDinamicoTableProps) {
  const toggleEstadoChequeo = useOperacionesStore((s) => s.toggleEstadoChequeo);
  const deleteExtracto = useOperacionesStore((s) => s.deleteExtracto);
  const user = useAuthStore((s) => s.user);
  const superUserEmail =
    import.meta.env.VITE_API_FIREBASE_EMAIL || "cecilialopezsolis1122@gmail.com";
  const isSuperUser = user?.email === superUserEmail;
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const toggleColumn = (colId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId],
    );
  };

  const renderHeader = (label: string, colId: string, className = "") => {
    if (hiddenColumns.includes(colId)) return null;
    return (
      <CustomTableHead className={`group relative ${className}`}>
        {label}
        {isSuperUser && (
          <button
            onClick={() => toggleColumn(colId)}
            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
            title="Ocultar columna"
          >
            <EyeOff className="w-3 h-3 text-slate-500" />
          </button>
        )}
      </CustomTableHead>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      {isSuperUser && hiddenColumns.length > 0 && (
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setHiddenColumns([])}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
          >
            <Eye className="w-3.5 h-3.5" />
            Mostrar columnas ocultas ({hiddenColumns.length})
          </button>
        </div>
      )}
      <Table>
        <TableHeader className="bg-muted/80 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            {renderHeader("Marca", "marca")}
            {renderHeader("Tanque", "tanque", "text-center")}
            {renderHeader("Fecha Llenado", "fecha", "text-center")}
            {renderHeader(`Fecha y Hora Chequeo ${horaLabel}`, "chequeo", "text-center")}
            {renderHeader("Estado", "estado", `text-center ${!isSuperUser ? "border-r-0" : ""}`)}
            {isSuperUser && <CustomTableHead className="border-r-0 w-10"></CustomTableHead>}
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
                className={`hover:bg-muted/50 transition-colors border-b border-border group ${isCompletado ? "opacity-75 bg-background/40 hover:bg-background/60" : ""}`}
              >
                {!hiddenColumns.includes("marca") && (
                  <CustomTableCell className="py-3">
                    <span className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary border border-primary/20 shadow-sm">
                      {r.marca}
                    </span>
                  </CustomTableCell>
                )}
                {!hiddenColumns.includes("tanque") && (
                  <CustomTableCell
                    className={`font-black text-sm text-foreground text-center ${isCompletado ? "line-through opacity-50" : ""}`}
                  >
                    {r.tanque}
                  </CustomTableCell>
                )}
                {!hiddenColumns.includes("fecha") && (
                  <CustomTableCell className="text-sm font-bold tracking-tight text-muted-foreground tabular-nums text-center">
                    {formatDate(r.fechaLlenado)}
                  </CustomTableCell>
                )}
                {!hiddenColumns.includes("chequeo") && (
                  <CustomTableCell className="text-sm font-medium tracking-tight text-muted-foreground tabular-nums text-center">
                    {formatDate(fechaChequeo)}
                  </CustomTableCell>
                )}
                {!hiddenColumns.includes("estado") && (
                  <CustomTableCell className={`text-center ${!isSuperUser ? "border-r-0" : ""}`}>
                    <div className="flex justify-center">
                      <button
                        onClick={() =>
                          (!isCompletado || isSuperUser) &&
                          toggleEstadoChequeo(r.id, horaLabel, isSuperUser)
                        }
                        disabled={isCompletado && !isSuperUser}
                        className={`
                          relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300
                          ${
                            isCompletado
                              ? `bg-emerald-100 text-emerald-700 border border-emerald-200 ${isSuperUser ? "hover:bg-emerald-200 hover:shadow-sm cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}`
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
                )}
                {isSuperUser && (
                  <CustomTableCell className="border-r-0 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de eliminar este registro completo?")) {
                          deleteExtracto(r.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </CustomTableCell>
                )}
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium">
                No hay chequeos de {horaLabel} para mostrar con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
