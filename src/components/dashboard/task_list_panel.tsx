import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ColorTheme = "sky" | "indigo" | "rose";

interface TaskItem {
  id: string;
  realId?: string;
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
  baseSearchParams?: Record<string, any>;
}

const colorClasses: Record<
  ColorTheme,
  { icon: string; bgGradient: string; itemIcon: string; badge: string }
> = {
  sky: {
    icon: "text-blue-500",
    bgGradient: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    itemIcon: "text-blue-500",
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  indigo: {
    icon: "text-primary",
    bgGradient: "from-primary/10 to-primary/5 border-primary/20",
    itemIcon: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  rose: {
    icon: "text-destructive",
    bgGradient: "from-destructive/10 to-destructive/5 border-destructive/20",
    itemIcon: "text-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function TaskListPanel({
  title,
  subtitle,
  icon: HeaderIcon,
  emptyMessage,
  items,
  colorTheme,
  itemIcon: ItemIcon,
  linkTo,
  baseSearchParams = {},
}: TaskListPanelProps) {
  const theme = colorClasses[colorTheme];

  return (
    <Card className="h-full border-border shadow-sm flex flex-col">
      <CardHeader className="pb-0 pt-5 px-5">
        <Link
          // @ts-ignore
          to={linkTo}
          // @ts-ignore
          search={baseSearchParams as any}
          className="group/header block cursor-pointer"
        >
          <CardTitle className="text-sm font-semibold flex items-center text-foreground w-full">
            <HeaderIcon className={`h-4 w-4 mr-2 ${theme.icon}`} />
            <span className="group-hover/header:underline">{title}</span>
            {items.length > 0 && (
              <span
                className={`ml-auto px-2 py-0.5 rounded-md text-xs font-bold border shadow-sm ${theme.badge}`}
              >
                {items.length}
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium mt-1">{subtitle}</p>
        </Link>
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
                // @ts-ignore
                search={
                  {
                    tanque: item.tanque,
                    targetId: item.realId || item.id,
                    ...baseSearchParams,
                  } as any
                }
                key={item.id}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-br ${theme.bgGradient} border flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <ItemIcon className={`h-4 w-4 ${theme.itemIcon}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground tracking-tight">
                      Tanque {item.tanque}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 capitalize">
                      {item.marca}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span
                    className={`px-2.5 py-1 ${theme.badge} rounded-md font-bold text-xs shadow-sm border`}
                  >
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
