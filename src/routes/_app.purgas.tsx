import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurgasDialog } from "@/components/purgas_dialog";
import { PurgasTable } from "@/components/purgas_table";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import type { PurgaFormValues } from "@/lib/schemas/operaciones";
import { UploadPurgas } from "@/components/subir_archivos";

export const Route = createFileRoute("/_app/purgas")({
  head: () => ({
    meta: [
      { title: "Purgas de Trub en Frío — Elaboración" },
      { name: "description", content: "Registro y control de descargas de sedimentos." },
    ],
  }),
  component: PurgasPage,
});

function PurgasPage() {
  const { purgas, updatePurgaRow } = useOperacionesStore();
  const [open, set_open] = useState(false);

  function submit(data: PurgaFormValues) {
    updatePurgaRow(data.tanque, data.numero, data.fechaHora, data.tiempo, data.realiza);
    set_open(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Purgas de Trub en Frío</h1>
          <p className="text-sm text-muted-foreground">Registro de descargas de sedimentos por tanque</p>
        </div>
        <UploadPurgas/>
        <PurgasDialog 
          open={open} 
          set_open={set_open} 
          rows={purgas} 
          submit={submit} 
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Registro de purgas</CardTitle></CardHeader>
        <CardContent>
          <PurgasTable rows={purgas} />
        </CardContent>
      </Card>
    </div>
  );
}
