import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, TrendingUp, Users, Clock, Calendar as CalendarIcon, AlertTriangle, ShieldAlert } from "lucide-react";
import { obtenerTurnoPorHora, TipoTurno } from "@/data/turno";
import confetti from "canvas-confetti";
import { parseMexicanDate } from "@/lib/utils";

const FULL_NAMES: Record<string, string> = {
  "LAMD": "Luis Adolfo Maldonado",
  "MJFA": "Manuel de Jesus Falcon Arroyo",
  "VHAL": "Victor Hugo Asencio Leyva",
  "OEVM": "Oscar Eduardo Valdez Muñoz",
  "ORC": "Oscar Rodriguez Codallos",
  "PLRG": "Pedro Luis Rodriguez Gomez"
};

function OperatorPodium({ op, rank }: { op: any; rank: 1 | 2 | 3 }) {
  const [imgError, setImgError] = useState(false);
  const upperName = (op.name || "").toUpperCase();
  
  useEffect(() => {
    setImgError(false);
  }, [upperName]);
  
  const rankConfig = {
    1: { size: "h-16 w-16", border: "border-amber-400", bg: "bg-amber-100", shadow: "shadow-amber-500/30", badgeBg: "bg-amber-600", badgeBorder: "border-amber-100", icon: <Trophy className="h-8 w-8 text-amber-500" /> },
    2: { size: "h-14 w-14", border: "border-slate-300", bg: "bg-slate-200", shadow: "shadow-slate-400/20", badgeBg: "bg-slate-700", badgeBorder: "border-slate-200", icon: <Medal className="h-6 w-6 text-slate-500" /> },
    3: { size: "h-12 w-12", border: "border-orange-300", bg: "bg-orange-100", shadow: "shadow-orange-900/20", badgeBg: "bg-orange-800", badgeBorder: "border-orange-100", icon: <Medal className="h-5 w-5 text-orange-600" /> }
  };
  
  const conf = rankConfig[rank];

  return (
    <div className="flex flex-col items-center mb-3">
      <div className="relative mb-2">
        <div className={`${conf.size} rounded-full overflow-hidden ${conf.bg} border-4 ${conf.border} flex items-center justify-center shadow-lg ${conf.shadow}`}>
          {!imgError ? (
            <img 
              src={`/${upperName}.png`} 
              alt={upperName} 
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            conf.icon
          )}
        </div>
        <span className={`absolute -bottom-1 -right-1 ${conf.badgeBg} text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 ${conf.badgeBorder}`}>{rank}</span>
      </div>
      <span className={`font-black text-foreground text-center truncate max-w-full px-2 ${rank === 1 ? 'text-base' : 'text-sm'}`}>{upperName}</span>
      <span className={`font-bold ${rank === 1 ? 'text-xs text-amber-600 dark:text-amber-500' : 'text-[10px] text-muted-foreground'}`}>{op.count} pts</span>
    </div>
  );
}

