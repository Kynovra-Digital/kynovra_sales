"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileCheck2,
  History,
  MessageCircleMore,
  Package,
  Send,
  Smile,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AIHarnessPanel } from "@/components/chat/ai-harness-panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { getGlobalAISettings } from "@/lib/supabase/queries/ai-settings";
import {
  listSupportMessages,
  type SupportTicketView,
  sendSupportMessage,
  subscribeSupportMessages,
} from "@/lib/supabase/queries/support";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

export function SupportWorkspace({ session }: { session: SupportTicketView }) {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mode] = useState<"auto" | "copilot">("copilot");
  const { data: messages = [] } = useQuery({
    queryFn: () => listSupportMessages(session.id),
    queryKey: queryKeys.support.messages(session.id),
  });
  const { data: aiSettings } = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getGlobalAISettings(organizationId),
    queryKey: queryKeys.aiSettings.global,
  });
  const sendMutation = useMutation({
    mutationFn: () => sendSupportMessage(session.id, message),
    onError: () => toast.error("Não foi possível enviar a mensagem."),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.support.messages(session.id),
      });
    },
  });

  useEffect(
    () =>
      subscribeSupportMessages(session.id, () => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.support.messages(session.id),
        });
      }),
    [queryClient, session.id],
  );

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  }

  const detailsPanel = (
    <Tabs defaultValue="resolucao">
      <TabsList className="flex h-auto flex-wrap justify-start border border-white/10 bg-white/[0.045]">
        {["Cliente", "Produto", "IA Suporte", "Resolução", "Histórico"].map(
          (tab) => (
            <TabsTrigger
              key={tab}
              value={tab
                .toLowerCase()
                .replace("ç", "c")
                .replace("ã", "a")
                .replace(" ", "-")}
            >
              {tab}
            </TabsTrigger>
          ),
        )}
      </TabsList>
      <TabsContent className="mt-4" value="resolucao">
        <SupportResolutionTab />
      </TabsContent>
      <TabsContent className="mt-4" value="cliente">
        <SupportClientTab session={session} />
      </TabsContent>
      <TabsContent className="mt-4" value="produto">
        <SupportProductTab session={session} />
      </TabsContent>
      <TabsContent className="mt-4" value="ia-suporte">
        <AIHarnessPanel
          currentMessage={message}
          handledByType={session.handled_by_type}
          mode={mode}
          modelId={aiSettings?.model_id ?? aiSettings?.model}
          onUseSuggestion={setMessage}
          organizationId={organizationId}
          sessionId={session.id}
          sessionType="support"
        />
      </TabsContent>
      <TabsContent className="mt-4" value="histórico">
        <SupportHistoryTab session={session} />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="data-panel grid h-full min-h-0 min-w-0 grid-rows-[56px_minmax(0,1fr)_64px] overflow-hidden">
        <div className="flex min-h-14 items-center justify-between gap-3 border-white/10 border-b p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-kynovra-tech-purple/20 bg-kynovra-tech-purple/15 text-purple-100">
              <MessageCircleMore className="size-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-sm">
                {session.public_token.slice(0, 8).toUpperCase()}
              </h1>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {session.product?.name ?? "Produto"} · {session.reason} ·{" "}
                {session.continuity_code ?? "sem continuidade"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label="Aguardando retorno" />
            <Button
              aria-label="Abrir detalhes do suporte"
              className="xl:hidden"
              onClick={() => setDetailsOpen(true)}
              size="icon"
              variant="ghost"
            >
              <MessageCircleMore />
            </Button>
          </div>
        </div>
        <div className="premium-scrollbar min-h-0 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgb(124_58_237_/_0.07),transparent_28rem)] p-3 sm:p-4">
          <div className="flex min-w-0 flex-col gap-3">
            {messages.map((item) => {
              const isClient = item.sender_type === "customer";

              return (
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-3 py-2.5 text-sm shadow-sm xl:max-w-[72%]",
                    isClient
                      ? "ml-auto rounded-br-md border-primary/25 bg-primary/18 text-blue-50"
                      : "rounded-bl-md border-white/10 bg-white/[0.055]",
                  )}
                  key={item.id}
                >
                  <p className="mb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                    {item.sender_type}
                  </p>
                  {item.content}
                </div>
              );
            })}
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-muted-foreground text-sm">
                Nenhuma mensagem de suporte enviada ainda.
              </div>
            ) : null}
          </div>
        </div>
        <div className="border-white/10 border-t bg-background/70 p-3 backdrop-blur-xl">
          <form className="space-y-2" onSubmit={handleSend}>
            <label
              className="text-muted-foreground text-xs font-medium"
              htmlFor="support-message"
            >
              Mensagem de suporte
            </label>
            <div className="premium-input flex h-11 items-center gap-2 rounded-xl border px-2.5">
              <Button
                aria-label="Emoji"
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Smile />
              </Button>
              <Input
                className="h-9 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                id="support-message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Digite a mensagem..."
                value={message}
              />
              <Button aria-label="Enviar mensagem" size="icon" type="submit">
                <Send />
              </Button>
            </div>
          </form>
        </div>
      </section>
      <aside className="data-panel hidden min-h-0 min-w-0 overflow-hidden p-3 xl:block">
        {detailsPanel}
      </aside>
      <Sheet onOpenChange={setDetailsOpen} open={isDetailsOpen}>
        <SheetContent
          className="grid max-h-[86dvh] w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-md xl:hidden"
          side="bottom"
        >
          <SheetHeader className="border-white/10 border-b">
            <SheetTitle>Detalhes do suporte</SheetTitle>
            <SheetDescription>
              Cliente, produto, IA e resolução
            </SheetDescription>
          </SheetHeader>
          <div className="premium-scrollbar min-h-0 overflow-y-auto overflow-x-hidden p-3">
            {detailsPanel}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function SupportClientTab({ session }: { session: SupportTicketView }) {
  return (
    <div className="grid gap-3">
      <DetailRow label="Sala" value={session.public_token.slice(0, 12)} />
      <DetailRow label="Motivo" value={session.reason} />
      <DetailRow label="Status" value={session.status} />
      <DetailRow label="Código" value={session.continuity_code ?? "--"} />
      <DetailRow
        label="Criado em"
        value={new Date(session.created_at).toLocaleString("pt-BR")}
      />
    </div>
  );
}

