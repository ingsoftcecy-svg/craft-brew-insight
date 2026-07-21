import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number; // 0-indexed page for backward compatibility, or 1-indexed.
  setPage: (page: number | ((prev: number) => number)) => void;
  totalItems: number;
  itemsPerPage: number;
  isZeroIndexed?: boolean;
}

export function TablePagination({
  page,
  setPage,
  totalItems,
  itemsPerPage,
  isZeroIndexed = true,
}: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const displayPage = isZeroIndexed ? page + 1 : page;

  const canGoPrev = isZeroIndexed ? page > 0 : page > 1;
  const canGoNext = isZeroIndexed ? page < pages - 1 : page < pages;

  const handlePrev = () => {
    if (canGoPrev) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (canGoNext) setPage((p) => p + 1);
  };

  if (pages <= 1) return null;

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-sm p-4 bg-muted/50 border-t border-border gap-4">
      <span className="text-muted-foreground font-medium">
        Mostrando registros {(displayPage - 1) * itemsPerPage + 1}–
        {Math.min(displayPage * itemsPerPage, totalItems)} de {totalItems} · Página {displayPage} de{" "}
        {pages}
      </span>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={handlePrev}
          className="font-semibold text-muted-foreground hover:text-foreground shadow-sm bg-background border-border"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={handleNext}
          className="font-semibold text-muted-foreground hover:text-foreground shadow-sm bg-background border-border"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
