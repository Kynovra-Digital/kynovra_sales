import {
  Activity,
  Bot,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

const signalItems = [
  { icon: Activity, label: "Tickets", value: "tempo real" },
  { icon: Bot, label: "IA", value: "supervisionada" },
  { icon: UsersRound, label: "Equipe", value: "permissões" },
];

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(37,99,235,.34),transparent_30rem),radial-gradient(circle_at_92%_18%,rgba(124,58,237,.28),transparent_32rem),radial-gradient(circle_at_45%_100%,rgba(16,185,129,.15),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(430px,.72fr)]">
        <section className="hidden min-h-0 flex-col justify-between p-8 lg:flex xl:p-10">
          <BrandHeader />

          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-blue-100 text-xs">
              <Radio className="size-3.5 text-kynovra-digital-green" />
              Operação comercial protegida
            </div>
            <h1 className="max-w-4xl font-semibold text-5xl leading-[1.02] tracking-normal xl:text-7xl">
              Entre no centro de comando da operação digital.
            </h1>
            <p className="mt-6 max-w-2xl text-blue-100/78 text-lg leading-8">
              Vendas, suporte, campanhas, auditoria e IA em um painel pensado
              para times que precisam responder rápido sem perder controle.
            </p>

            <div className="mt-10 grid max-w-3xl gap-3 xl:grid-cols-3">
              {signalItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[.055] p-4 shadow-[0_22px_70px_rgba(0,0,0,.28)] backdrop-blur-xl"
                    key={item.label}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <Icon className="size-5 text-blue-200" />
                      <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400" />
                    </div>
                    <p className="font-semibold text-2xl">{item.value}</p>
                    <p className="mt-1 text-blue-100/70 text-sm">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-3">
            <StatusPill icon={ShieldCheck} label="Supabase Auth" />
            <StatusPill icon={LockKeyhole} label="Acesso monitorado" />
            <StatusPill icon={Zap} label="OAuth Google" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:border-white/10 lg:border-l lg:bg-black/10 lg:backdrop-blur-md">
          <div className="w-full max-w-[452px]">
            <div className="mb-8 lg:hidden">
              <BrandHeader compact />
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#070D1B]/92 p-5 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-6">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-blue-200 text-sm">{eyebrow}</p>
                  <h2 className="mt-2 font-semibold text-3xl tracking-normal">
                    {title}
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm leading-6">
                    {description}
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/15 text-blue-100 shadow-[0_0_24px_rgba(37,99,235,.18)]">
                  <Sparkles className="size-5" />
                </span>
              </div>

              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-primary/15 font-bold text-blue-100 shadow-[0_0_26px_rgba(37,99,235,.22)]">
          K
          <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-[#030711] bg-kynovra-digital-green" />
        </span>
        <div className="min-w-0">
          <span className="block truncate font-bold text-sm tracking-[0.24em]">
            KYNOVRA
          </span>
          <span className="block truncate text-blue-300/80 text-xs tracking-[0.34em]">
            SALES
          </span>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-2 rounded-full border border-kynovra-digital-green/25 bg-kynovra-digital-green/10 px-3 py-1.5 text-kynovra-digital-green text-xs">
        <ShieldCheck className="size-3" />
        {compact ? "Seguro" : "Online"}
      </span>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[.035] px-3 py-2 text-muted-foreground text-xs">
      <Icon className="size-4 shrink-0 text-blue-200" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg
      aria-label="Google logo"
      className="size-5"
      role="img"
      viewBox="0 0 24 24"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
