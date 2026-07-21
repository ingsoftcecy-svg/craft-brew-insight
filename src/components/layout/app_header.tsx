import { useEffect, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { obtenerTurnoPorHora } from "@/data/turno";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const TURNO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  "Turno 1": { label: "Turno 1 · 23:00–05:59", bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-500" },
  "Turno 2": { label: "Turno 2 · 06:00–15:29", bg: "bg-primary/10 border-primary/20", text: "text-primary" },
  "Turno 3": { label: "Turno 3 · 15:30–22:59", bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-500" },
};

function isShiftEndingSoon(now: Date) {
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;

  // Turno 1 termina 05:59 (20 min antes: 05:39 -> 339 mins a 359 mins)
  if (mins >= 339 && mins <= 359) return true;
  // Turno 2 termina 15:29 (20 min antes: 15:09 -> 909 mins a 929 mins)
  if (mins >= 909 && mins <= 929) return true;
  // Turno 3 termina 22:59 (20 min antes: 22:39 -> 1359 mins a 1379 mins)
  if (mins >= 1359 && mins <= 1379) return true;

  return false;
}

export function AppHeader() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const turno = obtenerTurnoPorHora(now.toISOString());
  const tc =
    turno && TURNO_CONFIG[turno]
      ? TURNO_CONFIG[turno]
      : { label: turno ?? "Desconocido", bg: "bg-muted", text: "text-muted-foreground" };

  const showWarning = isShiftEndingSoon(now);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/60 backdrop-blur-lg px-5 shadow-sm transition-all duration-300 print:hidden">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors -ml-1" />

      {/* Date */}
      <div className="hidden md:flex flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground tracking-tight first-letter:uppercase">
          {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">{format(now, "HH:mm")} hrs</span>
      </div>

      {/* Turno badge */}
      <div className="hidden lg:flex items-center ml-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm border ${tc.bg} ${tc.text}`}
        >
          {tc.label}
        </span>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
    {showWarning && (
      <div className="sticky top-14 z-10 w-full bg-red-600 text-white px-4 py-2.5 text-center text-xs md:text-sm font-bold flex items-center justify-center gap-3 shadow-md animate-in slide-in-from-top-4 print:hidden">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <span>
          ¡CIERRE DE TURNO EN MENOS DE 20 MINUTOS! Recuerda actualizar la info de Curvas de Fermentación y no dejar purgas o chequeos pendientes.
        </span>
      </div>
    )}
    </>
  );
}
