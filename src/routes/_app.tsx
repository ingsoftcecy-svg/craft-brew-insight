import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app_sidebar";
import { AppHeader } from "@/components/app_header";
import { useEffect } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import { auth, storage, firestore } from "@/lib/firebase";
import '../lib/firebase'; // Asegura que la configuración se ejecute al inicio

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const fetchData = useOperacionesStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6 overflow-x-hidden min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}