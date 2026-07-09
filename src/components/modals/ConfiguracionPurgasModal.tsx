import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { PurgasConfig } from "@/types/proceso";

const MARCAS = [
  "Corona",
  "Corona Light E",
  "Corona E",
  "Corona Light Shine",
  "Corona Golden Light",
  "Chocolate Negra",
  "Negra Modelo",
  "Limon y Sal",
  "Modelo Pura Malta",
  "Modelo E",
  "Michelob Ultra",
  "Bud Light",
  "Bud Light Chelada",
  "Pacifico",
  "Pacifico Suave",
  "Pacifico Light",
  "Pacifico E",
  "Barrilito",
  "Flying Fish",
  "Estrella",
  "Estrella E",
  "Victoria",
  "Modelo Especial",
  "Busch",
  "Budweiser",
];

interface ConfiguracionPurgasModalProps {
  onClose: () => void;
}

export function ConfiguracionPurgasModal({ onClose }: ConfiguracionPurgasModalProps) {
  const purgasConfigStore = useOperacionesStore((s) => s.purgasConfig);
  const updatePurgasConfig = useOperacionesStore((s) => s.updatePurgasConfig);
  const aplicarConfiguracionActivos = useOperacionesStore((s) => s.aplicarConfiguracionActivos);

  const [config, setConfig] = useState<PurgasConfig>({});
  const [isSaving, setIsSaving] = useState(false);
  const [aplicarActivos, setAplicarActivos] = useState(false);

  useEffect(() => {
    // Inicializar con la config actual de Firebase, rellenando las que faltan con valores por defecto
    const initialConfig: PurgasConfig = {};
    MARCAS.forEach((marca) => {
      initialConfig[marca] = purgasConfigStore[marca] || { cantidad: 8, cadaHrs: 8 };
    });
    setConfig(initialConfig);
  }, [purgasConfigStore]);

  const handleChange = (marca: string, field: "cantidad" | "cadaHrs", value: string) => {
    const num = parseInt(value, 10);
    setConfig((prev) => ({
      ...prev,
      [marca]: {
        ...prev[marca],
        [field]: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updatePurgasConfig(config);
      if (aplicarActivos) {
        await aplicarConfiguracionActivos(config);
      }
      onClose();
    } catch (err) {
      console.error("Error saving config:", err);
      alert("Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center bg-slate-900 p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-tight">Configuración de Purgas</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p>
                Por defecto, estos ajustes aplicarán <strong>únicamente para los tanques nuevos</strong> que se escaneen de ahora en adelante.
              </p>
              <label className="flex items-center gap-2 mt-1 cursor-pointer font-bold text-amber-900 bg-amber-100 p-2 rounded-md hover:bg-amber-200 transition-colors w-fit">
                <input
                  type="checkbox"
                  checked={aplicarActivos}
                  onChange={(e) => setAplicarActivos(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                Aplicar estos cambios también a los tanques activos en curso.
              </label>
            </div>
          </div>

          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-2 font-bold text-slate-700">Marca de Cerveza</th>
                <th className="pb-2 font-bold text-slate-700 text-center w-32">Cada (Hrs)</th>
                <th className="pb-2 font-bold text-slate-700 text-center w-32">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {MARCAS.map((marca) => (
                <tr key={marca} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-semibold text-slate-800">{marca}</td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={48}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={config[marca]?.cadaHrs || ""}
                      onChange={(e) => handleChange(marca, "cadaHrs", e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={config[marca]?.cantidad || ""}
                      onChange={(e) => handleChange(marca, "cantidad", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
