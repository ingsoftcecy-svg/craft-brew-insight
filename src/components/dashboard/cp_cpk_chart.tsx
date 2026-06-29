import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ComposedChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurgaRow } from "@/types/proceso";
import { parseMexicanDate } from "@/lib/utils";

interface CpCpkChartProps {
  purgas: PurgaRow[];
}

export function CpCpkChart({ purgas }: CpCpkChartProps) {
  // Configuración de límites (LSL y USL ajustables por el usuario)
  const [usl, setUsl] = useState<number>(6);
  const [lsl, setLsl] = useState<number>(2);
  const [variable, setVariable] = useState<"tiempoPurga" | "tiempoLlenado">("tiempoPurga");
  const [marcaFiltro, setMarcaFiltro] = useState<string>("todas");

  const marcasDisponibles = useMemo(() => {
    const s = new Set<string>();
    purgas.forEach(p => {
      if (p.marca) s.add(p.marca);
    });
    return Array.from(s).sort();
  }, [purgas]);

  // Procesar datos según la variable elegida
  const chartData = useMemo(() => {
    let data: any[] = [];
    const purgasFiltradas = marcaFiltro === "todas" ? purgas : purgas.filter(p => p.marca === marcaFiltro);
    
    if (variable === "tiempoPurga") {
      purgasFiltradas.forEach(p => {
        const fechaCorta = p.fechaLlenado ? p.fechaLlenado.split(" ")[0].slice(0, 5) : "";
        p.purgas.forEach((purga, i) => {
          if (purga.tiempo != null && purga.tiempo > 0) {
            data.push({
              id: `${p.tanque} ${fechaCorta}-P${i}`,
              tanque: p.tanque,
              fecha: p.fechaLlenado,
              marca: p.marca,
              purgaIndex: i,
              valor: purga.tiempo,
              tiempoLlenado: p.tiempoLlenadoHoras,
            });
          }
        });
      });
    } else {
      purgasFiltradas.forEach(p => {
        const fechaCorta = p.fechaLlenado ? p.fechaLlenado.split(" ")[0].slice(0, 5) : "";
        let val = p.tiempoLlenadoHoras;
        if (val == null && p.fechaInicioLlenado && p.fechaLlenado) {
          const inicio = parseMexicanDate(p.fechaInicioLlenado);
          const fin = parseMexicanDate(p.fechaLlenado);
          if (inicio && fin) {
            val = (fin.getTime() - inicio.getTime()) / (1000 * 60);
          }
        }
        if (val != null && val > 0) {
          data.push({
            id: `${p.tanque} ${fechaCorta}`,
            tanque: p.tanque,
            fecha: p.fechaLlenado,
            marca: p.marca,
            valor: val,
            tiempoLlenado: val,
          });
        }
      });
    }
    return data;
  }, [purgas, variable, marcaFiltro]);

  // Cálculos de Cp y Cpk, Mediana y Moda
  const stats = useMemo(() => {
    if (chartData.length === 0) return { mean: 0, stdDev: 0, cp: 0, cpk: 0, median: 0, mode: 0, n: 0, minVal: 0, maxVal: 0, numClasses: 0, range: 0, classWidth: 0, histogramData: [] };
    const values = chartData.map(d => d.valor);
    
    // Media y Desviación
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1 || 1);
    const stdDev = Math.sqrt(variance) || 0.001; // Evitar división por 0

    // Cp y Cpk
    const cpCalc = (usl - lsl) / (6 * stdDev);
    const cpkUpper = (usl - mean) / (3 * stdDev);
    const cpkLower = (mean - lsl) / (3 * stdDev);
    const cpkCalc = Math.min(cpkUpper, cpkLower);
    
    // El usuario pidió que el mínimo siempre sea 0 y el máximo 1.33
    const cp = Math.min(1.33, Math.max(0, cpCalc));
    const cpk = Math.min(1.33, Math.max(0, cpkCalc));

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

    // Histograma (Regla de Sturges) y Distribución Normal
    const n = values.length;
    let minVal = 0;
    let maxVal = 0;
    let numClasses = 0;
    let range = 0;
    let classWidth = 0;
    let histogramData: any[] = [];

    if (n > 0) {
      minVal = Math.min(...values);
      maxVal = Math.max(...values);
      numClasses = Math.ceil(1 + Math.log2(n));
      range = maxVal - minVal;
      classWidth = range / (numClasses > 0 ? numClasses : 1);
      
      if (classWidth === 0) classWidth = 1; // Seguridad

      const bins = Array.from({ length: numClasses }, (_, i) => {
        const binStart = minVal + i * classWidth;
        const binEnd = minVal + (i + 1) * classWidth;
        return {
          binStart,
          binEnd,
          label: `[${binStart.toFixed(1)}, ${binEnd.toFixed(1)}]`,
          count: 0,
          midPoint: binStart + (classWidth / 2)
        };
      });

      values.forEach(v => {
        for (let i = 0; i < numClasses; i++) {
          if (i === numClasses - 1) { 
            if (v >= bins[i].binStart && v <= bins[i].binEnd) {
              bins[i].count++;
              break;
            }
          } else {
            if (v >= bins[i].binStart && v < bins[i].binEnd) {
              bins[i].count++;
              break;
            }
          }
        }
      });

      const scaleFactor = n * classWidth;
      histogramData = bins.map(b => {
        const x = b.midPoint;
        let normalPdf = 0;
        if (stdDev > 0) {
          const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
          const coeff = 1 / (stdDev * Math.sqrt(2 * Math.PI));
          normalPdf = coeff * Math.exp(exponent);
        }
        return {
          ...b,
          normalDist: normalPdf * scaleFactor
        };
      });
    }

    return { mean, stdDev, cp, cpk, median, mode, n, minVal, maxVal, numClasses, range, classWidth, histogramData };
  }, [chartData, usl, lsl]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm z-50 relative">
          <p className="font-bold text-slate-800 border-b pb-1 mb-1">Tanque: {data.tanque}</p>
          <p className="text-slate-600">Fecha Llenado: <span className="font-semibold text-slate-900">{data.fecha || "-"}</span></p>
          <p className="text-slate-600">Marca: <span className="font-semibold text-slate-900">{data.marca}</span></p>
          {data.purgaIndex !== undefined && (
            <p className="text-slate-600">Purga: <span className="font-semibold text-slate-900">{data.purgaIndex === 0 ? "Inicial" : data.purgaIndex}</span></p>
          )}
          <p className="text-slate-600">Valor: <span className="font-bold text-blue-600">{data.valor.toFixed(1)} {variable === "tiempoPurga" ? "min" : "min"}</span></p>
        </div>
      );
    }
    return null;
  };

  // Calcular límites visuales para las bandas (Yellow/Green)
  const yDomainMin = Math.min(lsl - (usl - lsl) * 0.5, 0);
  const yDomainMax = Math.max(usl + (usl - lsl) * 0.5, Math.max(...chartData.map(d => d.valor), usl * 1.2));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Gráfica de Control e Índices Cp/Cpk</CardTitle>
            <CardDescription>Monitoreo de estabilidad de proceso (Zonas Verde/Amarilla)</CardDescription>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Métrica</Label>
              <Select value={variable} onValueChange={(val: any) => setVariable(val)}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiempoPurga">Tiempos de Purga</SelectItem>
                  <SelectItem value="tiempoLlenado">Tiempo de Llenado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Marca</Label>
              <Select value={marcaFiltro} onValueChange={(val: any) => setMarcaFiltro(val)}>
                <SelectTrigger className="w-[160px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las marcas</SelectItem>
                  {marcasDisponibles.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Mínimo (LSL)</Label>
              <Input 
                type="number" 
                min="0"
                value={lsl} 
                onChange={(e) => setLsl(Math.max(0, Number(e.target.value)))}
                className="w-20 h-8 text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Máximo (USL)</Label>
              <Input 
                type="number" 
                min="0"
                value={usl} 
                onChange={(e) => setUsl(Math.max(0, Number(e.target.value)))}
                className="w-20 h-8 text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No hay datos suficientes para la gráfica
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Cp</p>
                <p className={`text-xl font-black ${stats.cp >= 1.33 ? 'text-green-600' : stats.cp >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                  {stats.cp.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Cpk</p>
                <p className={`text-xl font-black ${stats.cpk >= 1.33 ? 'text-green-600' : stats.cpk >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                  {stats.cpk.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Media (μ)</p>
                <p className="text-xl font-black text-slate-700">{stats.mean.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Desv. Est (σ)</p>
                <p className="text-xl font-black text-slate-700">{stats.stdDev.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Mediana</p>
                <p className="text-xl font-black text-slate-700">{stats.median.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 font-medium">Moda</p>
                <p className="text-xl font-black text-slate-700">{stats.mode.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-2">
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">N° Datos (n)</p>
                <p className="text-lg font-black text-slate-700">{stats.n}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mín - Máx</p>
                <p className="text-lg font-black text-slate-700">{stats.minVal.toFixed(1)} - {stats.maxVal.toFixed(1)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rango (r)</p>
                <p className="text-lg font-black text-slate-700">{stats.range.toFixed(1)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Clases (c)</p>
                <p className="text-lg font-black text-slate-700">{stats.numClasses}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Ancho (h)</p>
                <p className="text-lg font-black text-slate-700">{stats.classWidth.toFixed(2)}</p>
              </div>
            </div>

            <div className="h-[350px] w-full mt-6 relative">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Dot Graph</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="id" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[yDomainMin, yDomainMax]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  {/* Bandas de Control */}
                  {/* Zona Verde (Dentro de LSL y USL) */}
                  <ReferenceArea y1={lsl} y2={usl} fill="#bbf7d0" fillOpacity={0.6} strokeOpacity={0} />
                  
                  {/* Zonas Amarillas (Fuera de especificación) */}
                  <ReferenceArea y1={yDomainMin} y2={lsl} fill="#eab308" fillOpacity={0.2} strokeOpacity={0} />
                  <ReferenceArea y1={usl} y2={yDomainMax} fill="#eab308" fillOpacity={0.2} strokeOpacity={0} />

                  {/* Líneas límite */}
                  <ReferenceLine y={usl} stroke="#16a34a" strokeDasharray="3 3" label={{ position: 'top', value: 'LS', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                  <ReferenceLine y={lsl} stroke="#16a34a" strokeDasharray="3 3" label={{ position: 'bottom', value: 'LI', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="transparent" 
                    strokeWidth={0}
                    dot={{ r: 4, fill: "#0ea5e9", stroke: "#0284c7", strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1500}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Histograma y Distribución Normal */}
            <div className="h-[350px] w-full mt-10 relative">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Histograma y Distribución Normal</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="count" 
                    name="Frecuencia"
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="normalDist" 
                    name="Dist. Normal"
                    stroke="#0284c7" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
