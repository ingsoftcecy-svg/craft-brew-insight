import { useState, useMemo } from "react";
import {
  LineChart,
  BarChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ComposedChart,
  Bar,
  Area,
  Scatter,
} from "recharts";
import { Activity, BarChart4, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurgaRow } from "@/types/proceso";
import { parseMexicanDate } from "@/lib/utils";
import { ProcessCapabilityAnalyzer } from "@/components/core/analisisestaditcio";
import "@/styles/dashboard.css";

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
    purgas.forEach((p) => {
      if (p.marca) s.add(p.marca);
    });
    return Array.from(s).sort();
  }, [purgas]);

  // Procesar datos según la variable elegida
  const chartData = useMemo(() => {
    let data: any[] = [];
    const purgasFiltradas =
      marcaFiltro === "todas" ? purgas : purgas.filter((p) => p.marca === marcaFiltro);

    if (variable === "tiempoPurga") {
      purgasFiltradas.forEach((p) => {
        const fechaCorta = p.fechaLlenado ? p.fechaLlenado.split(" ")[0].slice(0, 5) : "";
        p.purgas.forEach((purga, i) => {
          if (purga.tiempo != null && purga.tiempo > 0) {
            let horaExacta = "";
            if (purga.fechaHora) {
              const d = new Date(purga.fechaHora);
              if (!isNaN(d.getTime())) {
                horaExacta = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              }
            }
            data.push({
              id: horaExacta ? `${p.tanque} ${horaExacta}` : `${p.tanque} ${fechaCorta}-P${i}`,
              tanque: p.tanque,
              fecha: p.fechaLlenado,
              horaPurga: horaExacta,
              marca: p.marca,
              purgaIndex: i,
              valor: purga.tiempo,
              tiempoLlenado: p.tiempoLlenadoHoras,
            });
          }
        });
      });
    } else {
      purgasFiltradas.forEach((p) => {
        const fechaCorta = p.fechaLlenado ? p.fechaLlenado.split(" ")[0].slice(0, 5) : "";
        let val = p.tiempoLlenadoHoras;
        if (val == null && p.fechaInicioLlenado && p.fechaLlenado) {
          const inicio = parseMexicanDate(p.fechaInicioLlenado);
          const fin = parseMexicanDate(p.fechaLlenado);
          if (inicio && fin) {
            val = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
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

  // Cálculos de Cp y Cpk, Mediana y Moda utilizando OOP
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        mean: 0,
        stdDev: 0,
        cp: 0,
        cpk: 0,
        median: 0,
        mode: 0,
        n: 0,
        minVal: 0,
        maxVal: 0,
        numClasses: 0,
        range: 0,
        classWidth: 0,
        histogramData: [],
      };
    }

    const values = chartData.map((d) => d.valor);
    const analyzer = new ProcessCapabilityAnalyzer(values, lsl, usl);
    const summary = analyzer.getSummaryStats();

    return {
      ...summary,
      n: values.length,
    };
  }, [chartData, usl, lsl]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm z-50 relative">
          <p className="font-bold text-slate-800 border-b pb-1 mb-1">Tanque: {data.tanque}</p>
          <p className="text-slate-600">
            Fecha Llenado: <span className="font-semibold text-slate-900">{data.fecha || "-"}</span>
          </p>
          <p className="text-slate-600">
            Marca: <span className="font-semibold text-slate-900">{data.marca}</span>
          </p>
          {data.purgaIndex !== undefined && (
            <p className="text-slate-600">
              Purga:{" "}
              <span className="font-semibold text-slate-900">
                {data.purgaIndex === 0 ? "Inicial" : data.purgaIndex}
              </span>
              {data.horaPurga && (
                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                  a las {data.horaPurga}
                </span>
              )}
            </p>
          )}
          <p className="text-slate-600">
            Valor:{" "}
            <span className="font-bold text-blue-600">
              {data.valor.toFixed(1)} {variable === "tiempoPurga" ? "min" : "hrs"}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcular límites visuales para las bandas (Yellow/Green)
  const yDomainMin = Math.min(lsl - (usl - lsl) * 0.5, 0);
  const yDomainMax = Math.max(
    usl + (usl - lsl) * 0.5,
    Math.max(...chartData.map((d) => d.valor), usl * 1.2),
  );

  return (
    <Card className="dashboard-card">
      <CardHeader className="dashboard-card-header">
        <div className="flex flex-col">
          <CardTitle className="dashboard-title">Gráfica de Control</CardTitle>
          <CardDescription className="dashboard-subtitle">
            Capacidad del proceso (Cp, Cpk) para{" "}
            {variable === "tiempoPurga" ? "Tiempos de Purga" : "Tiempos de Llenado"}
          </CardDescription>
        </div>

        <div className="dashboard-controls">
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
            {marcasDisponibles.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
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
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No hay datos suficientes para calcular Cp/Cpk.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Cp</p>
                <p
                  className={`text-xl font-black ${stats.cp >= 1.33 ? "text-green-600" : stats.cp >= 1 ? "text-amber-500" : "text-red-500"}`}
                >
                  {stats.cp.toFixed(2)}
                </p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Cpk</p>
                <p
                  className={`text-xl font-black ${stats.cpk >= 1.33 ? "dashboard-stat-ok" : stats.cpk >= 1 ? "dashboard-stat-warn" : "dashboard-stat-bad"}`}
                >
                  {stats.cpk.toFixed(2)}
                </p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Media (μ)</p>
                <p className="dashboard-stat-value">{stats.mean.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Desv. Est (σ)</p>
                <p className="dashboard-stat-value">{stats.stdDev.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Mediana</p>
                <p className="dashboard-stat-value">{stats.median.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Moda</p>
                <p className="dashboard-stat-value">{stats.mode.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-2">
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">N° Datos </p>
                <p className="dashboard-stat-value">{stats.n}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Mín - Máx</p>
                <p className="dashboard-stat-value">
                  {stats.minVal.toFixed(1)} - {stats.maxVal.toFixed(1)}
                </p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Rango</p>
                <p className="dashboard-stat-value">{stats.range.toFixed(1)}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Clases (c) </p>
                <p className="dashboard-stat-value">{stats.numClasses.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-box">
                <p className="dashboard-stat-label">Ancho de Clases </p>
                <p className="dashboard-stat-value">{stats.classWidth.toFixed(2)}</p>
              </div>
            </div>

            <div className="dashboard-chart-container mt-6 relative">
              <CardTitle className="dashboard-chart-title">
                <Activity className="dashboard-chart-icon" />
                Dot Graph
              </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
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
                  <ReferenceArea
                    y1={lsl}
                    y2={usl}
                    fill="#bbf7d0"
                    fillOpacity={0.6}
                    strokeOpacity={0}
                  />

                  {/* Zonas Amarillas (Fuera de especificación) */}
                  <ReferenceArea
                    y1={yDomainMin}
                    y2={lsl}
                    fill="#eab308"
                    fillOpacity={0.2}
                    strokeOpacity={0}
                  />
                  <ReferenceArea
                    y1={usl}
                    y2={yDomainMax}
                    fill="#eab308"
                    fillOpacity={0.2}
                    strokeOpacity={0}
                  />

                  {/* Líneas límite */}
                  <ReferenceLine
                    y={usl}
                    stroke="#16a34a"
                    strokeDasharray="3 3"
                    label={{
                      position: "top",
                      value: "LS",
                      fill: "#16a34a",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                  <ReferenceLine
                    y={lsl}
                    stroke="#16a34a"
                    strokeDasharray="3 3"
                    label={{
                      position: "bottom",
                      value: "LI",
                      fill: "#16a34a",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }}
                  />

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
            <div className="dashboard-chart-container mt-10 relative">
              <CardTitle className="dashboard-chart-title">
                <BarChart4 className="dashboard-chart-icon" />
                Histograma
              </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.histogramData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
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
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
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
            <div className="dashboard-chart-container mt-10 relative">
              <CardTitle className="dashboard-chart-title">
                <LineChartIcon className="dashboard-chart-icon" />
                Distribución Normal
              </CardTitle>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.histogramData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
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
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
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
