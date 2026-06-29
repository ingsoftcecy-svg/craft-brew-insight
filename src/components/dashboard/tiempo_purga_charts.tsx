import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { PurgaRow } from "@/types/proceso";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TiempoPurgaChartsProps {
  purgas: PurgaRow[];
}

export function TiempoPurgaCharts({ purgas }: TiempoPurgaChartsProps) {
  const [filtroTanque, setFiltroTanque] = useState<string>("todos");
  const [filtroMarca, setFiltroMarca] = useState<string>("todas");

  // Obtener opciones únicas
  const tanquesUnicos = useMemo(() => Array.from(new Set(purgas.map(p => p.tanque))).sort(), [purgas]);
  const marcasUnicas = useMemo(() => Array.from(new Set(purgas.map(p => p.marca))).sort(), [purgas]);

  const { porDia, porSemana, porMes } = useMemo(() => {
    // Filtrar purgas según los selectores
    const purgasFiltradas = purgas.filter(p => {
      const cumpleTanque = filtroTanque === "todos" || p.tanque === filtroTanque;
      const cumpleMarca = filtroMarca === "todas" || p.marca === filtroMarca;
      return cumpleTanque && cumpleMarca;
    });

    // 1. Extraer todos los tiempos de purga válidos
    const todosTiempos = purgasFiltradas.flatMap((p) =>
      p.purgas
        .filter((purge) => purge.tiempo != null && purge.tiempo > 0 && purge.fechaHora)
        .map((purge) => ({
          tiempo: purge.tiempo!,
          fecha: parseISO(purge.fechaHora!),
        }))
    ).filter((p) => isValid(p.fecha));

    // Función auxiliar para agrupar y promediar
    const agruparYPromediar = (
      agrupador: (fecha: Date) => string,
      formateadorEtiqueta: (key: string) => string
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
      }
    );

    // Agrupación por Semana (ej. 2026-W16)
    const porSemana = agruparYPromediar(
      (f) => format(f, "yyyy-II"), // ISO week year - ISO week (e.g. 2026-16)
      (k) => {
        const [, week] = k.split("-");
        return week.replace(/^0/, ''); // Remover 0 a la izquierda, ej. "16"
      }
    );

    // Agrupación por Mes (ej. 2026-06)
    const porMes = agruparYPromediar(
      (f) => format(f, "yyyy-MM"),
      (k) => {
        const d = parseISO(`${k}-01`);
        return format(d, "MMMM yyyy", { locale: es }).toUpperCase();
      }
    );

    return { porDia, porSemana, porMes };
  }, [purgas, filtroTanque, filtroMarca]);

  // Componente interno para evitar repetir el JSX del estilo de gráfica
  const ChartPanel = ({ title, data }: { title: string; data: any[] }) => {
    return (
      <div className="flex flex-col border border-slate-200 bg-white shadow-sm h-[320px] rounded-xl overflow-hidden">
        {/* Encabezado */}
        <div className="bg-slate-800 text-white text-center py-2 font-bold text-sm tracking-wider px-2 line-clamp-1">
          {title}
        </div>
        <div className="bg-slate-100 text-slate-600 border-b border-slate-200 text-center py-1 text-xs font-bold tracking-widest">
          MINUTOS
        </div>
        
        {/* Gráfica */}
        <div className="flex-1 p-2 bg-white relative">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="etiqueta" 
                  tick={{ fontSize: 10 }} 
                  axisLine={{ stroke: "#e2e8f0" }} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 15]} 
                  tick={{ fontSize: 11 }} 
                  axisLine={{ stroke: "#e2e8f0" }} 
                  tickLine={false} 
                />
                
                {/* Zonas de control */}
                <ReferenceArea y1={1} y2={7} fill="#bbf7d0" fillOpacity={0.6} />
                <ReferenceArea y1={7} y2={15} fill="#fecaca" fillOpacity={0.6} />
                <ReferenceArea y1={0} y2={1} fill="#fecaca" fillOpacity={0.6} />
                
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Tiempos de Purga de Trub</CardTitle>
            <CardDescription>Análisis de tendencia por día, semana y mes</CardDescription>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Tanque</Label>
              <Select value={filtroTanque} onValueChange={setFiltroTanque}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tanquesUnicos.map(t => (
                    <SelectItem key={t} value={t}>T-{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Marca</Label>
              <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {marcasUnicas.map(m => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
