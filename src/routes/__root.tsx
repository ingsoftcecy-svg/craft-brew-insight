import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { NotFoundComponent } from "../components/core/not_found";
import { ErrorComponent } from "../components/core/error_boundary";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Craft Brew Insight" },
      { name: "description", content: "Craft Brew Insight App" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" },
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
      <body className="font-outfit antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { init, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = init();
    return () => unsubscribe && unsubscribe();
  }, [init]);

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
