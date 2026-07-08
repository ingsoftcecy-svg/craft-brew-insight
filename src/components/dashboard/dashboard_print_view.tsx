import { format } from "date-fns";
import { ChequeoGrupo, PurgaGrupo } from "@/hooks/useDashboardData";

interface DashboardPrintViewProps {
  turnoActual: string | null;
  ahora: Date;
  chequeosDelTurno: ChequeoGrupo[];
  purgasDelTurno: PurgaGrupo[];
}

export function DashboardPrintView({
  turnoActual,
  ahora,
  chequeosDelTurno,
  purgasDelTurno,
}: DashboardPrintViewProps) {
  const chequeos = chequeosDelTurno.flatMap((c) =>
    c.items.map((item) => ({
      tipo: c.label,
      tanque: item.tanque,
      marca: item.marca,
      date: item.date,
      isPurga: false,
    })),
  );

  const purgas = purgasDelTurno.flatMap((p) =>
    p.items.map((item) => ({
      tipo: p.tituloPurga,
      tanque: item.tanque,
      marca: item.marca,
      date: item.date,
      isPurga: true,
    })),
  );

  const allItems = [...chequeos, ...purgas].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="hidden print:block w-full text-black bg-white print:p-2">
      <style type="text/css" media="print">
        {`
          @page { size: portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>
      <div className="mb-3 border-b pb-2">
        <h1 className="text-xl font-bold uppercase">Checklist de Verificación de Fermentación</h1>
        <p className="text-xs text-gray-600 mt-1">
          Turno: {turnoActual} | Fecha: {format(ahora, "dd/MM/yyyy HH:mm")}
        </p>
      </div>

      <table className="w-full border-collapse border border-black text-left text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1 font-bold text-center w-[40px]">Hora</th>
            <th className="border border-black p-1 font-bold text-left w-[50px]">Tanque</th>
            <th className="border border-black p-1 font-bold text-left w-[120px]">Marca</th>
            <th className="border border-black p-1 font-bold text-left w-[60px]">Actividad</th>
            <th className="border border-black p-1 font-bold text-left w-[25%]">
              Ph/Tiempo de purga
            </th>
            <th className="border border-black p-1 font-bold text-left w-[25%]">Chequeo Presión</th>
            <th className="border border-black p-1 font-bold text-left w-[25%]">°Plato</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item, i) => (
            <tr key={i} className={item.isPurga ? "bg-red-50/30" : ""}>
              <td className="border border-black p-1 text-center font-medium whitespace-nowrap">
                {format(item.date, "HH:mm")}
              </td>
              <td className="border border-black p-1 font-semibold text-left whitespace-nowrap">
                T-{item.tanque}
              </td>
              <td className="border border-black p-1 text-left truncate max-w-[120px]">
                {item.marca}
              </td>
              <td className="border border-black p-1 text-left text-gray-700 font-medium whitespace-nowrap">
                {item.isPurga ? (
                  <span className="text-rose-700">{item.tipo}</span>
                ) : (
                  <span>{item.tipo}</span>
                )}
              </td>

              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
              <td className="border border-black p-1"></td>
            </tr>
          ))}
          {allItems.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-black p-2 text-center text-gray-500 italic">
                No hay chequeos ni purgas programadas para este turno
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
