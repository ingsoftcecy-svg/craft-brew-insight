import React, { useState, useCallback } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Database,
  Trash2,
  CalendarDays,
} from "lucide-react";
import * as XLSX from "xlsx";
import { obtenerTurnoPorHora } from "@/data/turno";
import {
  guardarPurgasEnFirestore,
  obtenerPeriodo,
  type UploadProgress,
} from "@/lib/api/purgasFirebaseService";
import type { PurgaRow, PurgaEntry, MarcaCerveza } from "@/types/proceso";

// ─────────────────────────────────────────────────────────────
// Columnas válidas que se conservan del xlsx
// ─────────────────────────────────────────────────────────────
const COLUMNAS_REQUERIDAS = new Set([
  "TANQUE",
  "FECHA_LLENADO",
  "MARCA",
]);

/** Genera las llaves dinámicas PURGA1..8, TIEMPO1..8, REALIZA1..8 */
function generarColumnasNumeradas(): Set<string> {
  const s = new Set<string>();
  for (let i = 1; i <= 8; i++) {
    s.add(`PURGA${i}`);
    s.add(`TIEMPO${i}`);
    s.add(`REALIZA${i}`);
  }
  return s;
}

const COLUMNAS_NUMERADAS = generarColumnasNumeradas();
const TODAS_LAS_COLUMNAS = new Set([...COLUMNAS_REQUERIDAS, ...COLUMNAS_NUMERADAS]);

const MARCAS_VALIDAS: MarcaCerveza[] = [
  "Corona",
  "Corona Extra",
  "Corona C",
  "Corona Golden Light",
  "Victoria",
  "Negra Modelo",
  "Modelo Especial",
  "Bud Light",
  "Bud Light Chelada",
  "Pacifico",
];

// ─────────────────────────────────────────────────────────────
// Helpers de limpieza
// ─────────────────────────────────────────────────────────────

/**
 * Normaliza una llave de Excel: quita espacios, acento, pasa a MAYÚSCULAS
 * y reemplaza espacios intermedios con guion bajo.
 */
