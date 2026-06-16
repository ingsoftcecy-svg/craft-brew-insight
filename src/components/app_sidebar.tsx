import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Beaker, LineChart, ClipboardList, CalendarDays, Clock } from "lucide-react";
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
  { title: "Dashboard",              url: "/",           icon: Home          },
  { title: "Agenda",                 url: "/agenda",     icon: Calendar      },
  { title: "Chequeo Plato (72 Hrs)", url: "/extracto72", icon: Clock         },
  { title: "Extractos (144 Hrs)",    url: "/extracto",   icon: Beaker        },
  { title: "Curvas Fermentación",    url: "/curvas",     icon: LineChart     },
  { title: "Purgas de Trub",         url: "/purgas",     icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-700/40 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 -z-10 pointer-events-none" />
      
      {/* Brand */}
      <SidebarHeader className="border-b border-white/10 bg-transparent pt-6 pb-5">
        <div className="flex items-center justify-center md:justify-start gap-3 px-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 transition-transform duration-300 hover:scale-105 group">
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CalendarDays className="h-5 w-5 text-white drop-shadow-md" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden animate-fade-in group-data-[collapsible=icon]:hidden">
              <span className="text-[15px] font-black text-white tracking-tight whitespace-nowrap">
                Elaboración
              </span>
              <span className="text-xs font-medium text-slate-400 mt-0.5 whitespace-nowrap">Control Operativo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-3 py-6">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold px-2 pb-3 group-data-[collapsible=icon]:hidden">
              Navegación General
            </SidebarGroupLabel>
          )}
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
                        group relative h-11 w-full rounded-lg transition-all duration-300 ease-out overflow-hidden
                        ${active
                          ? "bg-white/10 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.05)] ring-1 ring-white/10"
                          : "hover:bg-white/5 hover:shadow-sm"
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center z-10 w-full h-full">
                        {/* Indicador de activo */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.8)] group-data-[collapsible=icon]:hidden" />
                        )}
                        
                        <div className={`
                          flex items-center justify-center transition-all duration-300 shrink-0
                          ${active ? "text-amber-500 scale-110 drop-shadow-md" : "text-slate-400 group-hover:text-white group-hover:scale-110"}
                        `}>
                          <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                        </div>
                        
                        <span className={`
                          text-sm transition-colors duration-300 font-medium whitespace-nowrap group-data-[collapsible=icon]:hidden
                          ${active ? "text-white font-bold" : "text-slate-300 group-hover:text-white"}
                        `}>
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

      <SidebarFooter className="bg-transparent border-t border-white/10 p-4 relative overflow-hidden group-data-[collapsible=icon]:hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent -z-10 pointer-events-none" />
        {!collapsed && (
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] whitespace-nowrap">
              Zacatecas
            </p>
            <div className="h-0.5 w-8 rounded-full bg-slate-700" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}