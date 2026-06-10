import { z } from "zod";

export const purgaSchema = z.object({
  tanque: z.string().min(1, "El tanque es requerido"),
  numero: z.coerce.number().min(1, "Debe ser al menos 1").max(8, "Máximo 8"),
  fechaHora: z.string().min(1, "La fecha y hora son requeridas"),
  tiempo: z.coerce.number().min(1, "Debe ser al menos 1 minuto"),
  realiza: z.string().min(1, "Introduce las iniciales de quien realiza"),
});

export type PurgaFormValues = z.infer<typeof purgaSchema>;

export const agendaSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fin: z.string().min(1, "La fecha de fin es requerida"),
  tipo: z.enum(["Turno1", "Turno2", "Turno3"], { required_error: "Selecciona un tipo" }),
  descripcion: z.string().optional(),
});

export type AgendaFormValues = z.infer<typeof agendaSchema>;
