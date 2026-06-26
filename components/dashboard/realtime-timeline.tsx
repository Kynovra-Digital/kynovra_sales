"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  MessageCircleMore,
  Package,
  Radio,
  ShieldAlert,
} from "lucide-react";
import type { ComponentType } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

const eventIcons: Record<string, ComponentType<{ className?: string }>> = {
  "Novo lead entrou na sala": Radio,
  "Checkout enviado": LockKeyhole,
  "Checkout acessado": ExternalLink,
  "Venda confirmada": CheckCircle2,
  "Suporte aberto": MessageCircleMore,
  "IA assumiu atendimento": Bot,
  "Estoque baixo": Package,
  "Falha de IA": ShieldAlert,
};

export function RealtimeTimeline({
  events,
}: {
  events: Tables<"notifications">[];
}) {
  return (
    <div className="data-panel min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-white/10 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/15 text-blue-200">
            <Activity className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-lg">Timeline em tempo real</h2>
            <p className="hidden text-muted-foreground text-sm sm:block">
              Eventos reais do Supabase com ações rápidas e leitura operacional.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          Ver todas
        </Button>
      </div>
      <div className="premium-scrollbar max-h-[420px] min-w-0 overflow-y-auto overflow-x-hidden">
        {events.length ? (
          events.map((event, index) => {
            const Icon = eventIcons[event.title] ?? Activity;

            return (
              <div
                className="group relative grid min-w-0 gap-2 border-white/10 border-b bg-white/[0.02] px-3 py-3 transition-colors last:border-b-0 hover:bg-white/[0.05] md:grid-cols-[3.25rem_minmax(0,1fr)_8rem_7.5rem] 2xl:grid-cols-[4rem_minmax(0,1fr)_10rem_8rem]"
                key={event.id}
              >
                {index < events.length - 1 ? (
                  <span className="absolute top-10 bottom-[-0.75rem] left-[4.45rem] hidden w-px bg-gradient-to-b from-primary/45 to-transparent md:block" />
                ) : null}
                <span className="text-muted-foreground text-xs md:pt-2">
                  {new Date(event.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex min-w-0 gap-3">
                  <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background text-blue-100 shadow-[0_0_18px_rgb(37_99_235_/_0.14)]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-sm">
                        {event.title}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-1 text-muted-foreground text-xs">
                      {event.body ?? "Evento registrado no Supabase."}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 overflow-hidden md:pt-1">
                  <StatusBadge label={event.type} />
                </div>
                <Button className="shrink-0" size="sm" variant="outline">
                  Abrir
                </Button>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-muted-foreground text-sm">
            Nenhum evento em tempo real registrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
