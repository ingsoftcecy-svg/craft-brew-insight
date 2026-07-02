import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { parseMexicanDate } from "@/lib/utils";
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
    fetchData();
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
  const indicePurgaPendiente = useMemo(() => {
    if (!loteActivo) return -1;

    const index = loteActivo.purgas.findIndex((p) => {
      const estaIncompleta =
        p.tiempo === null ||
        p.tiempo === undefined ||
        p.realiza === null ||
        p.realiza === "" ||
        p.realiza === undefined;

      return estaIncompleta;
    });

    return index;
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
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
          Tanque {tanqueId}
        </h1>
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full text-sm font-semibold">
          <Clock className="w-4 h-4" />
          <span>Lote: {loteActivo.marca}</span>
        </div>
        <p className="text-slate-500 text-sm mt-3 font-medium">
          Llenado: {loteActivo.fechaLlenado}
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
            Programada para: {loteActivo.purgas[indicePurgaPendiente]?.fechaHora || "Sin asignar"}
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
                  placeholder="Ej. 15"
                  className="h-14 text-xl px-4 bg-slate-50"
                  required
                  min="1"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="realiza" className="text-base text-slate-700 font-semibold">
                  Operador (Realiza)
                </Label>
                <Input
                  id="realiza"
                  type="text"
                  value={realiza}
                  onChange={(e) => setRealiza(e.target.value)}
                  placeholder="Nombre o ID del operador"
                  className="h-14 text-xl px-4 bg-slate-50"
                  required
                />
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
