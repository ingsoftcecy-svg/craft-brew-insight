import {
  collection,
  doc,
  writeBatch,
  getDocs,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { AgendaEvent } from "@/types/proceso";

const BATCH_SIZE = 500;
const COLECCION_AGENDA = "agenda_eventos";

export async function limpiarEventosAutoGeneradosViejos(): Promise<void> {
  const colRef = collection(firestore, COLECCION_AGENDA);
  const snapshot = await getDocs(colRef);
  const batch = writeBatch(firestore);
  let count = 0;

  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (d.id && String(d.id).startsWith("ev-auto-ext-")) {
      batch.delete(d.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
}

export async function guardarEventosEnFirestore(
  eventos: AgendaEvent[]
): Promise<{ exito: boolean; guardados: number; mensaje: string }> {
  const total = eventos.length;

  if (total === 0) {
    return { exito: true, guardados: 0, mensaje: "No hay eventos para guardar." };
  }

  try {
    const colRef = collection(firestore, COLECCION_AGENDA);

    let escritos = 0;
    const batchesEscribir: ReturnType<typeof writeBatch>[] = [];
    let batchEscritura = writeBatch(firestore);

    for (let i = 0; i < total; i++) {
      const evento = eventos[i];
      const docRef = doc(colRef, evento.id); // Usamos el ID generado localmente

      batchEscritura.set(docRef, {
        ...evento,
        creadoEn: Timestamp.now(),
      }, { merge: true }); // Usamos merge para actualizar si ya existe

      escritos++;

      if (escritos % BATCH_SIZE === 0) {
        batchesEscribir.push(batchEscritura);
        batchEscritura = writeBatch(firestore);
        await batchesEscribir[batchesEscribir.length - 1].commit();
      }
    }

    if (escritos % BATCH_SIZE !== 0) {
      await batchEscritura.commit();
    }

    return {
      exito: true,
      guardados: total,
      mensaje: `Se guardaron ${total} eventos en la agenda.`,
    };
  } catch (error: any) {
    return {
      exito: false,
      guardados: 0,
      mensaje: error.message || "Error al escribir en Firestore.",
    };
  }
}

export async function obtenerEventosAgenda(): Promise<AgendaEvent[]> {
  const colRef = collection(firestore, COLECCION_AGENDA);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      titulo: data.titulo ?? "",
      inicio: data.inicio ?? "",
      fin: data.fin ?? "",
      tipo: data.tipo ?? "Turno",
      descripcion: data.descripcion ?? "",
      turno: data.turno,
    } as AgendaEvent;
  });
}
