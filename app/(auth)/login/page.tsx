"use client";

import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthShell, GoogleMark } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const nextPath = getSafeLoginNextPath();
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : undefined;

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro no login com Google:", error);
      toast.error("Não foi possível entrar com Google. Tente novamente.");
      setIsGoogleLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const loginErrorMessage = resolveLoginErrorMessage(error.message);
        const isUnconfirmed = loginErrorMessage.type === "unconfirmed";

        if (isUnconfirmed) {
          setNeedsVerification(true);
          toast.warning(loginErrorMessage.message);
          return;
        }

        toast.error(loginErrorMessage.message);
        return;
      }

      toast.success("Acesso autorizado.");
      router.replace(nextPath);
      router.refresh();
    });
  }

  function handleResendVerification() {
    if (!email) {
      toast.warning("Informe seu e-mail para reenviar a verificação.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
        type: "signup",
      });

      if (error) {
        toast.error("Não foi possível reenviar a verificação agora.");
        return;
      }

      toast.success("E-mail de verificação reenviado.");
      setNeedsVerification(true);
    });
  }

  return (
    <AuthShell
      description="Use suas credenciais autorizadas ou entre com Google para acessar o Kynovra Sales."
      eyebrow="Acesso interno"
      title="Entrar no painel"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            autoComplete="email"
            className="h-11 border-white/10 bg-white/[0.045]"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              className="text-blue-200 text-xs transition-colors hover:text-white"
              href="/forgot-password"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Input
              autoComplete="current-password"
              className="h-11 border-white/10 bg-white/[0.045] pr-11"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button className="mt-2 h-11 gap-2 rounded-lg" disabled={isPending}>
          {isPending ? "Validando acesso..." : "Entrar"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#070D1B] px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <Button
        className="h-11 w-full gap-2 rounded-lg border border-white/10 bg-white text-slate-950 hover:bg-slate-100"
        disabled={isGoogleLoading}
        onClick={handleGoogleSignIn}
        type="button"
        variant="outline"
      >
        {isGoogleLoading ? (
          <div className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Redirecionando..." : "Entrar com Google"}
      </Button>

      {needsVerification ? (
        <div className="mt-4 rounded-lg border border-blue-300/20 bg-blue-500/10 p-3">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <MailCheck className="size-4" />
            <span className="font-medium">Verificação de e-mail pendente</span>
          </div>
          <p className="mt-2 text-muted-foreground text-xs leading-5">
            Enviamos um link para confirmar sua conta. Depois de confirmar,
            volte para esta tela e entre normalmente.
          </p>
          <Button
            className="mt-3 h-9 rounded-lg"
            disabled={isPending}
            onClick={handleResendVerification}
            type="button"
            variant="outline"
          >
            Reenviar verificação
          </Button>
        </div>
      ) : null}

      <p className="mt-5 text-center text-muted-foreground text-sm">
        Ainda não tem conta?{" "}
        <Link
          className="font-medium text-blue-200 transition-colors hover:text-white"
          href="/cadastro"
        >
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}

function getSafeLoginNextPath() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function resolveLoginErrorMessage(message: string): {
  message: string;
  type: "invalid" | "rate-limit" | "unconfirmed" | "unknown";
} {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("not confirmed") ||
    normalizedMessage.includes("confirm")
  ) {
    return {
      message: "Confirme seu e-mail antes de entrar.",
      type: "unconfirmed",
    };
  }

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return {
      message: "E-mail ou senha inválidos. Confira os dados e tente novamente.",
      type: "invalid",
    };
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return {
      message:
        "Muitas tentativas de login. Aguarde um pouco e tente novamente.",
      type: "rate-limit",
    };
  }

  return {
    message: "Não foi possível entrar agora. Tente novamente em instantes.",
    type: "unknown",
  };
}
