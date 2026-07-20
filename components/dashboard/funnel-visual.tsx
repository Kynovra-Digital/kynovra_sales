import {
  ArrowRight,
  Box,
  ChevronRight,
  CircleDollarSign,
  Eye,
  FileText,
  Filter,
  MousePointerClick,
  Send,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FunnelStep } from "@/types/dashboard";

const stepIcons = [
  Eye,
  Box,
  FileText,
  UsersRound,
  Send,
  MousePointerClick,
  CircleDollarSign,
];
const stepGlow = [
  "border-primary/30 bg-primary/[0.08] text-blue-200 shadow-primary/10",
  "border-kynovra-tech-purple/30 bg-kynovra-tech-purple/[0.08] text-purple-200 shadow-kynovra-tech-purple/10",
  "border-sky-400/25 bg-sky-400/[0.07] text-sky-100 shadow-sky-400/10",
  "border-kynovra-digital-green/30 bg-kynovra-digital-green/[0.08] text-kynovra-digital-green shadow-kynovra-digital-green/10",
  "border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200 shadow-cyan-400/10",
  "border-kynovra-tech-purple/30 bg-kynovra-tech-purple/[0.08] text-purple-200 shadow-kynovra-tech-purple/10",
  "border-kynovra-digital-green/30 bg-kynovra-digital-green/[0.08] text-kynovra-digital-green shadow-kynovra-digital-green/10",
];

export function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  const peakValue = Math.max(
    ...steps.map((step) => Number(step.value.replace(/[^\d.-]/g, "")) || 0),
    1,
  );

  return (
    <div className="data-panel relative min-w-0 overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-lg tracking-[-0.02em]">
              Funil de Conversão
            </h2>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-medium text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
              Operacional
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
            {[
              "Vitrine",
              "Produto",
              "Pré-venda",
              "Sala",
              "Checkout enviado",
              "Checkout acessado",
              "Venda confirmada",
            ].map((label, index, items) => (
              <span className="inline-flex items-center gap-1.5" key={label}>
                <span>{label}</span>
                {index < items.length - 1 ? (
                  <ChevronRight className="size-3 text-muted-foreground/45" />
                ) : null}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Campanha", "Produto", "Período"].map((filter) => (
            <Button className="gap-2" key={filter} size="sm" variant="outline">
              <Filter data-icon="inline-start" />
              {filter}
            </Button>
          ))}
        </div>
      </div>
      <div className="premium-scrollbar mt-4 min-w-0 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex min-w-max snap-x gap-3 xl:grid xl:w-full xl:min-w-0 xl:grid-cols-7">
          {steps.map((step, index) => {
            const next = steps[index + 1];
            const Icon = stepIcons[index] ?? Eye;
            const numericValue =
              Number(step.value.replace(/[^\d.-]/g, "")) || 0;
            const intensity = Math.max(
              8,
              Math.round((numericValue / peakValue) * 100),
            );

            return (
              <div
                className="relative w-[8.75rem] shrink-0 snap-start xl:w-auto"
                key={step.label}
              >
                <div
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,rgb(255_255_255_/_0.065),rgb(255_255_255_/_0.025))] p-3 shadow-[0_0_34px_var(--tw-shadow-color)] transition-all duration-300 hover:-translate-y-0.5 hover:border-current/45 hover:bg-white/[0.045]",
                    stepGlow[index],
                  )}
                >
                  <div className="-right-6 -top-8 absolute size-24 rounded-full bg-current/10 blur-2xl" />
                  <div className="relative flex h-full flex-col justify-between gap-2 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-current/25 bg-current/10 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
                        <Icon className="size-3" />
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[10px] text-foreground/90 leading-3 tracking-[-0.01em]">
                        {step.label}
                      </p>
                      <div className="mt-1.5 flex items-end justify-between gap-2">
                        <p className="truncate font-semibold text-[1.35rem] text-foreground leading-none tracking-[-0.04em]">
                          {step.value}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground/80 leading-3">
                        {step.caption}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-current opacity-70 shadow-[0_0_14px_currentColor]"
                      style={{ width: `${intensity}%` }}
                    />
                  </div>
                </div>
                {next ? (
                  <>
                    <div className="-right-4 absolute top-1/2 hidden h-px w-4 -translate-y-1/2 bg-gradient-to-r from-primary/70 to-kynovra-tech-purple/60 xl:block" />
                    <ArrowRight className="-right-4 absolute top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full border border-primary/25 bg-background p-1 text-blue-200 shadow-[0_0_24px_rgb(37_99_235_/_0.22)] xl:block" />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
