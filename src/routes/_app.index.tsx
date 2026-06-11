import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Clock, CheckCircle2, TrendingUp, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Control de Elaboración" },
      { name: "description", content: "Resumen operativo del departamento de elaboración cervecera." },
    ],
  }),
  component: Dashboard,
});

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
        <p className="text-primary font-bold mt-0.5">{payload[0].value} tanques</p>
      </div>
    );
  }
  return null;
};

interface KpiProps { label: string; value: number | string; icon: any; sub?: string; color: string; bg: string; }

function KpiCard({ label, value, icon: Icon, sub, color, bg }: KpiProps) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { extractos, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => { fetchData(); }, [fetchData]);

  const fermentando   = extractos.length;
  const completados72 = extractos.filter(e => e.h72 && e.estado72h === "Completado").length;
  const pendientes72  = extractos.filter(e => e.h72 && e.estado72h !== "Completado").length;

  const [mesFiltro, setMesFiltro] = useState<string>("todos");

  // Meses disponibles a partir de fechaLlenado
  const mesesDisponibles = useMemo(() => {
    const seen = new Map<string, string>();
    extractos.forEach(e => {
      if (!e.fechaLlenado) return;
      const d = new Date(e.fechaLlenado);
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
      return format(new Date(e.fechaLlenado), "yyyy-MM") === mesFiltro;
    });
  }, [extractos, mesFiltro]);

  // Contar por marca dentro del mes seleccionado
  const brandCounts = useMemo(() => {
    return extractosFiltrados.reduce((acc, curr) => {
      acc[curr.marca] = (acc[curr.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [extractosFiltrados]);

  const chartData = Object.entries(brandCounts)
    .map(([marca, total]) => ({ marca, total }))
    .sort((a, b) => b.total - a.total);

  const ahora = new Date();
  const proximos72 = extractos
    .filter(e => e.h72 && new Date(e.h72) > ahora && e.estado72h !== "Completado")
    .sort((a, b) => new Date(a.h72!).getTime() - new Date(b.h72!).getTime())
    .slice(0, 6);

  // Próximas Purgas 8 = fechaLlenado + 64 horas, solo las futuras
  const proximasPurgas = extractos
    .filter(e => e.fechaLlenado)
    .map(e => ({
      id: e.id,
      tanque: e.tanque,
      marca: e.marca,
      fechaPurga8: new Date(new Date(e.fechaLlenado).getTime() + 64 * 60 * 60 * 1000),
    }))
    .filter(e => e.fechaPurga8 > ahora)
    .sort((a, b) => a.fechaPurga8.getTime() - b.fechaPurga8.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tablero General</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor de Purgas y Chequeo de Platos</p>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50 border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3">
          <KpiCard
            label="Tanques en Fermentación"
            value={fermentando}
            icon={FlaskConical}
            sub="registros activos"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <KpiCard
            label="Chequeos 72h Pendientes"
            value={pendientes72}
            icon={Clock}
            sub="por realizar"
            color="text-sky-600"
            bg="bg-sky-50"
          />
          <KpiCard
            label="Chequeos 72h Completados"
            value={completados72}
            icon={CheckCircle2}
            sub="confirmados"
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-5 xl:grid-cols-10">
        {/* Bar chart */}
        <Card className="lg:col-span-3 xl:col-span-4 border-border shadow-sm">
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Distribución por Marca
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Tanques activos por tipo de cerveza</p>
              </div>
              {/* Filtro de mes */}
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
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-4">
            <div className="h-72 w-full">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <FlaskConical className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Sin datos para el mes seleccionado.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ bottom: 72, left: -15, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.008 240)" vertical={false} />
                    <XAxis
                      dataKey="marca"
                      fontSize={10}
                      interval={0}
                      angle={-40}
                      textAnchor="end"
                      tick={{ fill: "oklch(0.52 0.025 255)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      allowDecimals={false}
                      tick={{ fill: "oklch(0.52 0.025 255)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "oklch(0.96 0.005 240)" }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Próximos Chequeos 72h */}
        <Card className="lg:col-span-2 xl:col-span-3 border-border shadow-sm">
          <CardHeader className="pb-0 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-500" />
              Próximos Chequeos 72h
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Los más próximos a vencer</p>
          </CardHeader>
          <CardContent className="pt-3 px-4 pb-4 space-y-2">
            {proximos72.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-20" />
                <p className="text-sm text-center">Sin chequeos próximos</p>
              </div>
            ) : (
              proximos72.map(e => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 border border-border/60 hover:border-border transition-colors"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-semibold text-foreground truncate">Tanque {e.tanque}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{e.marca}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-sky-600 font-mono">
                      {e.h72 ? format(new Date(e.h72), "HH:mm") : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {e.h72 ? format(new Date(e.h72), "dd MMM", { locale: es }) : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximas Purgas 8 */}
        <Card className="lg:col-span-2 xl:col-span-3 border-border shadow-sm">
          <CardHeader className="pb-0 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-red-500" />
              Próximas Purgas (8ª)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Purga 8 · 64 hrs después del llenado</p>
          </CardHeader>
          <CardContent className="pt-3 px-4 pb-4 space-y-2">
            {proximasPurgas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Droplets className="h-8 w-8 opacity-20" />
                <p className="text-sm text-center">Sin purgas próximas</p>
              </div>
            ) : (
              proximasPurgas.map(e => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 border border-border/60 hover:border-border transition-colors"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-semibold text-foreground truncate">Tanque {e.tanque}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{e.marca}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-500 font-mono">
                      {format(e.fechaPurga8, "HH:mm")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(e.fechaPurga8, "dd MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}