import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth/action")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mode: typeof search.mode === "string" ? search.mode : undefined,
      oobCode: typeof search.oobCode === "string" ? search.oobCode : undefined,
      apiKey: typeof search.apiKey === "string" ? search.apiKey : undefined,
    };
  },
  component: AuthActionPage,
});

function AuthActionPage() {
  const { mode, oobCode } = Route.useSearch();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Solo soportamos el modo "resetPassword" por ahora
  if (mode !== "resetPassword" || !oobCode) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border bg-card/70 p-6 text-center">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-xl mb-2">Enlace Inválido</CardTitle>
          <CardDescription className="mb-6">
            El enlace de recuperación es inválido, ha expirado o el modo de acción no está soportado.
          </CardDescription>
          <Button onClick={() => navigate({ to: "/login" })} className="w-full">
            Volver al Inicio de Sesión
          </Button>
        </Card>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Password reset confirmation error:", err);
      // Códigos comunes de Firebase: auth/expired-action-code, auth/invalid-action-code
      setError("El enlace ha expirado o ya fue utilizado. Por favor, solicita uno nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground p-4 selection:bg-primary/30 selection:text-primary-foreground">
      {/* Premium Background Effects (Mismos que login) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-3xl opacity-70" />
        <div className="absolute top-[40%] -right-[10%] h-[60%] w-[40%] rounded-full bg-sidebar/20 blur-3xl opacity-70" />
        <div className="absolute -bottom-[20%] left-[20%] h-[50%] w-[60%] rounded-full bg-primary/10 blur-3xl opacity-70" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card/70 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

        <CardHeader className="space-y-4 pb-8 text-center pt-8">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl shadow-lg shadow-black/20 transition-transform duration-500 hover:scale-105 group overflow-hidden">
            <img
              src="/BREWMAN.jpeg"
              alt="Brewman Logo"
              className="w-full h-full object-cover animate-in slide-in-from-bottom-2 duration-700"
            />
          </div>
          <div className="space-y-1 animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
            <CardTitle className="text-3xl font-black tracking-tight text-foreground drop-shadow-sm">
              Nueva Contraseña
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Escribe tu nueva contraseña segura
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-backwards">
          {isSuccess ? (
            <div className="space-y-6 text-center animate-in zoom-in">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">¡Contraseña Actualizada!</h3>
                <p className="text-sm text-muted-foreground">
                  Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión con tu nueva credencial.
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: "/login" })}
                className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-yellow-500 text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02]"
              >
                Volver al Inicio de Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 text-center animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <div className="space-y-2.5 relative">
                <label className="text-sm font-bold tracking-wide text-foreground" htmlFor="newPassword">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border bg-background/50 pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 relative">
                <label className="text-sm font-bold tracking-wide text-foreground" htmlFor="confirmPassword">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border bg-background/50 pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-yellow-500 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40"
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span className="animate-pulse">Guardando...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 drop-shadow-sm">Guardar Contraseña</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
