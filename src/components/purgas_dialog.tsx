import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PurgaRow } from "@/types/proceso";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purgaSchema, type PurgaFormValues } from "@/lib/schemas/operaciones";

interface PurgasDialogProps {
  open: boolean;
  set_open: Dispatch<SetStateAction<boolean>>;
  rows: PurgaRow[];
  submit: (data: PurgaFormValues) => void;
}

export function PurgasDialog({ open, set_open, rows, submit }: PurgasDialogProps) {
  const form = useForm<PurgaFormValues>({
    resolver: zodResolver(purgaSchema),
    defaultValues: {
      tanque: rows[0]?.tanque || "",
      numero: 1,
      fechaHora: "",
      tiempo: 1,
      realiza: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tanque: rows[0]?.tanque || "",
        numero: 1,
        fechaHora: "",
        tiempo: 1,
        realiza: "",
      });
    }
  }, [open, rows, form]);

  const onSubmit = form.handleSubmit((data) => {
    submit(data);
  });

  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Registrar Nueva Purga</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar purga</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanque</Label>
              <Select value={form.watch("tanque")} onValueChange={(v) => form.setValue("tanque", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {rows.map((r) => <SelectItem key={r.tanque} value={r.tanque}>{r.tanque}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.tanque && <p className="text-red-500 text-xs mt-1">{form.formState.errors.tanque.message}</p>}
            </div>
            <div>
              <Label>Nº de purga (1-8)</Label>
              <Input type="number" min={1} max={8} {...form.register("numero")} />
              {form.formState.errors.numero && <p className="text-red-500 text-xs mt-1">{form.formState.errors.numero.message}</p>}
            </div>
            <div>
              <Label>Fecha y Hora</Label>
              <Input type="datetime-local" {...form.register("fechaHora")} />
              {form.formState.errors.fechaHora && <p className="text-red-500 text-xs mt-1">{form.formState.errors.fechaHora.message}</p>}
            </div>
            <div>
              <Label>Tiempo (minutos)</Label>
              <Input type="number" min={1} {...form.register("tiempo")} />
              {form.formState.errors.tiempo && <p className="text-red-500 text-xs mt-1">{form.formState.errors.tiempo.message}</p>}
            </div>
            <div className="col-span-2">
              <Label>Realiza (Iniciales)</Label>
              <Input placeholder="Ej: VHN" {...form.register("realiza")} />
              {form.formState.errors.realiza && <p className="text-red-500 text-xs mt-1">{form.formState.errors.realiza.message}</p>}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => set_open(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
