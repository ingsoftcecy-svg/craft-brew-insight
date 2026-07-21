import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  MultiFactorResolver,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { CalendarDays, Eye, EyeOff, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
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
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { redirect: redirectUrl } = Route.useSearch();

  // MFA States
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationId, setVerificationId] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [selectedHintIndex, setSelectedHintIndex] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);

        // Limpiar y recrear reCAPTCHA para SMS
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        } catch (ignored) {
          // Ignorar error al limpiar recaptcha
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } else {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico primero.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + "/login",
        handleCodeInApp: false
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccessMsg("Te hemos enviado un enlace para restablecer tu contraseña.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Error al enviar el correo. Verifica que tu dirección sea correcta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!mfaResolver) return;
    setIsLoading(true);
    setError("");

    try {
      // Asegurar que el reCAPTCHA esté listo
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }

      const phoneInfoOptions = {
        multiFactorHint: mfaResolver.hints[selectedHintIndex],
        session: mfaResolver.session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier,
      );

      setVerificationId(verId);
      setShowSmsInput(true);
    } catch (err: any) {
      console.error("MFA SMS Error:", err.code, err.message);
      // Limpiar reCAPTCHA para que se pueda reintentar
      try {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } catch (ignored) {
        // Ignorar error al limpiar recaptcha
      }
      setError(`Error al enviar SMS: ${err.code || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !verificationId || !smsCode) return;

    setIsLoading(true);
    setError("");

    try {
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      await mfaResolver.resolveSignIn(multiFactorAssertion);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error("MFA verification error:", err);
      setError("Código incorrecto o expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background text-foreground p-4 selection:bg-primary/30 selection:text-primary-foreground">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-3xl opacity-70" />
        <div className="absolute top-[40%] -right-[10%] h-[60%] w-[40%] rounded-full bg-sidebar/20 blur-3xl opacity-70" />
        <div className="absolute -bottom-[20%] left-[20%] h-[50%] w-[60%] rounded-full bg-primary/10 blur-3xl opacity-70" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card/70 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        {/* Shimmer Effect Border */}
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
              Agenda de Control
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Purgas y Chequeo de Platos
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-backwards">
          <div id="recaptcha-container"></div>

          {!mfaResolver ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 text-center animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 border border-green-100 text-center animate-in slide-in-from-top-2">
                  {successMsg}
                </div>
              )}
              <div className="space-y-2.5 relative">
                <label className="text-sm font-bold tracking-wide text-foreground" htmlFor="email">
                  Correo Corporativo
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@modelo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-border bg-background/50 pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 shadow-sm"
                />
              </div>
              <div className="space-y-2.5 relative">
                <label
                  className="text-sm font-bold tracking-wide text-foreground"
                  htmlFor="password"
                >
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
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-xs font-semibold text-primary hover:underline focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
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
                      <span className="animate-pulse">Autenticando...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 drop-shadow-sm">Iniciar Sesión</span>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            // MFA UI
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Verificación en dos pasos</h3>
                <p className="text-sm text-slate-500">Por seguridad, verifica tu identidad.</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 text-center animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              {!showSmsInput ? (
                <div className="pt-2">
                  {mfaResolver.hints.length > 1 && (
                    <div className="space-y-2.5 mb-4 text-left">
                      <label
                        className="text-sm font-bold tracking-wide text-slate-700"
                        htmlFor="phoneSelect"
                      >
                        Selecciona tu número celular:
                      </label>
                      <select
                        id="phoneSelect"
                        value={selectedHintIndex}
                        onChange={(e) => setSelectedHintIndex(Number(e.target.value))}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white/50 px-4 text-slate-900 focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500 shadow-sm transition-all"
                      >
                        {mfaResolver.hints.map((hint: any, index: number) => (
                          <option key={index} value={index}>
                            {hint.phoneNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button
                    onClick={handleSendSMS}
                    className="h-12 w-full rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-md relative"
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar código por SMS"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setMfaResolver(null)}
                    className="w-full mt-2 text-slate-500 relative"
                    disabled={isLoading}
                  >
                    Volver
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifySMS} className="space-y-4 pt-2">
                  <div className="space-y-2.5 relative">
                    <label
                      className="text-sm font-bold tracking-wide text-slate-700"
                      htmlFor="smsCode"
                    >
                      Código SMS (6 dígitos)
                    </label>
                    <Input
                      id="smsCode"
                      type="text"
                      placeholder="123456"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      className="h-12 text-center text-xl tracking-[0.25em] font-mono rounded-xl border-slate-200 bg-white/50 text-slate-900 focus-visible:border-amber-500 focus-visible:ring-amber-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 relative"
                    disabled={isLoading || smsCode.length < 6}
                  >
                    {isLoading ? "Verificando..." : "Confirmar Código"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
