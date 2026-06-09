import {
  collection,
  doc,
  writeBatch,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { ExtractoRow } from "@/types/proceso";
import { obtenerPeriodo, type UploadProgress } from "./purgasFirebaseService";

const BATCH_SIZE = 500;
const COLECCION_EXTRACTOS = "extractos_historico";

export async function guardarExtractosEnFirestore(
  filas: ExtractoRow[],
  periodo: string,
  onProgress?: (p: UploadProgress) => void
): Promise<{ exito: boolean; total: number; mensaje: string }> {
  const total = filas.length;

  if (total === 0) {
    return { exito: false, total: 0, mensaje: "No hay filas para guardar." };
  }

  try {
    const periodoDocRef = doc(firestore, COLECCION_EXTRACTOS, periodo);
    await setDoc(
      periodoDocRef,
      {
        periodo,
        totalRegistros: total,
        fechaSubida: Timestamp.now(),
        actualizadoEn: Timestamp.now(),
      },
      { merge: true }
    );

    const registrosRef = collection(periodoDocRef, "registros");

    onProgress?.({
      total,
      escritos: 0,
      porcentaje: 0,
      fase: "limpiando",
      mensaje: "Eliminando registros anteriores del periodo...",
    });

    const snapshotAnterior = await getDocs(registrosRef);
    const batchesEliminar: ReturnType<typeof writeBatch>[] = [];
    let batchActual = writeBatch(firestore);
    let contadorEliminar = 0;

    snapshotAnterior.forEach((docSnap) => {
      batchActual.delete(docSnap.ref);
      contadorEliminar++;
      if (contadorEliminar % BATCH_SIZE === 0) {
        batchesEliminar.push(batchActual);
        batchActual = writeBatch(firestore);
      }
    });

    if (contadorEliminar % BATCH_SIZE !== 0) {
      batchesEliminar.push(batchActual);
    }

    for (const b of batchesEliminar) {
      await b.commit();
    }

    let escritos = 0;
    const batchesEscribir: ReturnType<typeof writeBatch>[] = [];
    let batchEscritura = writeBatch(firestore);

    for (let i = 0; i < total; i++) {
      const fila = filas[i];
      const docRef = doc(registrosRef, fila.id);

      batchEscritura.set(docRef, {
        ...fila,
        creadoEn: Timestamp.now(),
      });

      escritos++;

      if (escritos % BATCH_SIZE === 0) {
        batchesEscribir.push(batchEscritura);
        batchEscritura = writeBatch(firestore);

        await batchesEscribir[batchesEscribir.length - 1].commit();

        onProgress?.({
          total,
          escritos,
          porcentaje: Math.round((escritos / total) * 100),
          fase: "subiendo",
          mensaje: `Subiendo ${escritos} de ${total} registros...`,
        });
      }
    }

    if (escritos % BATCH_SIZE !== 0) {
      await batchEscritura.commit();
    }

    onProgress?.({
      total,
      escritos: total,
      porcentaje: 100,
      fase: "completado",
      mensaje: `¡Listo! ${total} registros guardados en periodo ${periodo}.`,
    });

    return {
      exito: true,
      total,
      mensaje: `Se guardaron ${total} registros en el periodo ${periodo}.`,
    };
  } catch (error: any) {
    onProgress?.({
      total,
      escritos: 0,
      porcentaje: 0,
      fase: "error",
      mensaje: error.message || "Error al escribir en Firestore.",
    });

    return {
      exito: false,
      total: 0,
      mensaje: error.message || "Error al escribir en Firestore.",
    };
  }
}

export async function obtenerExtractosPorPeriodo(
  periodo: string
): Promise<ExtractoRow[]> {
  const periodoDocRef = doc(firestore, COLECCION_EXTRACTOS, periodo);
  const registrosRef = collection(periodoDocRef, "registros");
  const snapshot = await getDocs(registrosRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tanque: data.tanque ?? "",
      marca: data.marca ?? "Modelo Especial",
      fechaLlenado: data.fechaLlenado ?? "",
      h24: data.h24 ?? null,
      h48: data.h48 ?? null,
      h72: data.h72 ?? null,
      h96: data.h96 ?? null,
      h120: data.h120 ?? null,
      h144: data.h144 ?? null,
      estado: data.estado ?? "En Rango",
    } as ExtractoRow;
  });
}

export interface PeriodoResumenExtracto {
  periodo: string;
  totalRegistros: number;
  fechaSubida: Date;
}

export async function listarPeriodosExtractos(): Promise<PeriodoResumenExtracto[]> {
  const colRef = collection(firestore, COLECCION_EXTRACTOS);
  const snapshot = await getDocs(colRef);

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        periodo: d.id,
        totalRegistros: data.totalRegistros ?? 0,
        fechaSubida: data.fechaSubida?.toDate?.() ?? new Date(),
      };
    })
    .sort((a, b) => b.periodo.localeCompare(a.periodo));
}

export async function actualizarExtractoEnFirestore(
  periodo: string,
  id: string,
  data: Partial<ExtractoRow>
): Promise<void> {
  const docRef = doc(firestore, COLECCION_EXTRACTOS, periodo, "registros", id);
  await setDoc(docRef, { ...data, actualizadoEn: Timestamp.now() }, { merge: true });
}
