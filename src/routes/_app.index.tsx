import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, AlertTriangle, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi_card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Control de Elaboración" },
      { name: "description", content: "Resumen operativo del departamento de elaboración cervecera." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { extractos, purgas, isLoading, fetchData } = useOperacionesStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fermentando = extractos.length;
  const fueraRango = extractos.filter(e => e.estado === "Desviado").length;
  // TODO: Contar purgas basándonos en las fechas reales de hoy si aplica
  const purgasTotal = purgas.length; 

  const brandCounts = extractos.reduce((acc, curr) => {
    acc[curr.marca] = (acc[curr.marca] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(brandCounts)
    .map(([marca, count]) => ({ marca, total: count }))
    .sort((a, b) => b.total - a.total); // Mostramos todas las marcas ordenadas

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen Operativo</h1>
        <p className="text-sm text-muted-foreground">Estado actual del departamento de elaboración</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-4 text-center">Cargando datos...</div>
        ) : (
          <>
            <KpiCard label="Tanques en Fermentación" value={fermentando} icon={FlaskConical} tone="default" hint="registros actuales" />
            <KpiCard label="Extractos fuera de rango" value={fueraRango} icon={AlertTriangle} tone="bad" hint="desviados" />
            <KpiCard label="Tanques en Purga" value={purgasTotal} icon={Droplets} tone="warn" hint="en seguimiento" />
          </>
        )}
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tanques por Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              {chartData.length === 0 ? (
                 <p className="text-sm text-muted-foreground py-4 text-center mt-10">Sube tus archivos de extracto para ver la gráfica.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" />
                    <XAxis 
                      dataKey="marca" 
                      stroke="oklch(0.55 0.04 257)" 
                      fontSize={11} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                    />
                    <YAxis stroke="oklch(0.55 0.04 257)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid oklch(0.92 0.01 250)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="total" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}