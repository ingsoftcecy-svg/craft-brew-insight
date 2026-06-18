import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANDS } from "@/data/brands";

interface TableFiltersProps {
  query: string;
  setQuery: (val: string) => void;
  periodoActual: string;
  setPeriodo: (val: string) => void;
  periodosDisponibles: string[];
  marca: string;
  setMarca: (val: string) => void;
  turno: string;
  setTurno: (val: string) => void;
  resetPage?: () => void;
}

export function TableFilters({
  query,
  setQuery,
  periodoActual,
  setPeriodo,
  periodosDisponibles,
  marca,
  setMarca,
  turno,
  setTurno,
  resetPage
}: TableFiltersProps) {
  const handleChange = (handler: (val: string) => void) => (val: string) => {
    handler(val);
    if (resetPage) resetPage();
  };

  return (
    <>
      <div className="relative w-56 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (resetPage) resetPage(); }}
          placeholder="Buscar por tanque..."
          className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium"
        />
      </div>
      
      <Select value={periodoActual} onValueChange={handleChange(setPeriodo)}>
        <SelectTrigger className="w-36 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {periodosDisponibles.map((p) => {
            const [y, m] = p.split("-");
            const date = new Date(parseInt(y), parseInt(m) - 1, 1);
            const mesStr = date.toLocaleString("es-MX", { month: "long", year: "numeric" });
            return (
              <SelectItem key={p} value={p}>
                {mesStr.charAt(0).toUpperCase() + mesStr.slice(1)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Select value={marca} onValueChange={handleChange(setMarca)}>
        <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium">
          <SelectValue placeholder="Marca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las marcas</SelectItem>
          {BRANDS.map(b => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={turno} onValueChange={handleChange(setTurno)}>
        <SelectTrigger className="w-40 bg-slate-50 border-slate-200 rounded-xl h-10 font-medium">
          <SelectValue placeholder="Turno" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los turnos</SelectItem>
          <SelectItem value="Turno 1">Turno 1</SelectItem>
          <SelectItem value="Turno 2">Turno 2</SelectItem>
          <SelectItem value="Turno 3">Turno 3</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
