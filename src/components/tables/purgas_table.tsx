import { Fragment, memo, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomTableHead, CustomTableCell } from "@/components/tables/custom_table_cells";
import { type PurgaRow as PurgaRowType } from "@/types/proceso";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Circle, CheckCircle2, Trash2, Eye, EyeOff } from "lucide-react";
import { TablePagination } from "@/components/ui/table_pagination";

const EMPLEADOS = ["LAMD", "MJFA", "VHAL", "OEVM", "ORC", "PLRG"];
const TIEMPOS = ["1", "2", "3", "4", "5", "6", "7"];

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    // Quitamos el año para reducir ruido (ej: 16/06 21:14)
    return format(d, "dd/MM HH:mm");
  } catch {
    return isoString;
  }
}

const PurgaRow = memo(({ r, hiddenColumns }: { r: PurgaRowType; hiddenColumns: string[] }) => {
  const updatePurgaField = useOperacionesStore((s) => s.updatePurgaField);
  const deletePurga = useOperacionesStore((s) => s.deletePurga);
  const isSuperUser = useAuthStore((s) => s.isSuperUser);

  const renderPurga = (p: any, i: number, isInitial: boolean = false) => {
    const completada = Boolean(p.tiempo && p.realiza);
    const dateToShow = isInitial ? r.fechaLlenado : p.fechaHora;
    return (
      <Fragment key={i}>
        <CustomTableCell
          className={`text-sm font-bold tabular-nums text-center ${completada ? "text-green-600 bg-green-50/30" : "text-slate-500"}`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-1.5">
              {completada && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {formatDate(dateToShow)}
            </div>
            {isInitial && r.tiempoLlenadoHoras !== undefined && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded w-fit mt-0.5 border border-blue-100">
                {r.tiempoLlenadoHoras}h llenado
              </span>
            )}
          </div>
        </CustomTableCell>
        <TableCell className="text-center p-1 border-b border-slate-100">
          <select
            value={p.tiempo ? String(p.tiempo) : ""}
            onChange={(e) => updatePurgaField(r.id, i + 1, "tiempo", e.target.value)}
            className={`h-7 w-[55px] mx-auto bg-transparent border hover:border-amber-300 hover:bg-white rounded text-sm font-bold px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none transition-colors ${
              p.tiempo
                ? "border-amber-200 text-amber-900 bg-amber-50"
                : "border-transparent text-slate-400"
            }`}
          >
            <option value="" disabled={!isSuperUser} className="text-slate-300 font-medium">
              —
            </option>
            {TIEMPOS.map((t) => (
              <option key={t} value={t} className="text-slate-800">
                {t} min
              </option>
            ))}
          </select>
        </TableCell>
        <CustomTableCell className="text-center p-1">
          <select
            value={p.realiza || ""}
            onChange={(e) => updatePurgaField(r.id, i + 1, "realiza", e.target.value)}
            className={`h-7 w-[65px] mx-auto bg-transparent border hover:border-amber-300 hover:bg-white rounded text-sm font-bold px-1 text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none transition-colors ${
              p.realiza
                ? "border-amber-200 text-amber-900 bg-amber-50"
                : "border-transparent text-slate-400"
            }`}
          >
            <option value="" disabled={!isSuperUser} className="text-slate-300 font-medium">
              —
            </option>
            {EMPLEADOS.map((emp) => (
              <option key={emp} value={emp} className="text-slate-800">
                {emp}
              </option>
            ))}
          </select>
        </CustomTableCell>
      </Fragment>
    );
  };

  return (
    <TableRow className="hover:bg-amber-50/60 transition-colors border-b border-slate-100 group">
      {/* Marca */}
      <CustomTableCell className="py-3">
        <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-black text-blue-800 border border-blue-200 shadow-sm">
          {r.marca}
        </span>
      </CustomTableCell>

      {/* Tanque */}
      <CustomTableCell className="font-black text-sm text-slate-900">{r.tanque}</CustomTableCell>

      {/* Fecha Inicio Llenado */}
      {!hiddenColumns.includes("fecha") && (
        <CustomTableCell className="text-sm font-bold tracking-tight text-slate-700 tabular-nums">
          <div className="flex flex-col">
            <span>{formatDate(r.fechaInicioLlenado)}</span>
          </div>
        </CustomTableCell>
      )}

      {/* Purga Inicial */}
      {!hiddenColumns.includes("p0") && r.purgas.length > 0 && renderPurga(r.purgas[0], 0, true)}

      {/* 8 Purgas */}
      {r.purgas.slice(1).map((p, index) => {
        if (hiddenColumns.includes(`p${index + 1}`)) return null;
        return renderPurga(p, index + 1, false);
      })}

      {isSuperUser && (
        <CustomTableCell className="border-r-0 text-center p-1 align-middle">
          <button
            onClick={() => {
              if (window.confirm("¿Estás seguro de eliminar este registro completo?")) {
                deletePurga(r.id);
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
});

PurgaRow.displayName = "PurgaRow";

const ITEMS_PER_PAGE = 20;

export function PurgasTable({ rows }: { rows: PurgaRowType[] }) {
  const [page, setPage] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const isSuperUser = useAuthStore((s) => s.isSuperUser);

  const paginatedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleColumn = (colId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId],
    );
  };

  return (
    <div className="space-y-4">
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
        <Table className="w-max min-w-full text-sm">
          <TableHeader className="bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <CustomTableHead rowSpan={2} className="align-middle min-w-[130px]">
                Marca
              </CustomTableHead>
              <CustomTableHead rowSpan={2} className="align-middle min-w-[80px]">
                Tanque
              </CustomTableHead>
              {!hiddenColumns.includes("fecha") && (
                <CustomTableHead rowSpan={2} className="align-middle min-w-[150px] group relative">
                  Fecha Inicio Llenado
                  {isSuperUser && (
                    <button
                      onClick={() => toggleColumn("fecha")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                    >
                      <EyeOff className="w-3 h-3 text-slate-500" />
                    </button>
                  )}
                </CustomTableHead>
              )}
              {!hiddenColumns.includes("p0") && (
                <CustomTableHead colSpan={3} className="text-center group relative">
                  Purga Inicial
                  {isSuperUser && (
                    <button
                      onClick={() => toggleColumn("p0")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                    >
                      <EyeOff className="w-3 h-3 text-slate-500" />
                    </button>
                  )}
                </CustomTableHead>
              )}
              {Array.from({ length: 8 }, (_, i) => {
                const colId = `p${i + 1}`;
                if (hiddenColumns.includes(colId)) return null;
                return (
                  <CustomTableHead
                    key={i}
                    colSpan={3}
                    className={`text-center group relative ${i === 7 && !isSuperUser ? "border-r-0" : ""}`}
                  >
                    {`Purga ${i + 1}`}
                    {isSuperUser && (
                      <button
                        onClick={() => toggleColumn(colId)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                      >
                        <EyeOff className="w-3 h-3 text-slate-500" />
                      </button>
                    )}
                  </CustomTableHead>
                );
              })}
              {isSuperUser && <CustomTableHead className="border-r-0 w-10"></CustomTableHead>}
            </TableRow>
            <TableRow className="border-b-0 hover:bg-transparent">
              {Array.from({ length: 9 }, (_, i) => {
                const colId = `p${i}`;
                if (hiddenColumns.includes(colId)) return null;
                return (
                  <Fragment key={i}>
                    <TableHead className="text-sm font-bold tracking-wider text-slate-500 text-center border-l border-slate-200 min-w-[130px]">
                      {i === 0 ? "Fecha Fin Llenado" : "Fecha / Hora"}
                    </TableHead>
                    <TableHead className="text-sm font-bold tracking-wider text-slate-500 text-center min-w-[60px]">
                      Tiempo
                    </TableHead>
                    <CustomTableHead className="py-2 text-slate-500 min-w-[70px]">
                      Realiza
                    </CustomTableHead>
                  </Fragment>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={27} className="text-center text-slate-500 py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-full">
                      <Circle className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-sm">Sin resultados</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((r) => <PurgaRow key={r.id} r={r} hiddenColumns={hiddenColumns} />)
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        setPage={setPage}
        totalItems={rows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        isZeroIndexed={false}
      />
    </div>
  );
}
