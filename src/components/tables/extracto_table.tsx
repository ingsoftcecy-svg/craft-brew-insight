import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { format } from "date-fns";
import { Circle, CheckCircle2 } from "lucide-react";
import { parseDateToMexico } from "@/lib/utils";

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
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            <CustomTableHead>Marca</CustomTableHead>
            <CustomTableHead>Tanque</CustomTableHead>
            <CustomTableHead>Fecha Fin Llenado</CustomTableHead>
            <CustomTableHead className="text-center">24 Hrs</CustomTableHead>
            <CustomTableHead className="text-center">48 Hrs</CustomTableHead>
            <CustomTableHead className="text-center">72 Hrs</CustomTableHead>
            <CustomTableHead className="text-center">96 Hrs</CustomTableHead>
            <CustomTableHead className="text-center">120 Hrs</CustomTableHead>
            <CustomTableHead className="border-r-0 text-center">144 Hrs</CustomTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-amber-50/60 transition-colors border-b border-slate-100 group">
              <CustomTableCell className="py-3">
                <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
                  {r.marca}
                </span>
              </CustomTableCell>
              <CustomTableCell className="font-black text-sm text-slate-900">{r.tanque}</CustomTableCell>
              <CustomTableCell className="text-sm font-bold tracking-tight text-slate-700 tabular-nums">
                {formatDate(r.fechaLlenado)}
              </CustomTableCell>
              <CustomTableCell className={`text-sm tabular-nums text-center ${!r.h24 ? 'text-slate-300' : (r.estado24h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado24h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h24)}
                </div>
              </CustomTableCell>
              <CustomTableCell className={`text-sm tabular-nums text-center ${!r.h48 ? 'text-slate-300' : (r.estado48h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado48h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h48)}
                </div>
              </CustomTableCell>
              <CustomTableCell className={`text-sm tabular-nums text-center ${!r.h72 ? 'text-slate-300' : (r.estado72h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado72h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h72)}
                </div>
              </CustomTableCell>
              <CustomTableCell className={`text-sm tabular-nums text-center ${!r.h96 ? 'text-slate-300' : (r.estado96h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado96h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h96)}
                </div>
              </CustomTableCell>
              <CustomTableCell className={`text-sm tabular-nums text-center ${!r.h120 ? 'text-slate-300' : (r.estado120h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado120h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h120)}
                </div>
              </CustomTableCell>
              <CustomTableCell className={`border-r-0 text-sm tabular-nums text-center ${!r.h144 ? 'text-slate-300' : (r.estado144h === "Completado" ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 font-medium')}`}>
                <div className="flex items-center justify-center gap-1.5">
                  {r.estado144h === "Completado" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  {formatDate(r.h144)}
                </div>
              </CustomTableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-slate-500 py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <Circle className="h-6 w-6 text-slate-400" />
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
