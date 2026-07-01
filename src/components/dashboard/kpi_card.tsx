import { Card, CardContent } from "@/components/ui/card";

export interface KpiProps {
  label: string;
  value: number | string;
  icon: any;
  sub?: string;
  color: string;
  bg: string;
}

export function KpiCard({ label, value, icon: Icon, sub, color, bg }: KpiProps) {
  return (
    <Card className="border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
      <div
        className={`absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150 ${bg}`}
      />
      <CardContent className="flex items-center gap-4 p-6 relative z-10">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bg} shadow-inner`}
        >
          <Icon className={`h-7 w-7 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-extrabold text-foreground tracking-tight drop-shadow-sm">
            {value}
          </p>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/60 font-bold mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
