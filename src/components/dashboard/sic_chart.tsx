import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PurgaRow } from "@/types/proceso";
import { format } from "date-fns";

const PURGA_COLORS = [
  "#f43f5e", // Inicial
  "#f97316", // P1
  "#eab308", // P2
  "#84cc16", // P3
  "#10b981", // P4
  "#06b6d4", // P5
  "#3b82f6", // P6
  "#8b5cf6", // P7
  "#d946ef", // P8
];

interface SicChartProps {
  purgas: PurgaRow[];
}

export function SicChart({ purgas }: SicChartProps) {
  const chartData = useMemo(() => {
    let data: any[] = [];
    
    // Sort purgas by date for timeline
    const sorted = [...purgas].sort((a, b) => new Date(a.fechaLlenado).getTime() - new Date(b.fechaLlenado).getTime());

    sorted.forEach((p, index) => {
      p.purgas.forEach((purga, i) => {
        if (purga.tiempo != null && purga.tiempo > 0) {
          data.push({
            id: `${p.tanque}-P${i}`,
            tankIndex: index,
            tanque: p.tanque,
            marca: p.marca,
            purgaIndex: i,
            nombrePurga: i === 0 ? "Inicial" : `P${i}`,
            tiempoMinutos: purga.tiempo,
            tiempoLlenado: p.tiempoLlenadoHoras,
            fechaLlenado: p.fechaLlenado
          });
        }
      });
    });
    return data;
  }, [purgas]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm z-50">
          <p className="font-bold text-slate-800 border-b pb-1 mb-1">Tanque: {data.tanque}</p>
          <p className="text-slate-600">Marca: <span className="font-semibold text-slate-900">{data.marca}</span></p>
          <p className="text-slate-600">Tiempo Llenado: <span className="font-semibold text-blue-600">{data.tiempoLlenado != null ? `${data.tiempoLlenado} hrs` : "N/A"}</span></p>
          <p className="text-slate-600 mt-2 pt-1 border-t">Purga: <span className="font-bold text-slate-900">{data.nombrePurga}</span></p>
          <p className="text-slate-600">Duración: <span className="font-bold text-amber-600">{data.tiempoMinutos} min</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-slate-800">Gráfica SIC - Tiempos de Purga de Trub</CardTitle>
        <CardDescription>Monitoreo detallado de minutos de purga por cada tanque</CardDescription>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No hay datos de purgas para graficar
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="category" 
                  dataKey="tanque" 
                  name="Tanque"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  allowDuplicatedCategory={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="tiempoMinutos" 
                  name="Minutos" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                
                {/* Agrupamos por Purga Index para poder mostrarlos en la leyenda */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const dataForIndex = chartData.filter(d => d.purgaIndex === i);
                  if (dataForIndex.length === 0) return null;
                  return (
                    <Scatter 
                      key={`purga-${i}`} 
                      name={i === 0 ? "Inicial" : `P${i}`} 
                      data={dataForIndex} 
                      fill={PURGA_COLORS[i % PURGA_COLORS.length]}
                    >
                      {dataForIndex.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PURGA_COLORS[entry.purgaIndex % PURGA_COLORS.length]} />
                      ))}
                    </Scatter>
                  );
                })}
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
