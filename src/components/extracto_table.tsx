import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface ExtractoTableProps {
  rows: any[];
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

export function ExtractoTable({ rows }: ExtractoTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className="bg-emerald-900/5 dark:bg-emerald-500/10 sticky top-0 backdrop-blur-sm z-10">
          <TableRow className="border-b border-emerald-500/20 hover:bg-transparent">
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Marca</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Tanque</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">Fecha Llenado</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">24 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">48 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">72 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">96 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">120 Hrs</TableHead>
            <TableHead className="font-bold text-emerald-900 dark:text-emerald-100">144 Hrs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/40 transition-colors border-b-muted group">
              <TableCell className="whitespace-nowrap">
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                  {r.marca}
                </span>
              </TableCell>
              <TableCell className="font-bold text-base">{r.tanque}</TableCell>
              <TableCell className="text-sm font-bold tracking-tight whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                {formatDate(r.fechaLlenado)}
              </TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h24 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h24)}</TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h48 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h48)}</TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h72 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h72)}</TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h96 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h96)}</TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h120 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h120)}</TableCell>
              <TableCell className={`text-xs whitespace-nowrap font-mono ${!r.h144 ? 'text-muted-foreground/40' : 'text-foreground'}`}>{formatDate(r.h144)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl opacity-50">📂</span>
                  <p>Sin resultados</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
