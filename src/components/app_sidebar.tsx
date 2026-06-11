import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Beaker, LineChart, ClipboardList, Beer, Clock } from "lucide-react";
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
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader className="border-b border-sidebar-border/60 bg-sidebar">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Beer className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">Elaboración</span>
              <span className="text-[11px] text-sidebar-foreground/50">Control Operativo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/35 font-semibold px-2 pb-2">
              Navegación
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = path === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`
                        h-9 rounded-md transition-all duration-100
                        ${active
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-2.5 px-2.5">
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                        <span className="text-[13px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border/60 px-3 py-3">
        {!collapsed && (
          <div className="text-center">
            <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-widest">Cervecería Zacatecas</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}