function normalizarLlave(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

/**
 * Convierte un valor de fecha de Excel (número serial o cadena) a Date.
 * Retorna null si no puede parsear.
 */
function parsearFechaExcel(valor: any): Date | null {
  if (valor == null || valor === "") return null;

  const str = String(valor).trim();

  // Número de serie de Excel (e.g. 46180)
  if (!isNaN(Number(str)) && Number(str) > 30000) {
    const utcDate = new Date((Number(str) - 25569) * 86400 * 1000);
    return new Date(utcDate.getTime() + Math.abs(utcDate.getTimezoneOffset()) * 60000);
  }

  // Formato con diagonales: dd/mm/yyyy o dd/mm/yy HH:MM
  if (str.includes("/")) {
    const parts = str.split(" ");
    const fechaPart = parts[0];
    const horaPart = parts[1];
    
    const isPM = str.toLowerCase().includes("pm");
    const isAM = str.toLowerCase().includes("am");

    const partes = fechaPart.split("/");
    const d = Number(partes[0]);
    const m = Number(partes[1]) - 1;
    let y = Number(partes[2]);
    if (y < 100) y += 2000;

    const fecha = new Date(y, m, d);

    // Si hay parte de hora, la agregamos
    if (horaPart) {
      let [hh, mm] = horaPart.split(":").map(Number);
      if (isPM && hh < 12) hh += 12;
      if (isAM && hh === 12) hh = 0;
      
      if (!isNaN(hh)) fecha.setHours(hh);
      if (!isNaN(mm)) fecha.setMinutes(mm);
    }

    return isNaN(fecha.getTime()) ? null : fecha;
  }

  // Formato con guiones: yyyy-mm-dd o dd-mm-yyyy
  if (str.includes("-")) {
    const [fechaPart, horaPart] = str.split(" ");
    const partes = fechaPart.split("-");
    let fecha: Date;

    if (partes[0].length === 4) {
      fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    } else {
      let y = Number(partes[2]);
      if (y < 100) y += 2000;
      fecha = new Date(y, Number(partes[1]) - 1, Number(partes[0]));
    }

    if (horaPart) {
      const [hh, mm] = horaPart.split(":").map(Number);
      if (!isNaN(hh)) fecha.setHours(hh);
      if (!isNaN(mm)) fecha.setMinutes(mm);
    }

    return isNaN(fecha.getTime()) ? null : fecha;
  }

  // Último intento: Date nativo
  const intentoNativo = new Date(str);
  return isNaN(intentoNativo.getTime()) ? null : intentoNativo;
}

// ─────────────────────────────────────────────────────────────
// Procesamiento de archivo – limpia + mapea
// ─────────────────────────────────────────────────────────────

interface ResultadoLimpieza {
  filas: PurgaRow[];
  totalOriginal: number;
  descartadas: number;
  columnasDescartadas: string[];
  periodo: string;
}

function limpiarYMapear(filasJson: any[]): ResultadoLimpieza {
  const totalOriginal = filasJson.length;
  let descartadas = 0;
  const columnasDescartadasSet = new Set<string>();
  let periodoDetectado: string | null = null;

  // Detectar columnas que se van a descartar (del primer registro)
  if (filasJson.length > 0) {
    Object.keys(filasJson[0]).forEach((k) => {
      const normalizada = normalizarLlave(k);
      if (!TODAS_LAS_COLUMNAS.has(normalizada)) {
        columnasDescartadasSet.add(k);
      }
    });
  }

  const filasLimpias: PurgaRow[] = [];

  for (let idx = 0; idx < filasJson.length; idx++) {
    const filaOriginal = filasJson[idx];

    // 1️⃣ Normalizar llaves y filtrar solo las columnas necesarias
    const fila: Record<string, any> = {};
    Object.keys(filaOriginal).forEach((llave) => {
      const normalizada = normalizarLlave(llave);
      if (TODAS_LAS_COLUMNAS.has(normalizada) || normalizada === "FERMENTADOR") {
        fila[normalizada] = filaOriginal[llave];
      }
    });

    const tanqueOriginal = fila.TANQUE || fila.FERMENTADOR;
    // 2️⃣ Descartar filas sin tanque (filas vacías)
    if (!tanqueOriginal || String(tanqueOriginal).trim() === "") {
      descartadas++;
      continue;
    }

    // 3️⃣ Parsear fecha de llenado
    const fechaParsed = parsearFechaExcel(fila.FECHA_FIN_DE_LLENADO || fila.FECHA_DE_LLENADO || fila.FECHA_LLENADO || fila.FECHADOR);
    const fechaLlenado = fechaParsed ? fechaParsed.toISOString() : "";

    // Detectar el periodo del primer registro válido
    if (!periodoDetectado && fechaParsed) {
      periodoDetectado = obtenerPeriodo(fechaParsed);
    }

    // 4️⃣ Validar marca
    const marcaRaw = String(fila.MARCA || "").trim();
    const marca: MarcaCerveza = MARCAS_VALIDAS.includes(marcaRaw as MarcaCerveza)
      ? (marcaRaw as MarcaCerveza)
      : "Modelo Especial";

    // 5️⃣ Mapear las 8 purgas
    const listaPurgas: PurgaEntry[] = [];

    for (let i = 1; i <= 8; i++) {
      const fechaHoraRaw = fila[`PURGA${i}`];
      const tiempoRaw = fila[`TIEMPO${i}`];
      const realizaRaw = fila[`REALIZA${i}`];

      let fechaHora: string | null = null;
      if (fechaHoraRaw != null && String(fechaHoraRaw).trim() !== "") {
        const fechaPurga = parsearFechaExcel(fechaHoraRaw);
        fechaHora = fechaPurga ? fechaPurga.toISOString() : String(fechaHoraRaw);
      } else if (fechaParsed) {
        // Calcular sumando (i * 8) horas a la fecha de llenado
        const horasSumar = i * 8;
        const fechaCalculada = new Date(fechaParsed.getTime() + horasSumar * 60 * 60 * 1000);
        fechaHora = fechaCalculada.toISOString();
      }

      listaPurgas.push({
        fechaHora,
        tiempo: tiempoRaw != null && String(tiempoRaw).trim() !== "" ? Number(tiempoRaw) : null,
        realiza: realizaRaw != null && String(realizaRaw).trim() !== "" ? String(realizaRaw) : null,
      });
    }

    filasLimpias.push({
      id: `pr-${Date.now()}-${idx}`,
      tanque: String(tanqueOriginal).trim(),
      fecha: fechaLlenado,
      marca,
      fechaLlenado,
      horas: String(fila.HORAS || "0"),
      historicas: String(fila.PROMEDIO_DE_PURGADO || "0"),
      purgas: listaPurgas,
    });
  }

  return {
    filas: filasLimpias,
    totalOriginal,
    descartadas,
    columnasDescartadas: Array.from(columnasDescartadasSet),
    periodo: periodoDetectado || obtenerPeriodo(),
  };
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

type StatusTipo = "exito" | "error" | "leyendo";

interface StatusMsg {
  tipo: StatusTipo;
  mensaje: string;
}

export function UploadPurgas() {
  const cargarPurgasDesdeArchivo = useOperacionesStore((s) => s.cargarPurgasDesdeArchivo);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<StatusMsg | null>(null);
  const [progreso, setProgreso] = useState<UploadProgress | null>(null);
  const [resumenLimpieza, setResumenLimpieza] = useState<{
    totalOriginal: number;
    conservadas: number;
    descartadas: number;
    columnasDescartadas: string[];
    periodo: string;
  } | null>(null);

  const procesarArchivo = useCallback(
    async (file: File) => {
      setStatus({ tipo: "leyendo", mensaje: "Leyendo archivo xlsx..." });
      setProgreso(null);
      setResumenLimpieza(null);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          setStatus({ tipo: "leyendo", mensaje: "Procesando y limpiando datos..." });

          const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          let headerRowIndex = -1;
          for (let i = 0; i < aoa.length; i++) {
            const row = aoa[i];
            if (row && row.some(cell => {
              const str = String(cell).toUpperCase().trim();
              return str === "FERMENTADOR" || str === "TANQUE";
            })) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error("No se encontró la columna 'TANQUE' o 'FERMENTADOR' en el archivo.");
          }

          const filasJson = XLSX.utils.sheet_to_json(worksheet, { 
            defval: "", 
            range: headerRowIndex 
          }) as any[];

          if (!filasJson || filasJson.length === 0) {
            throw new Error("El archivo no tiene datos debajo de los encabezados.");
          }

          // ── Limpieza de datos ──
          const resultado = limpiarYMapear(filasJson);

          if (resultado.filas.length === 0) {
            throw new Error(
              "No se encontraron filas válidas. Revisa que exista la columna 'TANQUE' con datos."
            );
          }

          setResumenLimpieza({
            totalOriginal: resultado.totalOriginal,
            conservadas: resultado.filas.length,
            descartadas: resultado.descartadas,
            columnasDescartadas: resultado.columnasDescartadas,
            periodo: resultado.periodo,
          });

          // ── Cargar al store local (para visualización inmediata) ──
          cargarPurgasDesdeArchivo(resultado.filas as any[]);

          // ── Subir a Firestore ──
          setStatus({ tipo: "leyendo", mensaje: "Guardando en base de datos..." });

          const res = await guardarPurgasEnFirestore(
            resultado.filas,
            resultado.periodo,
            (p) => setProgreso(p)
          );

          if (res.exito) {
            setStatus({
              tipo: "exito",
              mensaje: `✅ ${resultado.filas.length.toLocaleString()} registros guardados en periodo ${resultado.periodo}. Se descartaron ${resultado.descartadas.toLocaleString()} filas vacías y ${resultado.columnasDescartadas.length} columnas innecesarias.`,
            });
          } else {
            throw new Error(res.mensaje);
          }
        } catch (error: any) {
          setStatus({
            tipo: "error",
            mensaje: error.message || "Error al procesar el archivo.",
          });
        }
      };

      reader.onerror = () => {
        setStatus({ tipo: "error", mensaje: "Error físico al abrir el archivo." });
      };

      reader.readAsBinaryString(file);
    },
    [cargarPurgasDesdeArchivo]
  );

  // ── Drag & Drop ──

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
    // Reset para permitir re-subir el mismo archivo
    e.target.value = "";
  };

  // ── Porcentaje visual ──
  const pct = progreso?.porcentaje ?? 0;
  const isLoading = status?.tipo === "leyendo";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Zona de Drop ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] ${
          isDragging
            ? "border-amber-500 bg-amber-500/5 scale-[1.01]"
            : isLoading
              ? "border-blue-500/40 bg-blue-500/5 pointer-events-none"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
        }`}
        onClick={() => {
          if (!isLoading) document.getElementById("file-upload-input")?.click();
        }}
      >
        <input
          id="file-upload-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="p-4 bg-background rounded-full shadow-sm border mb-3">
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-amber-500" />
          )}
        </div>

        <h3 className="font-semibold text-sm">
          {isLoading ? "Procesando archivo..." : "Importar Archivo Mensual (.xlsx)"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {isLoading
            ? "Limpiando columnas innecesarias y subiendo a la base de datos..."
            : "Suelta aquí tu archivo .xlsx. Se conservarán solo las columnas de purgas y se guardará el historial mensual en Firebase."}
        </p>
      </div>

      {/* ── Barra de progreso ── */}
      {progreso && progreso.fase !== "completado" && progreso.fase !== "error" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              {progreso.mensaje}
            </span>
            <span className="font-mono tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Resumen de limpieza ── */}
      {resumenLimpieza && status?.tipo === "exito" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <FileSpreadsheet className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold tabular-nums">{resumenLimpieza.totalOriginal.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Filas originales</p>
          </div>
          <div className="rounded-lg border bg-emerald-500/10 p-3 text-center">
            <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold tabular-nums text-emerald-600">{resumenLimpieza.conservadas.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Conservadas</p>
          </div>
          <div className="rounded-lg border bg-red-500/10 p-3 text-center">
            <Trash2 className="h-4 w-4 mx-auto mb-1 text-red-400" />
            <p className="text-lg font-bold tabular-nums text-red-500">{resumenLimpieza.descartadas.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Filas descartadas</p>
          </div>
          <div className="rounded-lg border bg-blue-500/10 p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold tabular-nums text-blue-600">{resumenLimpieza.periodo}</p>
            <p className="text-[10px] text-muted-foreground">Periodo guardado</p>
          </div>
        </div>
      )}

      {/* ── Columnas descartadas ── */}
      {resumenLimpieza && resumenLimpieza.columnasDescartadas.length > 0 && status?.tipo === "exito" && (
        <details className="text-xs text-muted-foreground border rounded-lg p-3">
          <summary className="cursor-pointer font-medium">
            {resumenLimpieza.columnasDescartadas.length} columnas descartadas del archivo original
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resumenLimpieza.columnasDescartadas.map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono"
              >
                {col}
              </span>
            ))}
          </div>
        </details>
      )}

      {/* ── Status message ── */}
      {status && (
        <div
          className={`flex items-start gap-3 p-3 text-sm rounded-lg border transition-all ${
            status.tipo === "exito"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : status.tipo === "error"
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600"
          }`}
        >
          {status.tipo === "exito" ? (
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          ) : status.tipo === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />
          )}
          <span className="font-medium leading-snug">{status.mensaje}</span>
        </div>
      )}
    </div>
  );
}