function OperatorRow({ op, index }: { op: any; index: number }) {
  const [imgError, setImgError] = useState(false);
  const upperName = (op.name || "").toUpperCase();
  
  useEffect(() => {
    setImgError(false);
  }, [upperName]);

  const fullName = FULL_NAMES[upperName];
  const displayName = fullName ? `${fullName} (${upperName})` : upperName;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 relative overflow-hidden
          ${index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300' : 
            index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-300' : 
            index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-300' : 
            'bg-muted text-muted-foreground'}
        `}>
          {!imgError ? (
            <img 
              src={`/${upperName}.png`} 
              alt={upperName} 
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-sm text-foreground capitalize leading-none truncate">{displayName}</div>
          <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" /> {op.totalTime} min
            {op.mainTurno !== "N/A" && (
              <span className="ml-1 bg-secondary px-1.5 py-0.5 rounded text-[9px] flex-shrink-0">{op.mainTurno}</span>
            )}
          </div>
        </div>
      </div>
      <div className="font-black text-primary bg-primary/10 px-2 py-1 rounded-md text-sm">
        {op.count}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking y Efectividad" },
      { name: "description", content: "Ranking de desempeño por turnos y métricas de cumplimiento." },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const { purgas, extractos, periodoActual, periodosDisponibles, fetchData } = useOperacionesStore();
  const [activeTab, setActiveTab] = useState<"purgas" | "platos">("purgas");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFirstPlaceHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + 30) / window.innerHeight; // Un poco más abajo del borde superior

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y }
    });
  };

  const { rankingOperadores, rankingTurnos, totalOlvidadas } = useMemo(() => {
    const operatorStats: Record<string, { name: string; count: number; totalTime: number; turnos: Record<string, number> }> = {};
    const shiftStats: Record<TipoTurno, { completed: number; missed: number }> = {
      "Turno 1": { completed: 0, missed: 0 },
      "Turno 2": { completed: 0, missed: 0 },
      "Turno 3": { completed: 0, missed: 0 },
    };
    
    let missedTotal = 0;
    const now = new Date();

    purgas.forEach((row) => {
      row.purgas.forEach((purga) => {
        if (!purga.fechaHora) return; // Si no tiene fecha programada, no podemos evaluarla

        const turno = obtenerTurnoPorHora(purga.fechaHora);
        if (!turno) return;

        const isCompleted = purga.tiempo && purga.realiza;
        const taskDate = new Date(purga.fechaHora);
        const isPast = taskDate <= now;

        if (isCompleted) {
          // COMPLETED
          shiftStats[turno].completed += 1;

          // Operator logic
          const rawName = (purga.realiza || "").trim();
          const normalizedName = rawName.toLowerCase();
          
          if (!operatorStats[normalizedName]) {
            operatorStats[normalizedName] = {
              name: rawName,
              count: 0,
              totalTime: 0,
              turnos: {},
            };
          }
          
          operatorStats[normalizedName].count += 1;
          operatorStats[normalizedName].totalTime += Number(purga.tiempo);
          operatorStats[normalizedName].turnos[turno] = (operatorStats[normalizedName].turnos[turno] || 0) + 1;
          
        } else if (isPast) {
          // MISSED (No completada y ya pasó su hora)
          shiftStats[turno].missed += 1;
          missedTotal += 1;
        }
      });
    });

    const sortedOperators = Object.values(operatorStats)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.totalTime - b.totalTime;
      });
      
    const opsConTurno = sortedOperators.map(op => {
      let mainTurno = "N/A";
      let maxCount = 0;
      Object.entries(op.turnos).forEach(([t, c]) => {
        if (c > maxCount) {
          maxCount = c;
          mainTurno = t;
        }
      });
      return { ...op, mainTurno };
    });

    const sortedShifts = Object.entries(shiftStats)
      .map(([name, data]) => {
        const totalEsperadas = data.completed + data.missed;
        const effectiveness = totalEsperadas > 0 ? Math.round((data.completed / totalEsperadas) * 100) : 0;
        return { 
          name, 
          completed: data.completed, 
          missed: data.missed, 
          totalEsperadas,
          effectiveness 
        };
      })
      .sort((a, b) => {
        if (b.effectiveness !== a.effectiveness) return b.effectiveness - a.effectiveness;
        return b.completed - a.completed;
      });

    return { 
      rankingOperadores: opsConTurno, 
      rankingTurnos: sortedShifts,
      totalOlvidadas: missedTotal
    };
  }, [purgas]);

  const { rankingTurnosPlatos, totalOlvidadasPlatos } = useMemo(() => {
    const shiftStats: Record<TipoTurno, { completed: number; missed: number }> = {
      "Turno 1": { completed: 0, missed: 0 },
      "Turno 2": { completed: 0, missed: 0 },
      "Turno 3": { completed: 0, missed: 0 },
    };
    let missedTotal = 0;
    const now = new Date();
    const intervals = ["24", "48", "72", "96", "120", "128", "136", "144"];

    extractos.forEach((r: any) => {
      intervals.forEach(horas => {
        const propNameFecha = `h${horas}`;
        const propNameEstado = `estado${horas}h`;
        
        if (!r[propNameFecha]) return;

        const turno = obtenerTurnoPorHora(r[propNameFecha]);
        if (!turno) return;

        const isCompleted = r[propNameEstado] === "Completado";
        const taskDate = parseMexicanDate(r[propNameFecha]);
        const isPast = taskDate ? taskDate <= now : false;

        if (isCompleted) {
          shiftStats[turno].completed += 1;
        } else if (isPast) {
          shiftStats[turno].missed += 1;
          missedTotal += 1;
        }
      });
    });

    const sortedShifts = Object.entries(shiftStats)
      .map(([name, data]) => {
        const totalEsperadas = data.completed + data.missed;
        const effectiveness = totalEsperadas > 0 ? Math.round((data.completed / totalEsperadas) * 100) : 0;
        return { 
          name, 
          completed: data.completed, 
          missed: data.missed, 
          totalEsperadas,
          effectiveness 
        };
      })
      .sort((a, b) => {
        if (b.effectiveness !== a.effectiveness) return b.effectiveness - a.effectiveness;
        return b.completed - a.completed;
      });

    return { 
      rankingTurnosPlatos: sortedShifts,
      totalOlvidadasPlatos: missedTotal
    };
  }, [extractos]);

  const renderRankingCards = (rankingData: any[]) => (
    <div className="grid gap-4 md:grid-cols-3">
      {rankingData.map((turno, index) => {
        const isWinner = index === 0 && turno.totalEsperadas > 0 && turno.effectiveness > 0;
        
        const colorClass = 
          turno.name === "Turno 1" ? "bg-blue-500" :
          turno.name === "Turno 2" ? "bg-primary" :
          "bg-amber-500";
          
        const bgLight = 
          turno.name === "Turno 1" ? "bg-blue-500/10 border-blue-500/30" :
          turno.name === "Turno 2" ? "bg-primary/10 border-primary/30" :
          "bg-amber-500/10 border-amber-500/30";

        return (
          <Card key={turno.name} className={`relative overflow-hidden border-2 ${isWinner ? 'border-amber-400 shadow-lg shadow-amber-500/20' : 'border-border'} hover:border-foreground/20 transition-colors`}>
            {isWinner && (
              <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
                <Award className="w-3 h-3" /> MAYOR CUMPLIMIENTO
              </div>
            )}
            <CardContent className={`p-6 ${isWinner ? 'bg-amber-400/5' : bgLight}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-xl text-foreground flex items-center gap-2">
                    <Users className={`h-5 w-5 ${
                      turno.name === "Turno 1" ? "text-blue-500" :
                      turno.name === "Turno 2" ? "text-primary" :
                      "text-amber-500"
                    }`} />
                    {turno.name}
                  </h3>
                </div>
                <div className={`text-3xl font-black tracking-tighter ${turno.effectiveness < 80 ? 'text-red-500' : 'text-foreground'}`}>
                  {turno.effectiveness}%
                </div>
              </div>
              
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full ${turno.effectiveness < 80 ? 'bg-red-500' : colorClass} transition-all duration-1000 ease-out`} 
                  style={{ width: `${turno.effectiveness}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-background/60 p-2 rounded-lg border border-border">
                  <div className="text-muted-foreground text-xs font-semibold mb-1">Completadas</div>
                  <div className="font-bold text-foreground">{turno.completed} <span className="text-[10px] font-normal">/ {turno.totalEsperadas}</span></div>
                </div>
                <div className={`p-2 rounded-lg border ${turno.missed > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-background/60 border-border'}`}>
                  <div className={`${turno.missed > 0 ? 'text-red-500/80' : 'text-muted-foreground'} text-xs font-semibold mb-1 flex items-center gap-1`}>
                    {turno.missed > 0 && <AlertTriangle className="w-3 h-3" />} Olvidadas
                  </div>
                  <div className={`font-bold ${turno.missed > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                    {turno.missed}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderWallOfShame = (totalOlv: number, rankingData: any[], suffix: string) => {
    if (totalOlv === 0) return null;
    return (
      <Card className="border-red-500/30 bg-red-500/5 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-black tracking-wide">
            <ShieldAlert className="w-5 h-5" />
             NO COMPLETADAS
          </div>
          <div className="font-bold text-sm bg-red-800/40 px-2 py-0.5 rounded-md">
            {totalOlv} {suffix}
          </div>
        </div>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-red-500/10">
            {rankingData.map(turno => (
              <div key={turno.name} className="flex-1 p-4 flex items-center justify-between sm:flex-col sm:justify-center sm:items-center sm:text-center sm:gap-2">
                <div className="font-bold text-foreground">{turno.name}</div>
                <div className="flex items-center gap-2">
                  {turno.missed === 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-lg">
                      <Trophy className="w-3 h-3" /> ¡Perfecto!
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-black text-2xl">
                      {turno.missed}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
            <Trophy className="h-8 w-8 text-amber-500" />
            Efectividad de Turnos
          </h1>
          <p className="text-muted-foreground font-medium">
            Cumplimiento y desempeño individual por turno.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Tabs / Toggle UI */}
          <div className="bg-card/50 backdrop-blur-sm border border-border p-1.5 rounded-xl shadow-sm h-12 inline-flex w-full sm:w-auto items-center">
            <button
              className={`flex-1 px-4 sm:px-6 h-full rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center ${
                activeTab === "purgas" 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => setActiveTab("purgas")}
            >
              Purgas
            </button>
            <button
              className={`flex-1 px-4 sm:px-6 h-full rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center ${
                activeTab === "platos" 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => setActiveTab("platos")}
            >
              Chequeo de Platos
            </button>
          </div>

          <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border p-1.5 rounded-xl shadow-sm h-12 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
            <Select value={periodoActual} onValueChange={(v) => fetchData(v)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-none rounded-lg h-full font-bold focus:ring-0 shadow-sm">
                <SelectValue placeholder="Selecciona un mes" />
              </SelectTrigger>
              <SelectContent>
                {periodosDisponibles.map((p) => {
                  const [y, m] = p.split("-");
                  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                  const mesStr = date.toLocaleString("es-MX", { month: "long", year: "numeric" });
                  return (
                    <SelectItem key={p} value={p} className="font-medium">
                      {mesStr.charAt(0).toUpperCase() + mesStr.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {activeTab === "purgas" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
          {renderRankingCards(rankingTurnos)}
          {renderWallOfShame(totalOlvidadas, rankingTurnos, "purgas")}

          <div className="grid gap-6 md:grid-cols-12">
            {/* PODIUM SECTION */}
            <Card className="md:col-span-12 xl:col-span-7 border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Top Operadores
                </CardTitle>
                <CardDescription>Los 3 mejores operadores del periodo</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-8">
                {rankingOperadores.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10 font-medium">
                    No hay suficientes datos registrados.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-end justify-center gap-2 sm:gap-4 lg:gap-8 h-48 mt-4">
                    {/* 2ND PLACE */}
                    {rankingOperadores.length > 1 && (
                      <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-150 relative z-10 w-full sm:w-1/3">
                        <OperatorPodium op={rankingOperadores[1]} rank={2} />
                        <div className="w-full bg-gradient-to-t from-slate-200/50 to-slate-100/80 dark:from-slate-800 dark:to-slate-700/80 h-24 rounded-t-lg border-t-2 border-slate-300 dark:border-slate-500 shadow-inner flex items-end justify-center pb-2 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}

                    {/* 1ST PLACE */}
                    {rankingOperadores.length > 0 && (
                      <div 
                        className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-700 z-20 w-full sm:w-1/3 cursor-default"
                        onMouseEnter={handleFirstPlaceHover}
                      >
                        <OperatorPodium op={rankingOperadores[0]} rank={1} />
                        <div className="w-full bg-gradient-to-t from-amber-200/50 to-amber-100/80 dark:from-amber-900/50 dark:to-amber-800/80 h-32 rounded-t-lg border-t-2 border-amber-400 shadow-inner flex items-end justify-center pb-2 relative overflow-hidden group">
                             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}

                    {/* 3RD PLACE */}
                    {rankingOperadores.length > 2 && (
                      <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-300 relative z-0 w-full sm:w-1/3">
                        <OperatorPodium op={rankingOperadores[2]} rank={3} />
                        <div className="w-full bg-gradient-to-t from-orange-200/50 to-orange-100/80 dark:from-orange-950/50 dark:to-orange-900/80 h-16 rounded-t-lg border-t-2 border-orange-300 dark:border-orange-700 shadow-inner flex items-end justify-center pb-2 relative overflow-hidden group">
                             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LIST SECTION */}
            <Card className="md:col-span-12 xl:col-span-5 border-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                    Operadores
                </CardTitle>
                <CardDescription>Puntos totales acumulados</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {rankingOperadores.length === 0 ? (
                     <div className="text-center text-sm text-muted-foreground py-4">No hay datos</div>
                  ) : (
                    rankingOperadores.map((op, index) => (
                      <OperatorRow key={op.name} op={op} index={index} />
                    ))
                  )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "platos" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
          {renderRankingCards(rankingTurnosPlatos)}
          {renderWallOfShame(totalOlvidadasPlatos, rankingTurnosPlatos, "platos")}
        </div>
      )}
    </div>
  );
}
