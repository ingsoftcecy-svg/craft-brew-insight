import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/_app/admin/qr-print")({
  component: QRPrintPage,
});

function QRPrintPage() {
  const tanques = Array.from({ length: 140 }, (_, i) => i + 1);
  const [baseUrl, setBaseUrl] = useState("http://10.225.69.184");
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    // Abrir ventana limpia solo con los QR
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    // Recopilar todos los SVG de los QR
    const cards = qrContainerRef.current?.querySelectorAll('.qr-card');
    if (!cards) return;

    let cardsHtml = '';
    cards.forEach((card) => {
      cardsHtml += `<div class="qr-card">${card.innerHTML}</div>`;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Unitanques - Imprimir</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          @page { size: auto; margin: 10mm; }
          .qr-card {
            width: 15cm;
            height: 15cm;
            margin: 0 auto;
            border: 2px solid #1e293b;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
          .qr-card:last-child {
            page-break-after: auto;
          }
          /* Header */
          .qr-card > div:first-child {
            background: #1e293b;
            text-align: center;
            padding: 0.6cm 0.5cm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .qr-card > div:first-child span {
            display: block;
            color: white;
          }
          .qr-card > div:first-child span:first-child {
            font-size: 0.7cm;
            font-weight: 800;
            letter-spacing: 0.3em;
            text-transform: uppercase;
          }
          .qr-card > div:first-child span:last-child {
            font-size: 1.8cm;
            font-weight: 900;
            line-height: 1;
          }
          /* QR */
          .qr-card > div:nth-child(2) {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5cm;
          }
          .qr-card > div:nth-child(2) svg {
            width: 8cm !important;
            height: 8cm !important;
          }
          /* Footer */
          .qr-card > div:last-child {
            text-align: center;
            padding: 0.4cm;
            font-size: 0.4cm;
            color: #94a3b8;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        ${cardsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Generador de Códigos QR</h1>
          <p className="text-slate-500">Imprime estas etiquetas para pegarlas en los tanques físicos.</p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Códigos
        </Button>
      </div>

      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
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

      <div ref={qrContainerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {tanques.map((tanque) => {
          const scanUrl = `${baseUrl}/scan/${tanque}`;
          return (
            <div 
              key={tanque} 
              className="qr-card flex flex-col items-center overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header con color */}
              <div className="w-full py-2.5 px-3 bg-gradient-to-r from-slate-800 to-slate-700 text-center">
                <span className="text-white font-extrabold text-sm tracking-widest uppercase">
                  Unitanque
                </span>
                <span className="block text-white font-black text-3xl leading-tight -mt-0.5">
                  {tanque}
                </span>
              </div>
              {/* QR */}
              <div className="flex-1 flex items-center justify-center py-4 px-3">
                <QRCodeSVG 
                  value={scanUrl} 
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>
              {/* Footer */}
              <div className="w-full py-2 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Escanear para purgas
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
