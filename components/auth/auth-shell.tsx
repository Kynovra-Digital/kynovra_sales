import {
  Activity,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import type { AuthShellProps } from "@/types/auth";

const signalItems = [
  { icon: Activity, label: "Atendimento", value: "ao vivo" },
  { icon: Sparkles, label: "Ofertas", value: "em destaque" },
  { icon: UsersRound, label: "Especialistas", value: "prontos" },
];

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(239,68,68,.22),transparent_30rem),radial-gradient(circle_at_88%_22%,rgba(124,58,237,.18),transparent_32rem),radial-gradient(circle_at_48%_100%,rgba(16,185,129,.12),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(430px,.72fr)]">
        <section className="hidden min-h-0 flex-col justify-between p-8 lg:flex xl:p-10">
          <BrandHeader />

          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-red-200 text-xs uppercase tracking-[0.18em]">
              <Radio className="size-3.5 text-red-500" />
              Loja protegida
            </div>
            <h1 className="max-w-4xl font-black text-5xl uppercase leading-[1.02] tracking-tight xl:text-7xl">
              Compre com quem entende sua jornada.
            </h1>
            <p className="mt-6 max-w-2xl text-slate-300 text-lg leading-8">
              Ofertas em destaque, atendimento ao vivo com especialistas e
              suporte pos-venda em um unico lugar.
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
                      <Icon className="size-5 text-red-300" />
                      <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-red-500 via-violet-400 to-emerald-400" />
                    </div>
                    <p className="font-black text-2xl uppercase tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-1 text-slate-400 text-sm">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-3">
            <StatusPill icon={ShieldCheck} label="Supabase Auth" />
            <StatusPill icon={LockKeyhole} label="Acesso monitorado" />
            <StatusPill icon={Zap} label="Resposta em tempo real" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6 lg:border-white/10 lg:border-l lg:bg-black/15 lg:backdrop-blur-md">
          <div className="w-full max-w-[452px]">
            <div className="mb-8 lg:hidden">
              <BrandHeader compact />
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-6">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-red-400/80 to-transparent" />
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-red-500 text-xs uppercase tracking-[0.24em]">
                    {eyebrow}
                  </p>
                  <h2 className="mt-2 font-black text-3xl uppercase tracking-tight">
                    {title}
                  </h2>
                  <p className="mt-2 text-slate-400 text-sm leading-6">
                    {description}
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-none border border-red-500/30 bg-red-500/10 text-red-200 shadow-[0_0_24px_rgba(239,68,68,.22)]">
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
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-none border border-red-500/40 bg-red-500/10 font-black text-red-100 shadow-[0_0_26px_rgba(239,68,68,.28)]">
          K
          <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-[#070707] bg-emerald-400" />
        </span>
        <div className="min-w-0">
          <span className="block truncate font-black text-sm tracking-[0.24em]">
            KYNOVRA
          </span>
          <span className="block truncate text-red-300/80 text-xs tracking-[0.34em]">
            SALES
          </span>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-emerald-300 text-xs">
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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[.035] px-3 py-2 text-slate-400 text-xs">
      <Icon className="size-4 shrink-0 text-red-300" />
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
