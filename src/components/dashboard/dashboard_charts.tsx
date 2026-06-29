import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseMexicanDate } from "@/lib/utils";

const BAR_COLORS = [
  "#f59e0b", "#d97706", "#b45309", "#92400e",
  "#0ea5e9", "#0284c7", "#0369a1",
  "#10b981", "#059669",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary font-bold mt-0.5">{payload[0].value} registros</p>
      </div>
    );
  }
  return null;
};

interface DashboardChartsProps {
  extractos: any[];
  periodosStats: any[];
}

export function DashboardCharts({ extractos, periodosStats }: DashboardChartsProps) {
  const [tipoGrafica, setTipoGrafica] = useState<"marca" | "mes">("marca");
  const [mesFiltro, setMesFiltro] = useState<string>("todos");

  // Meses disponibles a partir de fechaLlenado
  const mesesDisponibles = useMemo(() => {
    const seen = new Map<string, string>();
    extractos.forEach(e => {
      if (!e.fechaLlenado) return;
      const d = parseMexicanDate(e.fechaLlenado);
      if (!d) return;
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMMM yyyy", { locale: es });
      if (!seen.has(key)) seen.set(key, label);
    });
    return Array.from(seen.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
  }, [extractos]);

  // Extractos filtrados por mes 
  const extractosFiltrados = useMemo(() => {
    if (mesFiltro === "todos") return extractos;
    return extractos.filter(e => {
      if (!e.fechaLlenado) return false;
      const d = parseMexicanDate(e.fechaLlenado);
      if (!d) return false;
      return format(d, "yyyy-MM") === mesFiltro;
    });
  }, [extractos, mesFiltro]);

  // Contar por marca dentro del mes seleccionado
  const brandCounts = useMemo(() => {
    return extractosFiltrados.reduce((acc, curr) => {
      acc[curr.marca] = (acc[curr.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [extractosFiltrados]);

  const chartDataMarca = useMemo(() => {
    return Object.entries(brandCounts)
      .map(([marca, total]) => ({ 
        name: String(marca).toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
        total: total as number
      }))
      .sort((a, b) => b.total - a.total);
  }, [brandCounts]);

  const chartDataMes = useMemo(() => {
    return [...periodosStats].sort((a, b) => a.periodo.localeCompare(b.periodo)).map(p => {
      const [y, m] = p.periodo.split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      const mesStr = date.toLocaleString("es-MX", { month: "short", year: "2-digit" });
      return { name: mesStr.charAt(0).toUpperCase() + mesStr.slice(1), total: p.totalRegistros };
    });
  }, [periodosStats]);

  const chartData = tipoGrafica === "marca" ? chartDataMarca : chartDataMes;

  const totalRegistrosActual = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  return (
    <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle 
              className="text-xl font-bold text-slate-800 flex items-center gap-2 cursor-pointer" 
              onClick={() => setTipoGrafica(tipoGrafica === "marca" ? "mes" : "marca")}
            >
              <TrendingUp className="h-5 w-5 text-slate-500" />
              {tipoGrafica === "marca" ? "Distribución por Marca" : "Distribución por Meses"}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Registros consolidados del proceso de fermentación</p>
          </div>
          {tipoGrafica === "marca" && (
            <select
              value={mesFiltro}
              onChange={e => setMesFiltro(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todos">Todos los meses</option>
              {mesesDisponibles.map(m => (
                <option key={m.key} value={m.key} className="capitalize">{m.label}</option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-2 px-2">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                dy={10}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
              />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={50}
                animationDuration={1500}
                animationEasing="ease-out"
                activeBar={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 pl-4 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          Total de registros: <span className="font-bold text-foreground text-sm">{totalRegistrosActual}</span>
        </div>
      </CardContent>
    </Card>
  );
}
