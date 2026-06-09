import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { PurgaRow } from "@/types/proceso";

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────

/** Firestore tiene un límite de 500 operaciones por batch */
const BATCH_SIZE = 500;

/** Nombre de la colección raíz en Firestore */
const COLECCION_PURGAS = "purgas_historico";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Genera un ID de periodo con formato "YYYY-MM" a partir de una fecha.
 * Ejemplo: "2026-06"
 */
export function obtenerPeriodo(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─────────────────────────────────────────────────────────────
// Guardar purgas (batch write)
// ─────────────────────────────────────────────────────────────

export interface UploadProgress {
  total: number;
  escritos: number;
  porcentaje: number;
  fase: "limpiando" | "subiendo" | "completado" | "error";
  mensaje: string;
}

/**
 * Sube un arreglo de PurgaRow a Firestore dentro de la sub-colección
 * del periodo mensual correspondiente.
 *
 * Estructura en Firestore:
 *   purgas_historico/{periodo}/registros/{docId}
 *
 * Donde {periodo} = "2026-06", etc.
 *
 * @param filas     - Arreglo de PurgaRow ya limpias
 * @param periodo   - Clave de periodo "YYYY-MM"
 * @param onProgress - Callback opcional para reportar progreso
 */
export async function guardarPurgasEnFirestore(
  filas: PurgaRow[],
  periodo: string,
  onProgress?: (p: UploadProgress) => void
): Promise<{ exito: boolean; total: number; mensaje: string }> {
  const total = filas.length;

  if (total === 0) {
    return { exito: false, total: 0, mensaje: "No hay filas para guardar." };
  }

  try {
    // 1️⃣ Crear/actualizar el documento del periodo con metadatos
    const periodoDocRef = doc(firestore, COLECCION_PURGAS, periodo);
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

    // 2️⃣ Referencia a la sub-colección de registros
    const registrosRef = collection(periodoDocRef, "registros");

    // 3️⃣ Eliminar registros anteriores del mismo periodo (reemplazo completo)
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

    // 4️⃣ Escribir las nuevas filas en lotes de BATCH_SIZE
    let escritos = 0;
    const batchesEscribir: ReturnType<typeof writeBatch>[] = [];
    let batchEscritura = writeBatch(firestore);

    for (let i = 0; i < total; i++) {
      const fila = filas[i];
      const docRef = doc(registrosRef, fila.id);

      batchEscritura.set(docRef, {
        ...fila,
        // Convertimos las purgas a un formato serializable plano
        purgas: fila.purgas.map((p) => ({
          fechaHora: p.fechaHora ?? null,
          tiempo: p.tiempo ?? null,
          realiza: p.realiza ?? null,
        })),
        creadoEn: Timestamp.now(),
      });

      escritos++;

      if (escritos % BATCH_SIZE === 0) {
        batchesEscribir.push(batchEscritura);
        batchEscritura = writeBatch(firestore);

        // Commitear inmediatamente para liberar memoria
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

    // Commit del último batch parcial
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

// ─────────────────────────────────────────────────────────────
// Leer purgas de un periodo
// ─────────────────────────────────────────────────────────────

/**
 * Obtiene todas las purgas de un periodo mensual desde Firestore.
 */
export async function obtenerPurgasPorPeriodo(
  periodo: string
): Promise<PurgaRow[]> {
  const periodoDocRef = doc(firestore, COLECCION_PURGAS, periodo);
  const registrosRef = collection(periodoDocRef, "registros");
  const snapshot = await getDocs(registrosRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tanque: data.tanque ?? "",
      fecha: data.fecha ?? "",
      marca: data.marca ?? "Modelo Especial",
      fechaLlenado: data.fechaLlenado ?? "",
      horas: data.horas ?? "0",
      historicas: data.historicas ?? "0",
      purgas: (data.purgas ?? []).map((p: any) => ({
        fechaHora: p.fechaHora ?? null,
        tiempo: p.tiempo ?? null,
        realiza: p.realiza ?? null,
      })),
    } as PurgaRow;
  });
}

// ─────────────────────────────────────────────────────────────
// Listar periodos disponibles
// ─────────────────────────────────────────────────────────────

export interface PeriodoResumen {
  periodo: string;
  totalRegistros: number;
  fechaSubida: Date;
}

/**
 * Obtiene la lista de todos los periodos mensuales que se han subido.
 */
export async function listarPeriodos(): Promise<PeriodoResumen[]> {
  const colRef = collection(firestore, COLECCION_PURGAS);
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
