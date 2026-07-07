import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { PurgaRow } from "@/types/proceso";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TiempoPurgaChartsProps {
  purgas: PurgaRow[];
}

function getTipoTanque(tanqueStr: string): string | null {
  if (!tanqueStr) return null;
  const numMatch = tanqueStr.match(/\d+/);
  if (!numMatch) return null;
  const num = parseInt(numMatch[0], 10);
  if (num >= 1 && num <= 22) return "C";
  if (num >= 23 && num <= 38) return "B";
  if (num >= 39 && num <= 50) return "A";
  if (num >= 51 && num <= 140) return "A prima";
  return null;
}

export function TiempoPurgaCharts({ purgas }: TiempoPurgaChartsProps) {
  const [filtroTanque, setFiltroTanque] = useState<string>("todos");
  const [filtroMarca, setFiltroMarca] = useState<string>("todas");
  const [filtroTipoTanque, setFiltroTipoTanque] = useState<string>("todos");
  const [mesFiltro, setMesFiltro] = useState<string>("todos");

  // Obtener opciones únicas
  const tanquesUnicos = useMemo(
    () => Array.from(new Set(purgas.map((p) => p.tanque))).sort(),
    [purgas],
  );
  const marcasUnicas = useMemo(
    () => Array.from(new Set(purgas.map((p) => p.marca))).sort(),
    [purgas],
  );

  const mesesDisponibles = useMemo(() => {
    const todosTiempos = purgas
      .flatMap((p) => p.purgas.map((purge) => purge.fechaHora))
      .filter(Boolean) as string[];
    const setMeses = new Set<string>();
    todosTiempos.forEach((t) => {
      const d = parseISO(t);
      if (isValid(d)) setMeses.add(format(d, "yyyy-MM"));
    });
    return Array.from(setMeses)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        const d = parseISO(`${m}-01`);
        return { key: m, label: format(d, "MMMM yyyy", { locale: es }) };
      });
  }, [purgas]);

  const { porDia, porSemana, porMes } = useMemo(() => {
    // Filtrar purgas según los selectores
    const purgasFiltradas = purgas.filter((p) => {
      const cumpleTanque = filtroTanque === "todos" || p.tanque === filtroTanque;
      const cumpleMarca = filtroMarca === "todas" || p.marca === filtroMarca;
      const cumpleTipo = filtroTipoTanque === "todos" || getTipoTanque(p.tanque) === filtroTipoTanque;
      return cumpleTanque && cumpleMarca && cumpleTipo;
    });

    // 1. Extraer todos los tiempos de purga válidos
    const todosTiempos = purgasFiltradas
      .flatMap((p) =>
        p.purgas
          .filter((purge) => purge.tiempo != null && purge.tiempo > 0 && purge.fechaHora)
          .map((purge) => ({
            tiempo: purge.tiempo!,
            fecha: parseISO(purge.fechaHora!),
          })),
      )
      .filter((p) => isValid(p.fecha) && (mesFiltro === "todos" || format(p.fecha, "yyyy-MM") === mesFiltro));

    // Función auxiliar para agrupar y promediar
    const agruparYPromediar = (
      agrupador: (fecha: Date) => string,
      formateadorEtiqueta: (key: string) => string,
    ) => {
      const grupos: Record<string, number[]> = {};

      todosTiempos.forEach(({ tiempo, fecha }) => {
        const key = agrupador(fecha);
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(tiempo);
      });

      return Object.entries(grupos)
        .sort((a, b) => a[0].localeCompare(b[0])) // Orden cronológico de las keys
        .map(([key, tiempos]) => {
          const suma = tiempos.reduce((a, b) => a + b, 0);
          const promedio = suma / tiempos.length;
          return {
            etiqueta: formateadorEtiqueta(key),
            promedio: Number(promedio.toFixed(2)), // Redondeado a 2 decimales
          };
        });
    };

    // Agrupación por Día (ej. 2026-06-17)
    const porDia = agruparYPromediar(
      (f) => format(f, "yyyy-MM-dd"),
      (k) => {
        const d = parseISO(k);
        return format(d, "dd/MM/yyyy"); // ej. 17/04/2026
      },
    );

    // Agrupación por Semana (ej. 2026-W16)
    const porSemana = agruparYPromediar(
      (f) => format(f, "yyyy-II"), // ISO week year - ISO week (e.g. 2026-16)
      (k) => {
        const [, week] = k.split("-");
        return week.replace(/^0/, ""); // Remover 0 a la izquierda, ej. "16"
      },
    );

    // Agrupación por Mes (ej. 2026-06)
    const porMes = agruparYPromediar(
      (f) => format(f, "yyyy-MM"),
      (k) => {
        const d = parseISO(`${k}-01`);
        return format(d, "MMMM yyyy", { locale: es }).toUpperCase();
      },
    );

    return { porDia, porSemana, porMes };
  }, [purgas, filtroTanque, filtroMarca, filtroTipoTanque, mesFiltro]);

  // Componente interno para evitar repetir el JSX del estilo de gráfica
  const ChartPanel = ({ title, data }: { title: string; data: any[] }) => {
    return (
      <div className="flex flex-col h-[320px] w-full relative">
        <div className="mb-4 pl-2">
          <h3 className="text-sm font-bold text-slate-700 capitalize">{title.toLowerCase()}</h3>
          <p className="text-xs text-slate-500">Promedio en minutos</p>
        </div>

        {/* Gráfica */}
        <div className="flex-1 w-full relative">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 40, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="etiqueta"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 15]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />

                {/* Zonas de control */}
                <ReferenceArea y1={1} y2={7} fill="#bbf7d0" fillOpacity={0.6} />
                <ReferenceArea y1={7} y2={15} fill="#fecaca" fillOpacity={0.6} />
                <ReferenceArea y1={0} y2={1} fill="#fecaca" fillOpacity={0.6} />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [`${value} min`, "Promedio"]}
                />

                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#334155"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ r: 4, fill: "#7b98d5", strokeWidth: 2, stroke: "#ffffff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              Tiempos de Purga de Trub
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Análisis de tendencia por día, semana y mes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroTanque}
              onChange={(e) => setFiltroTanque(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todos">Todos los tanques</option>
              {tanquesUnicos.map((t) => (
                <option key={t} value={t}>
                  {t.replace("T-", "")}
                </option>
              ))}
            </select>

            <select
              value={filtroTipoTanque}
              onChange={(e) => setFiltroTipoTanque(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todos">Todos los tipos</option>
              <option value="A prima">A prima (51-140)</option>
              <option value="A">A (39-50)</option>
              <option value="B">B (23-38)</option>
              <option value="C">C (1-22)</option>
            </select>

            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todas">Todas las marcas</option>
              {marcasUnicas.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todos">Todos los meses</option>
              {mesesDisponibles.map((m) => (
                <option key={m.key} value={m.key} className="capitalize">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <ChartPanel title="PURGADO DE TRUB POR DÍA" data={porDia} />
          <ChartPanel title="PURGADO DE TRUB POR SEMANA" data={porSemana} />
          <ChartPanel title="PURGADO DE TRUB POR MES" data={porMes} />
        </div>
      </CardContent>
    </Card>
  );
}
