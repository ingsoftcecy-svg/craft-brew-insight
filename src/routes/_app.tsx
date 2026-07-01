import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app_sidebar";
import { AppHeader } from "@/components/layout/app_header";
import { useEffect } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import "../lib/firebase";

import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const fetchData = useOperacionesStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const user = useAuthStore((state) => state.user);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-50 selection:bg-amber-100 selection:text-amber-900">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col bg-transparent">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden min-w-0">
            {user && !user.emailVerified && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex items-center justify-between animate-in fade-in">
                <div>
                  <h3 className="font-bold text-amber-800">Verificación de Correo Requerida</h3>
                  <p className="text-sm text-amber-700">
                    Firebase requiere que verifiques tu correo electrónico antes de poder activar la
                    Autenticación en 2 Pasos (MFA).
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const { sendEmailVerification } = await import("firebase/auth");
                    try {
                      await sendEmailVerification(user);
                      alert(
                        "¡Correo enviado! Revisa tu bandeja de entrada (y la carpeta de spam), haz clic en el enlace y luego recarga esta página.",
                      );
                    } catch (err) {
                      console.error(err);
                      alert(
                        "Error al enviar el correo. Espera unos minutos y vuelve a intentarlo.",
                      );
                    }
                  }}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                >
                  Enviar correo de verificación
                </button>
              </div>
            )}
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
