import { ArrowDownAZ, ArrowUpZA } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePageLayoutProps {
  title: string;
  subtitle: string;
  headerAction?: React.ReactNode;
  filters: React.ReactNode;
  sortOrder: "desc" | "asc";
  onSortToggle: () => void;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}

export function TablePageLayout({
  title,
  subtitle,
  headerAction,
  filters,
  sortOrder,
  onSortToggle,
  children,
  pagination,
}: TablePageLayoutProps) {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          {filters}
          <Button
            variant="outline"
            className="gap-2 bg-background border-border text-foreground hover:bg-muted hover:text-foreground hover:border-border rounded-lg h-9 px-3 text-sm font-medium w-full md:w-auto md:ml-auto transition-all"
            onClick={onSortToggle}
          >
            {sortOrder === "desc" ? (
              <>
                <ArrowDownAZ className="h-4 w-4 text-muted-foreground" /> Más recientes
              </>
            ) : (
              <>
                <ArrowUpZA className="h-4 w-4 text-muted-foreground" /> Más antiguos
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mt-4">
        <div className="p-0">
          <div className="pt-0">{children}</div>
          {pagination}
        </div>
      </div>
    </div>
  );
}
