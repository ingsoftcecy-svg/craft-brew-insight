import { useState, useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ComposedChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurgaRow } from "@/types/proceso";

interface BoxPlotChartProps {
  purgas: PurgaRow[];
}

// Cálculo de cuartiles
function getPercentile(data: number[], percentile: number) {
  if (data.length === 0) return 0;
  const index = (percentile / 100) * (data.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= data.length) return data[lower];
  return data[lower] * (1 - weight) + data[upper] * weight;
}

export function LlenadoBoxplotChart({ purgas }: BoxPlotChartProps) {
  // LSL y USL en minutos
  const [usl, setUsl] = useState<number>(120);
  const [lsl, setLsl] = useState<number>(60);

  // 1. Filtrar y calcular tiempo en minutos
  const tiemposLlenado = useMemo(() => {
    const list: { marca: string; minutos: number; tanque: string }[] = [];
    purgas.forEach(p => {
      if (p.fechaLlenado && p.fechaInicioLlenado) {
        const fin = new Date(p.fechaLlenado).getTime();
        const inicio = new Date(p.fechaInicioLlenado).getTime();
        const diffMin = (fin - inicio) / 60000;
        if (diffMin > 0 && diffMin < 1000) { // ignorar locuras de datos
          list.push({ marca: p.marca, minutos: diffMin, tanque: p.tanque });
        }
      }
    });
    return list;
  }, [purgas]);

  // 2. Agrupar por Marca y calcular BoxPlot Stats
  const chartData = useMemo(() => {
    const grupos: Record<string, number[]> = {};
    tiemposLlenado.forEach(t => {
      if (!grupos[t.marca]) grupos[t.marca] = [];
      grupos[t.marca].push(t.minutos);
    });

    const data = Object.keys(grupos).map(marca => {
      const values = grupos[marca].sort((a, b) => a - b);
      const min = values[0] || 0;
      const max = values[values.length - 1] || 0;
      const q1 = getPercentile(values, 25);
      const median = getPercentile(values, 50);
      const q3 = getPercentile(values, 75);
      
      return {
        marca,
        min: Number(min.toFixed(2)),
        q1: Number(q1.toFixed(2)),
        median: Number(median.toFixed(2)),
        q3: Number(q3.toFixed(2)),
        max: Number(max.toFixed(2)),
        count: values.length,
        // Hack para que la barra invisible tome el espacio correcto en el eje Y
        rangoMax: max
      };
    }).sort((a, b) => a.marca.localeCompare(b.marca));
    return data;
  }, [tiemposLlenado]);

  // 3. Cálculos globales de Cp, Cpk, Moda y Mediana
  const statsGlobales = useMemo(() => {
    const values = tiemposLlenado.map(t => t.minutos);
    if (values.length === 0) return { mean: 0, stdDev: 0, cp: 0, cpk: 0, median: 0, mode: 0 };
    
    // Media y Desviación
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1 || 1);
    const stdDev = Math.sqrt(variance) || 0.001;

    // Cp y Cpk
    const cpCalc = (usl - lsl) / (6 * stdDev);
    const cpkUpper = (usl - mean) / (3 * stdDev);
    const cpkLower = (mean - lsl) / (3 * stdDev);
    const cpkCalc = Math.min(cpkUpper, cpkLower);
    
    // El usuario pidió que el mínimo siempre sea 0
    const cp = Math.max(0, cpCalc);
    const cpk = Math.max(0, cpkCalc);

    // Mediana
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Moda
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    let mode = sorted[0];
    for (const v of sorted) {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) {
        maxFreq = freq[v];
        mode = v;
      }
    }

    return { mean, stdDev, cp, cpk, median, mode };
  }, [tiemposLlenado, usl, lsl]);

  // SVG Personalizado para dibujar el BoxPlot
  const BoxPlotShape = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload || height === undefined) return null;
    
    // En Recharts, `y` es la coordenada del valor máximo de la barra (top).
    // `y + height` es la coordenada de 0 (la base).
    const pixelBase = y + height;
    const maxVal = payload.rangoMax || 1;
    const ratio = height / maxVal; 

    const pxMax = y; // pixel del Max
    const pxQ3 = pixelBase - (payload.q3 * ratio);
    const pxMed = pixelBase - (payload.median * ratio);
    const pxQ1 = pixelBase - (payload.q1 * ratio);
    const pxMin = pixelBase - (payload.min * ratio);

    const boxWidth = width * 0.6;
    const offset = (width - boxWidth) / 2;
    const boxX = x + offset;
    const centerX = x + (width / 2);

    return (
      <g>
        {/* Línea superior (Bigote) */}
        <line x1={centerX} y1={pxMax} x2={centerX} y2={pxQ3} stroke="#334155" strokeWidth={2} strokeDasharray="3 3"/>
        <line x1={centerX - 10} y1={pxMax} x2={centerX + 10} y2={pxMax} stroke="#334155" strokeWidth={2}/>
        
        {/* Línea inferior (Bigote) */}
        <line x1={centerX} y1={pxMin} x2={centerX} y2={pxQ1} stroke="#334155" strokeWidth={2} strokeDasharray="3 3"/>
        <line x1={centerX - 10} y1={pxMin} x2={centerX + 10} y2={pxMin} stroke="#334155" strokeWidth={2}/>

        {/* Caja IQR (Q1 a Q3) */}
        <rect x={boxX} y={pxQ3} width={boxWidth} height={Math.abs(pxQ1 - pxQ3)} fill="#bfdbfe" stroke="#1e40af" strokeWidth={2} rx={4} />

        {/* Mediana */}
        <line x1={boxX} y1={pxMed} x2={boxX + boxWidth} y2={pxMed} stroke="#ef4444" strokeWidth={3} />
        
        {/* Etiqueta Mediana */}
        <text x={centerX + boxWidth/2 + 5} y={pxMed + 4} fontSize="11" fill="#ef4444" fontWeight="bold">
          {payload.median}m
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm z-50">
          <p className="font-bold text-slate-800 border-b pb-1 mb-1">Marca: {data.marca}</p>
          <p className="text-slate-600">Llenados: <span className="font-semibold text-slate-900">{data.count} tanques</span></p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="flex justify-between w-32"><span className="text-slate-500">Máx:</span> <span className="font-semibold">{data.max} m</span></p>
            <p className="flex justify-between w-32"><span className="text-slate-500">Q3 (75%):</span> <span className="font-semibold">{data.q3} m</span></p>
            <p className="flex justify-between w-32"><span className="text-red-500 font-bold">Mediana:</span> <span className="text-red-500 font-bold">{data.median} m</span></p>
            <p className="flex justify-between w-32"><span className="text-slate-500">Q1 (25%):</span> <span className="font-semibold">{data.q1} m</span></p>
            <p className="flex justify-between w-32"><span className="text-slate-500">Mín:</span> <span className="font-semibold">{data.min} m</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border shadow-sm mt-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Box & Whisker - Tiempos de Llenado</CardTitle>
            <CardDescription>Variabilidad por Marca y Capacidad (Cp/Cpk) en Minutos</CardDescription>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Mínimo (LSL) min</Label>
              <Input type="number" min="0" value={lsl} onChange={(e) => setLsl(Math.max(0, Number(e.target.value)))} className="w-20 h-8 text-xs bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Máximo (USL) min</Label>
              <Input type="number" min="0" value={usl} onChange={(e) => setUsl(Math.max(0, Number(e.target.value)))} className="w-20 h-8 text-xs bg-white" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No hay datos suficientes de tiempo de llenado con hora de inicio
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Cp (Llenado)</p>
                <p className={`text-xl font-black ${statsGlobales.cp >= 1.33 ? 'text-green-600' : statsGlobales.cp >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                  {statsGlobales.cp.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Cpk (Llenado)</p>
                <p className={`text-xl font-black ${statsGlobales.cpk >= 1.33 ? 'text-green-600' : statsGlobales.cpk >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                  {statsGlobales.cpk.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Media Global</p>
                <p className="text-xl font-black text-slate-700">{statsGlobales.mean.toFixed(1)} min</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Desviación (σ)</p>
                <p className="text-xl font-black text-slate-700">{statsGlobales.stdDev.toFixed(1)} min</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Mediana</p>
                <p className="text-xl font-black text-slate-700">{statsGlobales.median.toFixed(1)} min</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Moda</p>
                <p className="text-xl font-black text-slate-700">{statsGlobales.mode.toFixed(1)} min</p>
              </div>
            </div>

            <div className="h-[400px] w-full mt-6 relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="marca" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 'dataMax + 20']} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  
                  <ReferenceArea y1={lsl} y2={usl} fill="#22c55e" fillOpacity={0.15} />
                  <ReferenceArea y1={0} y2={lsl} fill="#ef4444" fillOpacity={0.1} />
                  
                  <ReferenceLine y={usl} stroke="#16a34a" strokeDasharray="3 3" label={{ position: 'top', value: 'USL', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                  <ReferenceLine y={lsl} stroke="#16a34a" strokeDasharray="3 3" label={{ position: 'bottom', value: 'LSL', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                  
                  <Bar dataKey="rangoMax" shape={<BoxPlotShape />} isAnimationActive={true} animationDuration={1000} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
