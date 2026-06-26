"use client";

import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Não foi possível entrar. Verifique e-mail e senha.");
        return;
      }

      toast.success("Acesso autorizado.");
      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.replace(nextPath || "/dashboard");
      router.refresh();
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050A18] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgb(37_99_235_/_0.28),transparent_26rem),radial-gradient(circle_at_85%_22%,rgb(124_58_237_/_0.24),transparent_28rem),radial-gradient(circle_at_52%_92%,rgb(16_185_129_/_0.12),transparent_24rem)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255_/_0.035)_1px,transparent_1px),linear-gradient(180deg,rgb(255_255_255_/_0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="hidden min-h-0 flex-col justify-between p-8 lg:flex xl:p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 font-bold text-blue-100 shadow-[0_0_26px_rgb(37_99_235_/_0.22)]">
                K
                <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-[#050A18] bg-kynovra-digital-green" />
              </span>
              <div>
                <span className="block font-bold text-sm tracking-[0.28em]">
                  KYNOVRA
                </span>
                <span className="block text-blue-300/80 text-xs tracking-[0.42em]">
                  SALES
                </span>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-kynovra-digital-green/25 bg-kynovra-digital-green/10 px-3 py-1.5 text-kynovra-digital-green text-xs">
              <Radio className="size-3.5" />
              Operação online
            </span>
          </div>

          <div className="max-w-3xl py-12">
            <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-blue-100 text-xs">
              Command Center comercial com IA
            </p>
            <h1 className="max-w-3xl font-semibold text-5xl leading-[1.02] tracking-normal xl:text-6xl">
              A central inteligente para vender, atender e escalar operações
              digitais.
            </h1>
            <p className="mt-6 max-w-2xl text-blue-100/82 text-lg leading-8">
              Campanhas, produtos, atendimento de venda, suporte pós-venda,
              permissões e IA em uma operação segura, rastreável e em tempo
              real.
            </p>

            <div className="mt-8 grid max-w-3xl gap-3 xl:grid-cols-3">
              {[
                {
                  description: "Tickets e mensagens em tempo real",
                  icon: Activity,
                  label: "Operação",
                  value: "ao vivo",
                },
                {
                  description: "Copiloto para vendas e suporte",
                  icon: Sparkles,
                  label: "IA",
                  value: "global",
                },
                {
                  description: "Equipes, permissões e auditoria",
                  icon: UsersRound,
                  label: "Governança",
                  value: "segura",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_46px_rgb(0_0_0_/_0.18)] backdrop-blur-xl"
                    key={item.label}
                  >
                    <Icon className="mb-4 size-5 text-blue-200" />
                    <p className="font-semibold text-2xl">{item.value}</p>
                    <p className="mt-1 font-medium text-sm">{item.label}</p>
                    <p className="mt-2 text-muted-foreground text-xs leading-5">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-3">
            <StatusStripItem icon={ShieldCheck} label="Auth Supabase" />
            <StatusStripItem icon={TrendingUp} label="CRM operacional" />
            <StatusStripItem icon={LockKeyhole} label="Acesso monitorado" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:border-white/10 lg:border-l lg:bg-black/10 lg:backdrop-blur-sm">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 font-bold text-blue-100">
                  K
                </span>
                <div>
                  <span className="block font-bold text-sm tracking-[0.25em]">
                    KYNOVRA
                  </span>
                  <span className="block text-blue-300/80 text-xs tracking-[0.36em]">
                    SALES
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-kynovra-digital-green/25 bg-kynovra-digital-green/10 px-3 py-1 text-kynovra-digital-green text-xs">
                <ShieldCheck className="size-3" />
                Seguro
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#080E1E]/88 p-5 shadow-[0_24px_80px_rgb(0_0_0_/_0.38)] backdrop-blur-2xl sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-200 text-sm">Acesso interno</p>
                  <h2 className="mt-2 font-semibold text-2xl">
                    Entrar no painel
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm leading-6">
                    Use suas credenciais autorizadas para acessar a operação do
                    Kynovra Sales.
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-blue-100">
                  <LockKeyhole className="size-6" />
                </span>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    autoComplete="email"
                    className="h-11 border-white/10 bg-white/[0.035]"
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
                      className="h-11 border-white/10 bg-white/[0.035] pr-11"
                      id="password"
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

                <Button
                  className="mt-2 h-11 gap-2 rounded-xl"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Validando acesso..." : "Entrar"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="size-4 text-kynovra-digital-green" />
                  <span className="font-medium">Ambiente seguro</span>
                </div>
                <p className="mt-2 text-muted-foreground text-xs leading-5">
                  Acesso monitorado pela Kynovra Sales. Sessões e permissões são
                  controladas pelo Supabase.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusStripItem({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-muted-foreground text-xs">
      <Icon className="size-4 text-blue-200" />
      <span className="truncate">{label}</span>
    </div>
  );
}
