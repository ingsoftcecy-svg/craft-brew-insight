import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Calendar,
  Beaker,
  ClipboardList,
  CalendarDays,
  Clock,
  LogOut,
  Printer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Gráficos", url: "/graficos", icon: TrendingUp },
  { title: "Chequeo de Platos", url: "/extracto", icon: Beaker },
  { title: "Purgas de Trub", url: "/purgas", icon: ClipboardList },
  { title: "QR de Unitanques", url: "/admin/qr-print", icon: Printer },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Ranking", url: "/ranking", icon: Trophy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await useAuthStore.getState().signOut();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar
      collapsible="icon"
      className="print:hidden border-r border-sidebar-border shadow-sm overflow-hidden bg-sidebar/90 backdrop-blur-xl"
    >
      {/* Brand */}
      <SidebarHeader className="border-b border-sidebar-border bg-transparent pt-6 pb-5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pt-6 group-data-[collapsible=icon]:pb-5">
        <div className="flex items-center justify-center md:justify-start gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md shadow-primary/20 transition-transform duration-300 hover:scale-105 group group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <img src="/BREWMAN.jpeg" alt="Brewman Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden animate-fade-in group-data-[collapsible=icon]:hidden">
              <span className="text-[15px] font-black text-sidebar-foreground tracking-tight whitespace-nowrap">
                Cold Block
              </span>
              <span className="text-xs font-medium text-sidebar-foreground/70 mt-0.5 whitespace-nowrap">
                Control De Purgas
              </span>
              <span className="text-xs font-medium text-sidebar-foreground/70 mt-0.5 whitespace-nowrap">
                En Fermentación
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-3 py-6 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = path === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        group relative h-11 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto
                        ${
                          active
                            ? "bg-primary/10 shadow-sm ring-1 ring-primary/30"
                            : "hover:bg-sidebar-accent hover:shadow-sm"
                        }
                      `}
                    >
                      <Link
                        to={item.url}
                        className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center z-10 w-full h-full"
                      >
                        {/* Indicador de activo */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-sm group-data-[collapsible=icon]:hidden" />
                        )}

                        <div
                          className={`
                          flex items-center justify-center transition-all duration-300 shrink-0
                          ${active ? "text-primary scale-110" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground group-hover:scale-110"}
                        `}
                        >
                          <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                        </div>

                        <span
                          className={`
                          text-sm transition-colors duration-300 font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden
                          ${active ? "text-primary font-bold" : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"}
                        `}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-transparent border-t border-sidebar-border p-4 relative overflow-hidden group-data-[collapsible=icon]:hidden">
        {!collapsed && (
          <div className="flex flex-col gap-4">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-sidebar-foreground/80 bg-sidebar-accent/50 hover:bg-sidebar-accent hover:text-sidebar-foreground rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.25em] whitespace-nowrap">
                Cerveceria Zacatecas
              </p>
              <p className="text-[8px] font-bold text-sidebar-foreground/50 tracking-[0.25em] whitespace-nowrap">
                Creado: Ing. en Soft. Cecilia Solis
              </p>
              <div className="h-0.5 w-8 rounded-full bg-sidebar-border" />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
