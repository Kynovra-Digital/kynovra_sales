"use client";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { PublicAccessModalProps } from "@/types/public";

export function PublicAccessModal({
  description = "Faça login com e-mail e senha ou continue com Google para acessar esta área com segurança.",
  initialView = "choice",
  onOpenChange,
  open,
  redirectPath,
  title = "Como deseja continuar?",
}: PublicAccessModalProps) {
  const [view, setView] = useState<"choice" | "auth">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginHref = usePublicLoginHref(redirectPath);

  useEffect(() => {
    if (open) {
      setView(initialView);
    }
  }, [initialView, open]);

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();
    const authResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (authResult.error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }

    toast.success("Login realizado.");
    onOpenChange(false);
  }

  async function handleGoogleAuth() {
    setIsSubmitting(true);
    const nextPath = redirectPath || window.location.pathname;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
      provider: "google",
    });

    if (error) {
      setIsSubmitting(false);
      toast.error("Não foi possível iniciar o login com Google.");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="overflow-hidden border-white/10 bg-[#080808] p-0 text-white shadow-[0_0_80px_rgba(168,85,247,0.3)] sm:max-w-md"
        showCloseButton={false}
      >
        <div className="border-fuchsia-500/35 border-b bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,.24),transparent_42%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-5">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl text-white tracking-tight">
              {view === "choice" ? title : "Entrar na conta"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {view === "choice"
                ? description
                : "Faça login para continuar sem expor credenciais ou dados sensíveis no frontend."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5">
          {view === "choice" ? (
            <div className="space-y-3">
              <Button
                asChild
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 font-black text-white hover:from-violet-500 hover:to-fuchsia-400"
              >
                <Link href={loginHref}>
                  Fazer login com e-mail e senha
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                className="h-12 w-full rounded-xl border border-white/15 bg-white text-black shadow-[0_16px_40px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-[0_20px_50px_rgba(255,255,255,0.18)]"
                disabled={isSubmitting}
                onClick={handleGoogleAuth}
                type="button"
              >
                <span className="mr-2 flex size-5 items-center justify-center rounded-full border border-slate-200 bg-white font-black text-blue-600 text-sm shadow-sm">
                  G
                </span>
                Continuar com Google
              </Button>
              <p className="pt-2 text-center text-slate-400 text-xs leading-5">
                Use uma conta autenticada para continuar com segurança.
              </p>
            </div>
          ) : (
            <>
              <button
                className="mb-4 font-semibold text-slate-400 text-xs transition hover:text-white"
                onClick={() => setView("choice")}
                type="button"
              >
                ← Voltar
              </button>
              <Button
                className="mt-4 h-11 w-full rounded-xl border-white/15 bg-white text-black hover:bg-slate-100"
                disabled={isSubmitting}
                onClick={handleGoogleAuth}
                type="button"
              >
                <span className="mr-2 flex size-5 items-center justify-center rounded-full bg-white font-black text-blue-600 text-sm">
                  G
                </span>
                Logar com Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-slate-500 text-xs uppercase tracking-[0.18em]">
                <span className="h-px flex-1 bg-white/10" />
                ou
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form className="space-y-4" onSubmit={handleEmailAuth}>
                <div className="space-y-2">
                  <Label className="text-white" htmlFor="public-auth-email">
                    E-mail
                  </Label>
                  <Input
                    autoComplete="email"
                    className="h-11 border-white/10 bg-white/[0.04] text-white"
                    id="public-auth-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white" htmlFor="public-auth-password">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      autoComplete="current-password"
                      className="h-11 border-white/10 bg-white/[0.04] pr-11 text-white"
                      id="public-auth-password"
                      minLength={6}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
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

                <Button
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 font-black text-white hover:from-violet-500 hover:to-fuchsia-400"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Processando..." : "Entrar"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <p className="mt-4 text-center text-slate-400 text-xs leading-5">
                Ao continuar, sua sessão é autenticada pelo Supabase Auth.
                Nenhuma senha é armazenada no frontend.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function usePublicLoginHref(redirectPath?: string) {
  const [loginHref, setLoginHref] = useState(() =>
    buildPublicLoginHref(redirectPath),
  );

  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    setLoginHref(buildPublicLoginHref(redirectPath ?? currentPath));
  }, [redirectPath]);

  return loginHref;
}

function buildPublicLoginHref(redirectPath?: string) {
  const nextPath = sanitizePublicRedirectPath(redirectPath);
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

function sanitizePublicRedirectPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
