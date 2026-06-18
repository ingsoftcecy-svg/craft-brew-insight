import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_app/admin/qr-print")({
  component: QRPrintPage,
});

function QRPrintPage() {
  const tanques = Array.from({ length: 140 }, (_, i) => i + 1);
  const [baseUrl, setBaseUrl] = useState("http://10.225.69.184");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Reemplazar localhost con la IP de la red local (manual para el usuario)
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Generador de Códigos QR</h1>
          <p className="text-slate-500">Imprime estas etiquetas para pegarlas en los tanques físicos.</p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Códigos
        </Button>
      </div>

      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl print:hidden">
        <div className="max-w-md space-y-2">
          <Label htmlFor="baseurl">Enlace Base de los QR</Label>
          <Input 
            id="baseurl"
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 print:grid-cols-4 print:gap-4">
        {tanques.map((tanque) => {
          const scanUrl = `${baseUrl}/scan/${tanque}`;
          return (
            <div 
              key={tanque} 
              className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl bg-white page-break-inside-avoid"
            >
              <div className="font-bold text-2xl mb-2">UNITANQUE {tanque}</div>
              <QRCodeSVG 
                value={scanUrl} 
                size={120}
                level="H"
                includeMargin={true}
              />
              <div className="text-xs text-slate-400 mt-2 truncate w-full text-center">
                Escanear para purgas
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Estilos específicos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-7xl, .max-w-7xl * {
            visibility: visible;
          }
          .max-w-7xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
