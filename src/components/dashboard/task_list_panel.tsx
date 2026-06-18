import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ColorTheme = "sky" | "indigo" | "rose";

interface TaskItem {
  id: string;
  tanque: string;
  marca: string;
  date: Date;
}

interface TaskListPanelProps {
  title: string;
  subtitle: string;
  icon: any;
  emptyMessage: string;
  items: TaskItem[];
  colorTheme: ColorTheme;
  itemIcon: any;
  linkTo: string;
}

const colorClasses: Record<ColorTheme, { icon: string; bgGradient: string; itemIcon: string; badge: string }> = {
  sky: {
    icon: "text-sky-500",
    bgGradient: "from-sky-100 to-sky-50 border-sky-100",
    itemIcon: "text-sky-600",
    badge: "bg-sky-100/80 text-sky-700 border-sky-200/50",
  },
  indigo: {
    icon: "text-indigo-500",
    bgGradient: "from-indigo-100 to-indigo-50 border-indigo-100",
    itemIcon: "text-indigo-600",
    badge: "bg-indigo-100/80 text-indigo-700 border-indigo-200/50",
  },
  rose: {
    icon: "text-rose-500",
    bgGradient: "from-rose-100 to-rose-50 border-rose-100",
    itemIcon: "text-rose-600",
    badge: "bg-rose-100/80 text-rose-700 border-rose-200/50",
  }
};

export function TaskListPanel({ title, subtitle, icon: HeaderIcon, emptyMessage, items, colorTheme, itemIcon: ItemIcon, linkTo }: TaskListPanelProps) {
  const theme = colorClasses[colorTheme];

  return (
    <Card className="h-full border-border shadow-sm flex flex-col">
      <CardHeader className="pb-0 pt-5 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <HeaderIcon className={`h-4 w-4 ${theme.icon}`} />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {items.map((item) => (
              <Link 
                // @ts-ignore
                to={linkTo} 
                search={{ tanque: item.tanque }} 
                key={item.id} 
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${theme.bgGradient} border flex items-center justify-center shrink-0 shadow-sm`}>
                    <ItemIcon className={`h-4 w-4 ${theme.itemIcon}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground tracking-tight">Tanque {item.tanque}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 capitalize">{item.marca}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`px-2.5 py-1 ${theme.badge} rounded-md font-bold text-xs shadow-sm border`}>
                    {format(item.date, "HH:mm")}
                  </span>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 font-bold">
                    {format(item.date, "d MMM", { locale: es })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
