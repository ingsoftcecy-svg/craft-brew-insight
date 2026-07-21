import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Clock, ChevronDown } from "lucide-react";
import { parseMexicanDate, parseDateToMexico } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

export const Route = createFileRoute("/scan/$tanqueId")({
  beforeLoad: async ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Failed to sign in anonymously", error);
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
    }
  },
  component: ScanPage,
});

function ScanPage() {
  const { tanqueId } = Route.useParams();
  const navigate = useNavigate();
  const { purgas, completarPurga, fetchData, isLoading } = useOperacionesStore();
  const [tiempo, setTiempo] = useState("");
  const [realiza, setRealiza] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Asegurar que los datos estén cargados (en caso de entrar directo por URL)
  useEffect(() => {
    fetchData("todos");
  }, [fetchData]);

  const loteActivo = useMemo(() => {
    const normalizeTanque = (id: any) => {
      const numMatch = String(id).match(/\d+/);
      if (numMatch) return parseInt(numMatch[0], 10).toString();
      return String(id).toLowerCase().trim();
    };

    const purgasDelTanque = purgas.filter(
      (p) => normalizeTanque(p.tanque) === normalizeTanque(tanqueId),
    );

    if (purgasDelTanque.length === 0) return null;

    // Ordenar por fecha de llenado descendente para agarrar el activo
    return purgasDelTanque.sort((a, b) => {
      const dateA = parseMexicanDate(a.fechaLlenado)?.getTime() || 0;
      const dateB = parseMexicanDate(b.fechaLlenado)?.getTime() || 0;
      return dateB - dateA;
    })[0];
  }, [purgas, tanqueId]);

  // Encontrar la primera purga pendiente
  // El array tiene: index 0 = Purga Inicial, index 1 = Purga 1, etc.
  const indicePurgaPendiente = useMemo(() => {
    if (!loteActivo) return -1;

    const estaIncompleta = (p: { tiempo?: number | null; realiza?: string | null }) => {
      const sinTiempo = p.tiempo === null || p.tiempo === undefined;
      const sinRealiza = p.realiza === null || p.realiza === undefined || p.realiza === "";
      return sinTiempo || sinRealiza;
    };

    // Verificar si la Purga Inicial (index 0) está incompleta
    const inicialIncompleta = estaIncompleta(loteActivo.purgas[0]);

    if (inicialIncompleta) {
      // Excepción: si ya se completó al menos una purga numerada (index >= 1),
      // saltar la Inicial y buscar la siguiente pendiente desde index 1
      const hayPurgasNumeradasCompletadas = loteActivo.purgas
        .slice(1)
        .some((p) => !estaIncompleta(p));

      if (hayPurgasNumeradasCompletadas) {
        // Buscar la primera pendiente desde index 1 en adelante
        const indexDesde1 = loteActivo.purgas.findIndex(
          (p, i) => i >= 1 && estaIncompleta(p)
        );
        return indexDesde1;
      }
    }

    // Caso normal: buscar la primera incompleta desde el inicio
    return loteActivo.purgas.findIndex((p) => estaIncompleta(p));
  }, [loteActivo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteActivo || indicePurgaPendiente === -1) return;

    setIsSubmitting(true);
    await completarPurga(loteActivo.id, indicePurgaPendiente + 1, Number(tiempo), realiza);
    setIsSubmitting(false);
    setSuccess(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!loteActivo) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-bold text-blue-900 mb-2">No hay purgas pendientes</h2>
            <p className="text-blue-700">
              No hay ningún lote activo registrado para el Tanque {tanqueId}.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => navigate({ to: "/purgas" })}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (indicePurgaPendiente === -1) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <Card className="border-green-100 bg-green-50/50 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">Lote Completado</h2>
            <p className="text-green-700">
              El Tanque {tanqueId} (Lote: {loteActivo.marca}) ya tiene todas sus purgas registradas.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => navigate({ to: "/purgas" })}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">
          Tanque {tanqueId}
        </h1>
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full text-sm font-semibold">
          <Clock className="w-4 h-4" />
          <span>Lote: {loteActivo.marca}</span>
        </div>
        <p className="text-muted-foreground text-sm mt-3 font-medium">
          Llenado: {(() => {
            if (!loteActivo.fechaLlenado) return "—";
            try {
              const d = new Date(loteActivo.fechaLlenado);
              return d.toLocaleString("es-MX", {
                timeZone: "America/Mexico_City",
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false
              });
            } catch {
              return loteActivo.fechaLlenado;
            }
          })()}
        </p>
      </div>

      <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-800 p-4 text-white text-center">
          <CardTitle className="text-xl">
            {indicePurgaPendiente === 0
              ? "Registro de Purga Inicial"
              : `Registro de Purga ${indicePurgaPendiente}`}
          </CardTitle>
          <CardDescription className="text-slate-300 mt-1">
            Programada para:{" "}
            {(() => {
              // Purga Inicial: mostrar fecha FIN de llenado
              const rawFecha =
                indicePurgaPendiente === 0
                  ? loteActivo.fechaLlenado
                  : loteActivo.purgas[indicePurgaPendiente]?.fechaHora;

              if (!rawFecha) return "Sin asignar";
              try {
                const d = new Date(rawFecha);
                return d.toLocaleString("es-MX", {
                  timeZone: "America/Mexico_City",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
              } catch {
                return rawFecha;
              }
            })()}
          </CardDescription>
        </div>

        <CardContent className="pt-6">
          {success ? (
            <div className="flex flex-col items-center text-center py-6 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800">¡Purga registrada!</h3>
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setTiempo("");
                  setRealiza("");
                }}
              >
                Cerrar o escanear otra
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="tiempo" className="text-base text-slate-700 font-semibold">
                  Tiempo de purga (minutos)
                </Label>
                <Input
                  id="tiempo"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tiempo}
                  onChange={(e) => setTiempo(e.target.value)}
                  placeholder="Máximo 7 minutos"
                  className="h-14 text-xl px-4 bg-slate-50 text-slate-900"
                  required
                  min="1"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="realiza" className="text-base text-slate-700 font-semibold">
                  Operador (Realiza)
                </Label>
                <div className="relative">
                  <select
                    id="realiza"
                    value={realiza}
                    onChange={(e) => setRealiza(e.target.value)}
                    required
                    className="w-full h-14 text-xl px-4 bg-slate-50 border border-input rounded-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-slate-800"
                  >
                    <option value="" disabled>Selecciona operador...</option>
                    {["LAMD", "MJFA", "VHAL", "OEVM", "ORC", "PLRG"].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white mt-4 transition-all"
              >
                {isSubmitting ? "Guardando..." : "Guardar Registro"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
