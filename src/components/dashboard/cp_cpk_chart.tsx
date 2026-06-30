import { useState, useMemo } from "react";
import { LineChart, BarChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ComposedChart, Bar, Area, Scatter } from "recharts";
import { Activity, BarChart4, LineChart as LineChartIcon } from "lucide-react";
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
  const [uslStr, setUslStr] = useState<string>("6");
  const [lslStr, setLslStr] = useState<string>("2");
  const usl = Math.max(0, Number(uslStr) || 0);
  const lsl = Math.max(0, Number(lslStr) || 0);
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
    
    // El usuario pidió que el máximo sea 1.33
    const cp = Math.min(1.33, cpCalc);
    const cpk = Math.min(1.33, cpkCalc);

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
      const rawClasses = 1 + Math.log2(n);
      range = maxVal - minVal;
      classWidth = range / (rawClasses > 0 ? rawClasses : 1);
      
      if (classWidth === 0) classWidth = 1; // Seguridad

      numClasses = rawClasses; // Para mostrar en UI el valor exacto como en Excel
      const numClassesToDraw = Math.ceil(rawClasses);

      const bins = Array.from({ length: numClassesToDraw }, (_, i) => {
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
        for (let i = 0; i < numClassesToDraw; i++) {
          if (i === numClassesToDraw - 1) { 
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
    <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-0 pt-5 px-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              Gráfica de Control e Índices Cp/Cpk
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Control Estadistico de Proceso</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={variable}
              onChange={(e) => setVariable(e.target.value as any)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="tiempoPurga">Tiempo de Purga</option>
              <option value="tiempoLlenado">Tiempo de Llenado</option>
            </select>

            <select
              value={marcaFiltro}
              onChange={(e) => setMarcaFiltro(e.target.value)}
              className="shrink-0 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="todas">Todas las marcas</option>
              {marcasDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-medium text-slate-500">LI</span>
              <input 
                type="number" 
                min="0"
                value={lslStr} 
                onChange={(e) => setLslStr(e.target.value)}
                className="w-16 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-medium text-slate-500">LS</span>
              <input 
                type="number" 
                min="0"
                value={uslStr} 
                onChange={(e) => setUslStr(e.target.value)}
                className="w-16 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">N° Datos </p>
                <p className="text-lg font-black text-slate-700">{stats.n}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mín - Máx</p>
                <p className="text-lg font-black text-slate-700">{stats.minVal.toFixed(1)} - {stats.maxVal.toFixed(1)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Rango</p>
                <p className="text-lg font-black text-slate-700">{stats.range.toFixed(1)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Clases (c) </p>
                <p className="text-lg font-black text-slate-700">{stats.numClasses.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Ancho de Clases </p>
                <p className="text-lg font-black text-slate-700">{stats.classWidth.toFixed(2)}</p>
              </div>
            </div>

            <div className="h-[350px] w-full mt-6 relative">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-500" />
                  Dot Graph
                </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="id" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
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

            {/* Histograma */}
            <div className="h-[350px] w-full mt-10 relative">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-slate-500" />
                  Histograma
              </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Frecuencia"
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución Normal */}
            <div className="h-[350px] w-full mt-10 relative">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-slate-500" />
                  Distribución Normal
                </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="normalDist" 
                    name="Dist. Normal"
                    stroke="#0284c7" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#0284c7", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
