import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles/global.css?url";
import { NotFoundComponent } from "../components/core/not_found";
import { ErrorComponent } from "../components/core/error_boundary";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agenda de Control" },
      { name: "description", content: "Craft Brew Insight App" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="font-outfit">
      <head>
        <HeadContent />
      </head>
      <body className="font-outfit antialiased bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { init, isLoading, user } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const unsubscribe = init();
    return () => unsubscribe && unsubscribe();
  }, [init]);

  // Theme injector
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);

  // Prevención de Fuga de Datos (DLP)
  useEffect(() => {
    // Si no hay usuario, o si es el superusuario, no aplicar bloqueos
    const superUserEmail = "adminelaboracion@gmail.com";

    if (!user || user.email === superUserEmail) {
      document.body.classList.remove("dlp-active");
      return;
    }

    // Activar modo DLP
    document.body.classList.add("dlp-active");

    const preventAction = (e: Event) => {
      e.preventDefault();
    };

    const preventKeys = (e: KeyboardEvent) => {
      // Bloquear Ctrl+P, Ctrl+C, Ctrl+X, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && ["p", "c", "x", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventAction); // Click derecho
    document.addEventListener("copy", preventAction); // Copiar
    document.addEventListener("cut", preventAction); // Cortar
    document.addEventListener("keydown", preventKeys); // Atajos de teclado

    return () => {
      document.body.classList.remove("dlp-active");
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("keydown", preventKeys);
    };
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900"></div>
        </div>
      ) : (
        <Outlet />
      )}
    </QueryClientProvider>
  );
}
