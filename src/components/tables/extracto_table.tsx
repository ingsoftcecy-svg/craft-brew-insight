import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { format } from "date-fns";
import { Circle, CheckCircle2, Trash2, EyeOff, Eye } from "lucide-react";
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
  const user = useAuthStore((s) => s.user);
  const superUserEmail = import.meta.env.VITE_API_FIREBASE_EMAIL || "cecilialopezsolis1122@gmail.com";
  const isSuperUser = user?.email === superUserEmail;
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const toggleColumn = (colId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
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
        <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <TableRow className="border-b-0 hover:bg-transparent">
            {renderHeader("Marca", "marca")}
            {renderHeader("Tanque", "tanque")}
            {renderHeader("Fecha Fin Llenado", "fecha")}
            {renderHeader("24 Hrs", "24h", "text-center")}
            {renderHeader("48 Hrs", "48h", "text-center")}
            {renderHeader("72 Hrs", "72h", "text-center")}
            {renderHeader("96 Hrs", "96h", "text-center")}
            {renderHeader("120 Hrs", "120h", "text-center")}
            {renderHeader("144 Hrs", "144h", `text-center ${!isSuperUser ? "border-r-0" : ""}`)}
            {isSuperUser && <CustomTableHead className="border-r-0 w-10"></CustomTableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              className="hover:bg-amber-50/60 transition-colors border-b border-slate-100 group"
            >
              {!hiddenColumns.includes("marca") && (
                <CustomTableCell className="py-3">
                  <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
                    {r.marca}
                  </span>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("tanque") && (
                <CustomTableCell className="font-black text-sm text-slate-900">
                  {r.tanque}
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("fecha") && (
                <CustomTableCell className="text-sm font-bold tracking-tight text-slate-700 tabular-nums">
                  {formatDate(r.fechaLlenado)}
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("24h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h24 && toggleEstadoChequeo(r.id, "24h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!r.h24 ? "text-slate-300" : r.estado24h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h24 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado24h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h24)}
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("48h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h48 && toggleEstadoChequeo(r.id, "48h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!r.h48 ? "text-slate-300" : r.estado48h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h48 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado48h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h48)}
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("72h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h72 && toggleEstadoChequeo(r.id, "72h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!r.h72 ? "text-slate-300" : r.estado72h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h72 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado72h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h72)}
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("96h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h96 && toggleEstadoChequeo(r.id, "96h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!r.h96 ? "text-slate-300" : r.estado96h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h96 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado96h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h96)}
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("120h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h120 && toggleEstadoChequeo(r.id, "120h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!r.h120 ? "text-slate-300" : r.estado120h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h120 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado120h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h120)}
                  </div>
                </CustomTableCell>
              )}
              {!hiddenColumns.includes("144h") && (
                <CustomTableCell
                  onClick={() => isSuperUser && r.h144 && toggleEstadoChequeo(r.id, "144h", isSuperUser)}
                  className={`text-sm tabular-nums text-center ${!isSuperUser ? "border-r-0" : ""} ${!r.h144 ? "text-slate-300" : r.estado144h === "Completado" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-500 font-medium"} ${isSuperUser && r.h144 ? "cursor-pointer hover:bg-emerald-50" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {r.estado144h === "Completado" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {formatDate(r.h144)}
                  </div>
                </CustomTableCell>
              )}
              {isSuperUser && (
                <CustomTableCell className="border-r-0 text-center">
                  <button
                    onClick={() => {
                      if(window.confirm("¿Estás seguro de eliminar este registro completo?")) {
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
