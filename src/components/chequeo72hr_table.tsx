import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { ExtractoRow } from "@/types/proceso";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { Cross } from "recharts";

interface Plato72TableProps {
  rows: ExtractoRow[];
}

function formatDate(isoString: string | null | undefined) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return format(d, "dd/MM/yyyy HH:mm");
  } catch (e) {
    return isoString;
  }
}

export function Checar72Table({ rows }: Plato72TableProps) {
  const toggleEstado72h = useOperacionesStore(s => s.toggleEstado72h);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className="bg-emerald-900/5 dark:bg-emerald-500/10 sticky top-0 backdrop-blur-sm z-10">
          <TableRow className="border-b border-emerald-500/20 hover:bg-transparent">
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Marca</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Tanque</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Fecha Llenado</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Fecha y Hora Chequeo 72 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const isCompletado = r.estado72h === "Completado";
            return (
              <TableRow key={r.id} className={`hover:bg-muted/40 transition-colors border-b-muted group ${isCompletado ? "opacity-75 bg-muted/20" : ""}`}>
                
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                    {r.marca}
                  </span>
                </TableCell>
                <TableCell className={`font-bold text-base ${isCompletado ? "line-through opacity-70" : ""}`}>{r.tanque}</TableCell>
                <TableCell className="text-sm font-medium tracking-tight whitespace-nowrap text-muted-foreground">
                  {formatDate(r.fechaLlenado)}
                </TableCell>
                <TableCell className="text-sm font-bold tracking-tight whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                  {formatDate(r.h72)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <button
                    onClick={() => toggleEstado72h(r.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
                      isCompletado
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                    }`}
                  >
                    {isCompletado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {isCompletado ? "Completado" : "Pendiente"}
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center gap-2">
                  <Circle className="h-8 w-8 opacity-50" />
                  <p>No hay resultados disponibles</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
