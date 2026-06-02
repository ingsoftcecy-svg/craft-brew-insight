import { Fragment, memo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PurgaRow as PurgaRowType } from "@/types/proceso";

const PurgaRow = memo(({ r }: { r: PurgaRowType }) => {
  return (
    <TableRow>
      <TableCell className="font-medium border-r bg-muted/20">{r.tanque}</TableCell>
      <TableCell className="border-r whitespace-nowrap bg-muted/20">{r.fecha}</TableCell>
      <TableCell className="border-r whitespace-nowrap bg-muted/20">{r.marca}</TableCell>
      <TableCell className="text-muted-foreground border-r whitespace-nowrap bg-muted/20">{r.fechaLlenado}</TableCell>
      <TableCell className="border-r text-right tabular-nums bg-muted/20">{r.horas}</TableCell>
      <TableCell className="border-r whitespace-nowrap text-xs bg-muted/20">{r.historicas}</TableCell>
      {r.purgas.map((p, i) => (
        <Fragment key={i}>
          <TableCell className="text-[10px] whitespace-nowrap border-l">{p.fechaHora ?? "—"}</TableCell>
          <TableCell className="text-center text-xs">{p.tiempo ?? "—"}</TableCell>
          <TableCell className="border-r text-center text-xs font-medium">{p.realiza ?? "—"}</TableCell>
        </Fragment>
      ))}
    </TableRow>
  );
});

PurgaRow.displayName = "PurgaRow";

export function PurgasTable({ rows }: { rows: PurgaRowType[] }) {
  return (
    <div className="overflow-x-auto rounded-md border pb-4">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground">TANQUE</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground">FECHA C.</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground">MARCA</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle whitespace-nowrap text-xs font-bold text-foreground">FECHA DE LLENADO</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground">HORAS</TableHead>
            <TableHead rowSpan={2} className="border-r align-middle text-xs font-bold text-foreground">HISTORICAS</TableHead>
            {Array.from({ length: 8 }, (_, i) => (
              <TableHead key={i} colSpan={3} className="text-center border-r border-l font-bold bg-primary text-primary-foreground text-xs uppercase">
                PURGA {i + 1}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {Array.from({ length: 8 }, (_, i) => (
              <Fragment key={i}>
                <TableHead className="text-[10px] whitespace-nowrap border-l bg-muted text-center">FECHA/HORA</TableHead>
                <TableHead className="text-[10px] whitespace-nowrap bg-muted text-center">TIEMPO</TableHead>
                <TableHead className="text-[10px] whitespace-nowrap border-r bg-muted text-center">REALIZA</TableHead>
              </Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => <PurgaRow key={r.id} r={r} />)}
        </TableBody>
      </Table>
    </div>
  );
}
