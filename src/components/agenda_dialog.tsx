import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EventType } from "@/types/proceso";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agendaSchema, type AgendaFormValues } from "@/lib/schemas/operaciones";

interface AgendaDialogProps {
  open: boolean;
  set_open: Dispatch<SetStateAction<boolean>>;
  submit: (data: AgendaFormValues) => void;
}

export function AgendaDialog({ open, set_open, submit }: AgendaDialogProps) {
  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      titulo: "",
      inicio: "",
      fin: "",
      tipo: "Turno1",
      descripcion: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        titulo: "",
        inicio: "",
        fin: "",
        tipo: "Turno1",
        descripcion: "",
      });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit((data) => {
    submit(data);
  });

  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input placeholder="Ej: Mantenimiento TK-110" {...form.register("titulo")} />
              {form.formState.errors.titulo && <p className="text-red-500 text-xs mt-1">{form.formState.errors.titulo.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input type="datetime-local" {...form.register("inicio")} />
                {form.formState.errors.inicio && <p className="text-red-500 text-xs mt-1">{form.formState.errors.inicio.message}</p>}
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="datetime-local" {...form.register("fin")} />
                {form.formState.errors.fin && <p className="text-red-500 text-xs mt-1">{form.formState.errors.fin.message}</p>}
              </div>
            </div>
            <div>
              <Label>Tipo de evento</Label>
              <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as EventType, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Turno1">Turno 1</SelectItem>
                  <SelectItem value="Turno2">Turno 2</SelectItem>
                  <SelectItem value="Turno3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipo && <p className="text-red-500 text-xs mt-1">{form.formState.errors.tipo.message}</p>}
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea {...form.register("descripcion")} />
              {form.formState.errors.descripcion && <p className="text-red-500 text-xs mt-1">{form.formState.errors.descripcion.message}</p>}
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
