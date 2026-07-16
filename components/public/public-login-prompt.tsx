"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePublicAuth } from "@/hooks/use-public-auth";
import { initGoogleOneTap } from "@/lib/google/one-tap";
import { createClient } from "@/lib/supabase/client";

type PublicLoginPromptProps = {
  description?: string;
  onLoginComplete?: () => void;
  redirectPath?: string;
  title?: string;
};

export function PublicLoginPrompt({
  description = "Faça login com e-mail e senha ou continue com Google para acessar sua sala de atendimento.",
  onLoginComplete,
  redirectPath,
  title = "Identifique-se para continuar",
}: PublicLoginPromptProps) {
  const { signInWithGoogle, isLoading } = usePublicAuth();
  const loginHref = usePublicLoginHref(redirectPath);

  useEffect(() => {
    const supabase = createClient();
    initGoogleOneTap(supabase, (message) => {
      console.error("One Tap login error:", message);
    });
  }, []);

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      onLoginComplete?.();
    } catch (error) {
      console.error("Erro no login:", error);
    }
  }

  return (
    <main className="public-surface grid min-h-screen place-items-center p-4 text-slate-900">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-[2.5rem] border border-white bg-white/80 p-8 text-center shadow-[0_40px_120px_-20px_rgba(15,23,42,0.15)] backdrop-blur-md md:p-12"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-[2rem] border border-blue-100 bg-blue-50 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]">
          <Sparkles className="size-10 text-blue-600" />
        </div>

        <div className="mt-8">
          <span className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.25em]">
            Área do Cliente
          </span>
          <h1 className="mt-3 font-bold text-3xl text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-500 font-medium">
            {description}
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <Button
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] gap-3"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            size="lg"
          >
            {isLoading ? (
              <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <span className="flex size-5 items-center justify-center rounded-full border border-white/40 bg-white font-black text-blue-600 text-sm shadow-sm">
                  G
                </span>
                Entrar com Google
              </>
            )}
          </Button>

          <Button
            asChild
            className="w-full h-12 rounded-xl border-blue-100 bg-white text-blue-700 hover:bg-blue-50 gap-3"
            size="lg"
            variant="outline"
          >
            <Link href={loginHref}>Login com e-mail e senha</Link>
          </Button>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-6 py-4 text-blue-700 text-sm font-bold flex items-center justify-center gap-3">
            <ShieldCheck className="size-4" />
            Ambiente seguro e criptografado
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <p>
              Ao entrar, você concorda com nossos Termos de Uso e Política de
              Privacidade.
            </p>
            <p className="font-medium">
              Seus dados estão protegidos e não compartilhamos informações sem
              seu consentimento.
            </p>
          </div>
        </div>
      </motion.section>
    </main>
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
