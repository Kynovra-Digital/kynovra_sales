import {
  ArrowRight,
  Box,
  Eye,
  FileText,
  Filter,
  Send,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FunnelStep = {
  caption: string;
  label: string;
  value: string;
};

const stepIcons = [Eye, Box, FileText, UsersRound, Send, Eye, ShoppingCart];
const stepGlow = [
  "border-primary/35 bg-primary/10 text-blue-200",
  "border-kynovra-tech-purple/35 bg-kynovra-tech-purple/10 text-purple-200",
  "border-primary/35 bg-primary/10 text-blue-200",
  "border-kynovra-digital-green/35 bg-kynovra-digital-green/10 text-kynovra-digital-green",
  "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  "border-kynovra-tech-purple/35 bg-kynovra-tech-purple/10 text-purple-200",
  "border-kynovra-digital-green/35 bg-kynovra-digital-green/10 text-kynovra-digital-green",
];

export function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="data-panel min-w-0 overflow-hidden p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-lg">Funil de Conversão</h2>
          <p className="line-clamp-1 text-muted-foreground text-sm">
            Vitrine → Produto → Pré-venda → Sala → Checkout enviado → Checkout
            acessado → Venda confirmada
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
            const currentValue = Number(step.value) || 0;
            const nextValue = Number(next?.value) || 0;
            const percent = next
              ? currentValue > 0
                ? Math.round((nextValue / currentValue) * 100)
                : 0
              : 100;
            const Icon = stepIcons[index] ?? Eye;

            return (
              <div
                className="relative w-[10.75rem] shrink-0 snap-start pb-7 xl:w-auto"
                key={step.label}
              >
                <div
                  className={cn(
                    "relative h-full min-h-[6.75rem] overflow-hidden rounded-xl border bg-[linear-gradient(180deg,rgb(255_255_255_/_0.07),rgb(255_255_255_/_0.032))] p-3 shadow-[0_0_32px_rgb(37_99_235_/_0.08)]",
                    stepGlow[index],
                  )}
                >
                  <div className="-right-6 -top-8 absolute size-20 rounded-full bg-current/10 blur-2xl" />
                  <div className="relative flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-current/25 bg-current/10">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-medium text-foreground text-xs leading-4">
                        {step.label}
                      </p>
                      <p className="mt-1.5 font-semibold text-xl text-foreground">
                        {step.value}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {step.caption}
                      </p>
                    </div>
                  </div>
                  {next ? (
                    <span className="-bottom-8 absolute left-1/2 rounded-full border border-white/10 bg-background px-3 py-1 font-mono text-[11px] text-blue-100 shadow-[0_0_18px_rgb(37_99_235_/_0.18)]">
                      {percent}%
                    </span>
                  ) : (
                    <span className="-bottom-8 absolute left-1/2 rounded-full border border-kynovra-digital-green/25 bg-background px-3 py-1 font-mono text-[11px] text-kynovra-digital-green">
                      final
                    </span>
                  )}
                </div>
                {next ? (
                  <>
                    <div className="-right-4 absolute top-[3.6rem] h-px w-4 bg-gradient-to-r from-primary/80 to-kynovra-tech-purple/70" />
                    <ArrowRight className="-right-5 absolute top-[3.25rem] z-10 size-6 rounded-full border border-primary/25 bg-background p-1 text-blue-200 shadow-[0_0_24px_rgb(37_99_235_/_0.22)]" />
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
