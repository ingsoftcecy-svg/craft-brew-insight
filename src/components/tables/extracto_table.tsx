import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { format } from "date-fns";
import { Circle, CheckCircle2, Trash2, EyeOff, Eye, Plus } from "lucide-react";
import { parseDateToMexico } from "@/lib/utils";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useAuthStore } from "@/store/useAuthStore";

interface ExtractoTableProps {
  rows: any[];
}

function formatDate(isoString: string | null | undefined) {
  if (!isoString) return "—";
  try {
    const d = parseDateToMexico(isoString);
    if (!d) return isoString;
    return format(d, "dd/MM HH:mm");
  } catch (e) {
    return isoString;
  }
}

export function ExtractoTable({ rows }: ExtractoTableProps) {
  const toggleEstadoChequeo = useOperacionesStore((s) => s.toggleEstadoChequeo);
  const deleteExtracto = useOperacionesStore((s) => s.deleteExtracto);
  const addCustomChequeo = useOperacionesStore((s) => s.addCustomChequeo);
  const removeCustomChequeo = useOperacionesStore((s) => s.removeCustomChequeo);
  const isSuperUser = useAuthStore((s) => s.isSuperUser);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const baseHours = [24, 48, 72, 96, 120, 128, 136, 144];

  const HORAS = (() => {
    const dynamic = new Set<number>();
    rows.forEach(r => {
      Object.keys(r).forEach(k => {
        const match = k.match(/^h(\d+)$/);
        if (match) {
          const h = parseInt(match[1]);
          if (!baseHours.includes(h)) dynamic.add(h);
        }
      });
    });
    return Array.from(new Set([...baseHours, ...dynamic])).sort((a,b) => a - b);
  })();

  const toggleColumn = (colId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId],
    );
  };

  const renderHeader = (label: string, colId: string, className = "") => {
    if (hiddenColumns.includes(colId)) return null;
    const isDynamic = colId.endsWith('h') && !baseHours.includes(parseInt(colId.replace('h', '')));
    
    return (
      <CustomTableHead className={`group relative pr-8 ${className}`}>
        <div className="flex items-center justify-center gap-2">
          {label}
          {isSuperUser && isDynamic && (
            <button
              onClick={() => {
                if (window.confirm(`¿Estás seguro de eliminar el chequeo de ${label} de toda la tabla?`)) {
                  removeCustomChequeo(parseInt(colId.replace('h', '')));
                }
              }}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title={`Eliminar columna ${label}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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

  const handleAddCustomChequeo = (tanqueId?: string) => {
    const input = window.prompt("Ingresa el número de horas para el nuevo chequeo (ej. 155):");
    if (!input) return;
    const hora = parseInt(input.trim());
    if (isNaN(hora) || hora <= 0) {
      alert("Por favor, ingresa un número de horas válido.");
      return;
    }
    addCustomChequeo(hora, tanqueId);
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
            {renderHeader("Tanque", "tanque")}
            {renderHeader("Fecha Inicio Llenado", "fechaInicio")}
            {renderHeader("Fecha Fin Llenado", "fecha")}
            {HORAS.map((h) =>
              renderHeader(
                `${h} Hrs`,
                `${h}h`,
                `text-center`,
              ),
            )}
            {isSuperUser && (
              <CustomTableHead className="border-r-0 w-24 text-center">
                <button
                  onClick={() => handleAddCustomChequeo()}
                  className="flex items-center gap-1 mx-auto text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                  title="Añadir chequeo a todos los tanques"
                >
                  <Plus className="w-3.5 h-3.5" /> Hrs
                </button>
              </CustomTableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              className="hover:bg-muted/50 transition-colors border-b border-border group"
            >
              {!hiddenColumns.includes("marca") && (
                <CustomTableCell className="py-3">
                  <span className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary border border-primary/20 shadow-sm">
                    {r.marca}
                  </span>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("tanque") && (
                <CustomTableCell className="font-black text-sm text-foreground">
                  {r.tanque}
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("fechaInicio") && (
                <CustomTableCell className="text-sm font-bold tracking-tight text-muted-foreground tabular-nums">
                  <div className="flex flex-col">
                    <span>{formatDate(r.fechaInicioLlenado)}</span>
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("fecha") && (
                <CustomTableCell className="text-sm font-bold tracking-tight text-muted-foreground tabular-nums">
                  {formatDate(r.fechaLlenado)}
                </CustomTableCell>
              )}
              {HORAS.map((h) => {
                const key = `${h}h`;
                const val = r[`h${h}`];
                const estado = r[`estado${h}h`];
                if (hiddenColumns.includes(key)) return null;

                return (
                  <CustomTableCell
                    key={h}
                    onClick={() =>
                      isSuperUser && val && toggleEstadoChequeo(r.id, key, isSuperUser)
                    }
                    className={`text-sm tabular-nums text-center ${h === 144 && !isSuperUser ? "border-r-0" : ""} ${!val ? "text-muted-foreground/30" : estado === "Completado" ? "text-green-600 dark:text-green-500 font-bold bg-green-500/10" : "text-muted-foreground font-medium"} ${isSuperUser && val ? "cursor-pointer hover:bg-green-500/20" : ""}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {estado === "Completado" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {formatDate(val)}
                    </div>
                  </CustomTableCell>
                );
              })}
              {isSuperUser && (
                <CustomTableCell className="border-r-0 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handleAddCustomChequeo(r.id)}
                      className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title={`Añadir chequeo extra para ${r.tanque}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("¿Estás seguro de eliminar este registro completo?")) {
                          deleteExtracto(r.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar tanque"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CustomTableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-muted rounded-full">
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-sm">Sin resultados</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