function SupportProductTab({ session }: { session: SupportTicketView }) {
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="flex h-24 items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgb(124_58_237_/_0.28),transparent_70%)]">
          <Package className="size-8 text-purple-100" />
        </div>
        <div className="p-4">
          <p className="font-semibold">{session.product?.name ?? "Produto"}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {session.product?.category ?? "Categoria não definida"}
          </p>
        </div>
      </div>
      <DetailRow label="Categoria" value={session.product?.category ?? "--"} />
      <DetailRow
        label="Informações de suporte"
        value={session.product?.support_info ?? "--"}
      />
      <DetailRow
        label="Status do produto"
        value={session.product?.status ?? "--"}
      />
    </div>
  );
}

function SupportResolutionTab() {
  return (
    <div className="flex flex-col gap-2">
      {[
        "Resolvido",
        "Não resolvido",
        "Encaminhado",
        "Aguardando retorno",
        "Gerar Código de Continuidade",
        "Encerrar suporte",
      ].map((action) => (
        <Button
          className="justify-start"
          key={action}
          variant={action === "Resolvido" ? "default" : "outline"}
        >
          {action === "Resolvido" ? (
            <FileCheck2 data-icon="inline-start" />
          ) : null}
          {action}
        </Button>
      ))}
    </div>
  );
}

function SupportHistoryTab({ session }: { session: SupportTicketView }) {
  const events = [
    ["Suporte criado", session.created_at],
    ["Suporte aceito", session.accepted_at],
    ["Suporte aberto", session.opened_at],
    ["Suporte encerrado", session.closed_at],
  ].filter(([, date]) => date);

  return (
    <div className="grid gap-3">
      {events.map(([event, date], index) => (
        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3" key={event}>
          <span className="mt-0.5 flex size-7 items-center justify-center rounded-full border border-kynovra-tech-purple/25 bg-kynovra-tech-purple/12 text-purple-100">
            {index === events.length - 1 ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <History className="size-4" />
            )}
          </span>
          <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <p className="font-medium text-sm">{event}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              {date ? new Date(String(date)).toLocaleString("pt-BR") : "--"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
