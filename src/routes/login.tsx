import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { CalendarDays, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      console.error(err);
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 p-4 selection:bg-amber-100 selection:text-amber-900">
      {/* Premium Background Effects (Light Mode) - Optimized for performance */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-amber-300/30 blur-3xl opacity-70" />
        <div className="absolute top-[40%] -right-[10%] h-[60%] w-[40%] rounded-full bg-amber-100/40 blur-3xl opacity-70" />
        <div className="absolute -bottom-[20%] left-[20%] h-[50%] w-[60%] rounded-full bg-orange-200/30 blur-3xl opacity-70" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/70 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        {/* Shimmer Effect Border */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="space-y-4 pb-8 text-center pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 transition-transform duration-500 hover:scale-105 group">
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CalendarDays className="h-10 w-10 text-white drop-shadow-md animate-in slide-in-from-bottom-2 duration-700" />
          </div>
          <div className="space-y-1 animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 drop-shadow-sm">
              Cold Block
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Control de Purgas en Fermentación
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-backwards">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}
            <div className="space-y-2.5">
              <label className="text-sm font-bold tracking-wide text-slate-700" htmlFor="email">
                Correo Corporativo
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@modelo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-white/50 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-amber-500 transition-all duration-300 shadow-sm"
              />
            </div>
            <div className="space-y-2.5 relative">
              <label className="text-sm font-bold tracking-wide text-slate-700" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white/50 pl-4 pr-12 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-amber-500 transition-all duration-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-500/40"
                disabled={isLoading}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span className="animate-pulse">Autenticando...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 drop-shadow-sm">
                    Iniciar Sesión
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
