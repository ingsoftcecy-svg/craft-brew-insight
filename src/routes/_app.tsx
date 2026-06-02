import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app_sidebar";
import { AppHeader } from "@/components/app_header";
import { useEffect } from "react";
import { useOperacionesStore } from "@/store/useOperacionesStore";

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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}