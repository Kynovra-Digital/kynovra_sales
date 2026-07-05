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

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function handleGoogleSignUp() {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        options: {
          redirectTo: callbackUrl,
        },
        provider: "google",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro no cadastro com Google:", error);
      toast.error("Não foi possível continuar com Google. Tente novamente.");
      setIsGoogleLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
        password,
      });

      if (error) {
        toast.error("Não foi possível criar sua conta agora.");
        return;
      }

      if (!data.session) {
        setVerificationSent(true);
        toast.success("Conta criada. Confirme seu e-mail para entrar.");
        return;
      }

      toast.success("Conta criada com sucesso.");
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <AuthShell
      description="Crie seu acesso com e-mail e senha ou continue com Google para entrar no Kynovra Sales."
      eyebrow="Novo acesso"
      title="Criar conta"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email">E-mail</Label>
          <Input
            autoComplete="email"
            className="h-11 border-white/10 bg-white/[0.045]"
            id="signup-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password">Senha</Label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-11 border-white/10 bg-white/[0.045] pr-11"
              id="signup-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha segura"
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
          {isPending ? "Criando conta..." : "Criar conta"}
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
        onClick={handleGoogleSignUp}
        type="button"
        variant="outline"
      >
        {isGoogleLoading ? (
          <div className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Redirecionando..." : "Continuar com Google"}
      </Button>

      {verificationSent ? (
        <div className="mt-4 rounded-lg border border-blue-300/20 bg-blue-500/10 p-3">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <MailCheck className="size-4" />
            <span className="font-medium">Verificação de e-mail enviada</span>
          </div>
          <p className="mt-2 text-muted-foreground text-xs leading-5">
            Confirme sua conta pelo link enviado ao e-mail cadastrado. Depois
            disso, entre normalmente pela tela de login.
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-center text-muted-foreground text-sm">
        Já tem conta?{" "}
        <Link
          className="font-medium text-blue-200 transition-colors hover:text-white"
          href="/login"
        >
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
