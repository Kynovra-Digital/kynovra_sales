"use client";

import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  function formatBrazilianPhone(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (fullName.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error("Informe um número de telefone válido.");
      return;
    }

    const fullPhone = `+55${phoneDigits}`;

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        options: {
          data: { full_name: fullName, phone: fullPhone },
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
      description="Crie seu acesso com e-mail, senha e telefone para entrar no Kynovra Sales."
      eyebrow="Novo acesso"
      title="Criar conta"
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-full-name">Nome completo</Label>
          <Input
            autoComplete="name"
            className="h-10 border-white/10 bg-white/[0.045]"
            id="signup-full-name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Seu nome completo"
            required
            type="text"
            value={fullName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email">E-mail</Label>
          <Input
            autoComplete="email"
            className="h-10 border-white/10 bg-white/[0.045]"
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
              className="h-10 border-white/10 bg-white/[0.045] pr-11"
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-confirm-password">Confirmação de senha</Label>
          <div className="relative">
            <Input
              autoComplete="new-password"
              className="h-10 border-white/10 bg-white/[0.045] pr-11"
              id="signup-confirm-password"
              minLength={6}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a senha"
              required
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-phone-number">Telefone celular</Label>
          <div className="flex">
            <span
              aria-hidden="true"
              className="inline-flex h-10 select-none items-center rounded-l-lg border border-r-0 border-white/10 bg-white/[0.045] px-3 text-sm text-white/70"
            >
              +55
            </span>
            <Input
              autoComplete="tel-national"
              className="h-10 rounded-l-none border-white/10 bg-white/[0.045]"
              id="signup-phone-number"
              inputMode="numeric"
              maxLength={15}
              onChange={(event) =>
                setPhone(formatBrazilianPhone(event.target.value))
              }
              placeholder="(99) 9 9999-9999"
              required
              type="tel"
              value={phone}
            />
          </div>
        </div>

        <Button className="mt-1 h-10 gap-2 rounded-lg" disabled={isPending}>
          {isPending ? "Criando conta..." : "Criar conta"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

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
