import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn, parseDateToMexico } from "@/lib/utils";
import { type AgendaEvent } from "@/types/proceso";
import { Dispatch, SetStateAction } from "react";

const getEventColorClass = (e: any, isDot = false) => {
  if (e.titulo && e.titulo.includes("Purga")) {
    return isDot
      ? "bg-rose-500"
      : "bg-rose-50/80 text-rose-700 border-l-[3px] border-rose-500 hover:bg-rose-100/80 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors";
  }
  if (e.titulo && e.titulo.includes("Chequeo Plato")) {
    return isDot
      ? "bg-indigo-500"
      : "bg-indigo-50/80 text-indigo-700 border-l-[3px] border-indigo-500 hover:bg-indigo-100/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors";
  }
};

interface AgendaCalendarProps {
  cursor: Date;
  set_cursor: Dispatch<SetStateAction<Date>>;
  days: Date[];
  events: AgendaEvent[];
}

export function AgendaCalendar({ cursor, set_cursor, days, events }: AgendaCalendarProps) {
  const events_by_day = (d: Date) =>
    events.filter((e) => {
      if (!isSameDay(new Date(e.inicio), d)) return false;
      return true;
    });

  return (
    <div className="flex flex-col h-full bg-card rounded-xl">
      {/* Header del Calendario */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center shadow-sm">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold capitalize tracking-tight text-foreground">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => set_cursor(subMonths(cursor, 1))}
            className="h-8 w-8 hover:bg-background hover:shadow-sm rounded-lg transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => set_cursor(new Date())}
            className="h-8 px-3 font-semibold text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm rounded-lg transition-all"
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => set_cursor(addMonths(cursor, 1))}
            className="h-8 w-8 hover:bg-background hover:shadow-sm rounded-lg transition-all"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Leyenda superior */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
          {[
            { label: "Chequeo Plato", tipo: "Turno", titulo: "Chequeo Plato" },
            { label: "Purga de Trub", tipo: "Purga", titulo: "Purga" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-muted px-2.5 py-1.5 rounded-md border border-border"
            >
              <span
                className={cn("h-2.5 w-2.5 rounded-full shadow-sm", getEventColorClass(item, true))}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Grid del Calendario */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-black uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const in_month = isSameMonth(day, cursor);
            const is_today = isSameDay(day, new Date());
            const day_events = events_by_day(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[160px] md:min-h-[180px] rounded-2xl p-3 transition-all duration-300 flex flex-col group",
                  in_month
                    ? "bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30"
                    : "bg-muted/30 border border-transparent opacity-60",
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm md:text-base font-black transition-colors",
                      is_today
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200 dark:shadow-none"
                        : "text-foreground group-hover:bg-muted",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {/* Event counter removed per user request */}
                </div>

                <div className="space-y-2 flex-1">
                  {day_events.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={cn(
                        "whitespace-normal break-words leading-snug rounded-lg px-2.5 py-2 text-xs md:text-[13px] shadow-sm",
                        getEventColorClass(e),
                      )}
                    >
                      <div className="font-black mb-0.5">
                        {format(parseDateToMexico(e.inicio) || new Date(), "HH:mm")}
                      </div>
                      <div className="opacity-90 font-medium">{e.titulo}</div>
                    </div>
                  ))}
                  {day_events.length > 3 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2 py-1 rounded-md transition-colors w-full text-center mt-1">
                          +{day_events.length - 3} eventos
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-sky-500" />
                            Agenda del {format(day, "d 'de' MMMM", { locale: es })}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {day_events.map((e) => (
                            <div
                              key={e.id}
                              className={cn("rounded-xl p-4 shadow-sm", getEventColorClass(e))}
                            >
                              <div className="font-bold flex items-center gap-3 text-sm">
                                <span
                                  className={cn(
                                    "h-3 w-3 rounded-full shadow-sm",
                                    getEventColorClass(e, true),
                                  )}
                                />
                                <span>
                                  {format(parseDateToMexico(e.inicio) || new Date(), "HH:mm")}
                                </span>
                                <span className="opacity-50">•</span>
                                <span>{e.titulo}</span>
                              </div>
                              {e.descripcion && (
                                <p className="mt-2 text-xs opacity-90 pl-6 font-medium">
                                  {e.descripcion}
                                </p>
                              )}
                              {e.turno && (
                                <div className="mt-2 text-[10px] font-bold opacity-70 pl-6 uppercase tracking-wider">
                                  {e.turno}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
