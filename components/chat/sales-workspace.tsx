"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeAlert,
  CheckCircle2,
  CreditCard,
  History,
  Info,
  LockKeyhole,
  Package,
  Send,
  Smile,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AIHarnessPanel } from "@/components/chat/ai-harness-panel";
import { FormattedContent } from "@/components/chat/formatted-content";
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
  listSalesMessages,
  type SalesTicketView,
  sendSalesMessage,
  subscribeSalesMessages,
} from "@/lib/supabase/queries/sales";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

export function SalesWorkspace({
  isTransferringToQueue = false,
  onTransferToQueue,
  isConfirmingSale = false,
  onConfirmSale,
  session,
}: {
  isConfirmingSale?: boolean;
  isTransferringToQueue?: boolean;
  onConfirmSale?: () => void;
  onTransferToQueue?: () => void;
  session: SalesTicketView;
}) {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const [mode] = useState<"auto" | "copilot">("copilot");
  const [message, setMessage] = useState("");
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryFn: () => listSalesMessages(session.id),
    queryKey: queryKeys.sales.messages(session.id),
  });

  const { data: aiSettings } = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getGlobalAISettings(organizationId),
    queryKey: queryKeys.aiSettings.global,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendSalesMessage(session.id, message),
    onError: () => toast.error("Não foi possível enviar a mensagem."),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sales.messages(session.id),
      });
    },
  });

  const sendCheckoutMutation = useMutation({
    mutationFn: () =>
      sendSalesMessage(session.id, buildCheckoutMessage(session)),
    onError: () => toast.error("Não foi possível enviar o link de checkout."),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sales.messages(session.id),
      });
      toast.success("Link de checkout enviado ao cliente.");
    },
  });

  useEffect(
    () =>
      subscribeSalesMessages(session.id, () => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.sales.messages(session.id),
        });
      }),
    [queryClient, session.id],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  }

  const detailsPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Tabs defaultValue="ia" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid h-auto w-full shrink-0 grid-cols-5 rounded-xl border border-white/5 bg-white/[0.02] p-1 sm:h-11">
          <TabsTrigger
            value="ia"
            className="text-[10px] uppercase font-bold rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            IA
          </TabsTrigger>
          <TabsTrigger
            value="lead"
            className="text-[10px] uppercase font-bold rounded-lg"
          >
            Lead
          </TabsTrigger>
          <TabsTrigger
            value="produto"
            className="text-[10px] uppercase font-bold rounded-lg"
          >
            Prod
          </TabsTrigger>
          <TabsTrigger
            value="ações"
            className="text-[10px] uppercase font-bold rounded-lg"
          >
            Ações
          </TabsTrigger>
          <TabsTrigger
            value="histórico"
            className="text-[10px] uppercase font-bold rounded-lg"
          >
            Hist
          </TabsTrigger>
        </TabsList>

        <div className="premium-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          <TabsContent className="m-0 focus-visible:ring-0" value="ia">
            <AIHarnessPanel
              currentMessage={message}
              handledByType={session.handled_by_type}
              mode={mode}
              modelId={aiSettings?.model_id ?? aiSettings?.model}
              onUseSuggestion={setMessage}
              organizationId={organizationId}
              sessionId={session.id}
              sessionType="sales"
            />
          </TabsContent>
          <TabsContent className="m-0 focus-visible:ring-0" value="lead">
            <LeadToolsTab session={session} />
          </TabsContent>
          <TabsContent className="m-0 focus-visible:ring-0" value="produto">
            <ProductToolsTab session={session} />
          </TabsContent>
          <TabsContent className="m-0 focus-visible:ring-0" value="ações">
            <ActionsToolsTab
              isConfirmingSale={isConfirmingSale}
              isSendingCheckout={sendCheckoutMutation.isPending}
              isTransferringToQueue={isTransferringToQueue}
              onConfirmSale={onConfirmSale}
              onSendCheckout={() => {
                if (!session.product?.checkout_url) {
                  toast.error(
                    "Este produto não possui link de checkout configurado.",
                  );
                  return;
                }

                sendCheckoutMutation.mutate();
              }}
              onTransferToQueue={onTransferToQueue}
            />
          </TabsContent>
          <TabsContent className="m-0 focus-visible:ring-0" value="histórico">
            <SessionHistoryTab session={session} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_clamp(22rem,28vw,30rem)] 2xl:grid-cols-[minmax(0,1fr)_clamp(24rem,26vw,32rem)]">
      <section className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01] shadow-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-white/5 border-b bg-white/[0.02] px-5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <UserRound className="size-4" />
              </div>
              <div className="absolute -top-1 -right-1 size-2.5 rounded-full bg-kynovra-digital-green border-2 border-[#050a18]" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-sm tracking-tight text-white">
                {session.lead?.name || "Cliente na Sala"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-wider">
                  {session.product?.name || "Venda Direta"}
                </span>
                <span className="size-1 rounded-full bg-white/10" />
                <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
                  {session.handled_by_type === "ai" ? "IA Ativa" : "Humano"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/5">
              <Zap className="size-3 text-blue-400" />
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">
                {mode === "auto" ? "Auto" : "Copilot"}
              </span>
            </div>
            <Button
              className="xl:hidden hover:bg-white/5"
              onClick={() => setDetailsOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Info className="size-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto premium-scrollbar p-5 space-y-6 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.03),transparent_40%)]"
        >
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full border border-white/5 bg-white/[0.02] px-4 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] backdrop-blur-sm">
              Início do Histórico ·{" "}
              {new Date(session.created_at).toLocaleDateString()}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.map((item) => {
              const isClient = item.sender_type === "customer";
              const isAI = item.sender_type === "ai";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col gap-1.5",
                    isClient ? "items-end" : "items-start",
                  )}
                  key={item.id}
                >
                  <div className="flex items-center gap-2 px-1">
                    {!isClient && (
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          isAI ? "text-purple-400" : "text-primary",
                        )}
                      >
                        {isAI ? "Assistente IA" : "Você"}
                      </span>
                    )}
                    {isClient && (
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        Cliente
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[75%] rounded-[1.5rem] border px-4 py-3 text-sm leading-relaxed shadow-lg transition-all",
                      isClient
                        ? "rounded-tr-none border-white/5 bg-white/[0.04] text-blue-50"
                        : isAI
                          ? "rounded-tl-none border-purple-500/20 bg-purple-500/10 text-purple-50 shadow-purple-500/5"
                          : "rounded-tl-none border-primary/20 bg-primary/10 text-blue-50 shadow-primary/5",
                    )}
                  >
                    <FormattedContent>{item.content}</FormattedContent>
                  </div>

                  <span className="px-1 text-[9px] font-medium text-muted-foreground/30">
                    {new Date(item.created_at || "").toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
              <div className="size-16 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-4">
                <Smile className="size-8" />
              </div>
              <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-[10px] uppercase tracking-widest mt-1">
                Aguardando interação
              </p>
            </div>
          )}

          {session.product?.checkout_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/20 to-purple-600/10 p-6 shadow-2xl shadow-primary/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <LockKeyhole className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white tracking-tight truncate">
                    {session.product.name}
                  </p>
                  <p className="text-primary text-sm font-black">
                    {formatPrice(session.product.price)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground/80 text-xs font-medium leading-relaxed">
                Um checkout seguro foi enviado para este cliente. Acompanhe o
                status do pagamento aqui.
              </p>
              <Button className="mt-6 w-full rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 font-bold h-11">
                Ver Status do Link
              </Button>
            </motion.div>
          )}
        </div>

        <footer className="shrink-0 border-white/5 border-t bg-white/[0.02] p-2.5 backdrop-blur-2xl">
          <form className="relative group" onSubmit={handleSend}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  className="h-9 w-full rounded-lg border-white/5 bg-white/[0.03] pl-9 pr-3 text-xs transition-all focus:bg-white/[0.06] focus:ring-primary/20 placeholder:text-muted-foreground/30"
                  id="sales-message"
                  autoComplete="off"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Envie uma mensagem ou use o copiloto..."
                  value={message}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-md bg-white/[0.03] text-muted-foreground/40">
                  <Smile className="size-3" />
                </div>
              </div>
              <Button
                aria-label="Enviar"
                className="size-9 rounded-lg bg-primary shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-95"
                disabled={!message.trim() || sendMutation.isPending}
                size="icon"
                type="submit"
              >
                {sendMutation.isPending ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Send className="ml-0.5 size-4" />
                )}
              </Button>
            </div>

            <div className="mt-1.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-muted-foreground/30 text-[8px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="size-2.5" />
                Criptografia Ativa
              </div>
              <div className="text-muted-foreground/30 text-[8px] font-medium italic">
                Press Enter to send
              </div>
            </div>
          </form>
        </footer>
      </section>

      <aside className="hidden h-full min-h-0 min-w-0 overflow-hidden xl:block">
        <div className="h-full min-h-0 rounded-[2rem] border border-white/5 bg-white/[0.02] p-[clamp(1rem,1.2vw,1.5rem)] shadow-inner">
          <div className="mb-6 flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
              Painel Operacional
            </h3>
          </div>
          {detailsPanel}
        </div>
      </aside>

      <Sheet onOpenChange={setDetailsOpen} open={isDetailsOpen}>
        <SheetContent
          className="mx-auto grid h-[min(92dvh,46rem)] w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[2rem] border-white/5 bg-[#050a18] p-0 sm:w-[min(42rem,calc(100vw-2rem))] md:h-[min(86dvh,48rem)] md:rounded-t-[2.5rem] lg:w-[min(48rem,calc(100vw-3rem))] xl:hidden"
          side="bottom"
        >
          <SheetHeader className="border-white/5 border-b p-6 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary">
                <Info className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-white">
                  Ferramentas e Detalhes
                </SheetTitle>
                <SheetDescription className="text-muted-foreground/60">
                  Ações rápidas e informações do lead.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 overflow-hidden p-[clamp(1rem,3vw,1.5rem)]">
            {detailsPanel}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-white/[0.02] last:border-0 group">
      <span className="text-muted-foreground/60 text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-right text-sm font-bold text-white/90 truncate max-w-[180px]">
        {value}
      </span>
    </div>
  );
}

function LeadToolsTab({ session }: { session: SalesTicketView }) {
  const source = session.lead?.source ?? session.source;

  return (
    <div className="space-y-6">
      <div className="grid gap-1">
        <DetailRow label="Nome" value={session.lead?.name ?? "--"} />
        <DetailRow label="E-mail" value={session.lead?.email ?? "--"} />
        <DetailRow label="Telefone" value={session.lead?.phone ?? "Nenhum"} />
        <DetailRow label="Temperatura" value={leadTemperatureLabel(session)} />
        <DetailRow label="Origem" value={salesSourceLabel(source)} />
        <DetailRow
          label="Campanha"
          value={session.campaign?.name ?? "Nenhum"}
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BadgeAlert className="size-4 text-orange-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400/80">
            Observações
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">
          Nenhuma nota interna adicionada para este lead. Use a IA para gerar um
          resumo.
        </p>
      </div>
    </div>
  );
}

function leadTemperatureLabel(session: SalesTicketView) {
  return session.status === "in_progress" ? "Quente" : "Frio";
}

function salesSourceLabel(source?: string | null) {
  if (source === "product_public_link") return "Link";
  if (source === "storefront" || source === "store" || source === "loja") {
    return "Vitrine";
  }

  return source ?? "--";
}

function ProductToolsTab({ session }: { session: SalesTicketView }) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
        <div className="relative h-28 flex items-center justify-center bg-[#0d1428]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)]" />
          <Package className="size-10 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
        </div>
        <div className="p-4 border-t border-white/5">
          <p className="font-bold text-white tracking-tight">
            {session.product?.name ?? "Produto"}
          </p>
          <p className="mt-1 text-primary text-[10px] font-black uppercase tracking-widest">
            {session.product?.category ?? "Premium"}
          </p>
        </div>
      </div>

      <div className="grid gap-1">
        <DetailRow label="Preço" value={formatPrice(session.product?.price)} />
        <DetailRow
          label="Estoque"
          value={
            session.product?.status === "active" ? "Disponível" : "Limitado"
          }
        />
      </div>
    </div>
  );
}

function ActionsToolsTab({
  isConfirmingSale = false,
  isSendingCheckout = false,
  isTransferringToQueue = false,
  onConfirmSale,
  onSendCheckout,
  onTransferToQueue,
}: {
  isConfirmingSale?: boolean;
  isSendingCheckout?: boolean;
  isTransferringToQueue?: boolean;
  onConfirmSale?: () => void;
  onSendCheckout?: () => void;
  onTransferToQueue?: () => void;
}) {
  const actions = [
    {
      label: "Enviar Link de Checkout",
      primary: true,
      icon: CreditCard,
      sendCheckout: true,
      onClick: onSendCheckout,
    },
    { label: "Transferir para Fila", icon: History, transferToQueue: true },
    {
      label: "Marcar como Ganho",
      icon: CheckCircle2,
      confirmSale: true,
      onClick: onConfirmSale,
    },
    { label: "Encerrar Chat", icon: X },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {actions.map((action) => (
        <Button
          className={cn(
            "justify-start h-11 rounded-xl font-bold text-xs gap-3 transition-all",
            action.primary
              ? "bg-primary text-white shadow-lg shadow-primary/10 hover:shadow-primary/20"
              : "bg-white/[0.03] border-white/5 text-muted-foreground hover:bg-white/[0.08] hover:text-white",
          )}
          disabled={
            (action.transferToQueue && isTransferringToQueue) ||
            (action.confirmSale && isConfirmingSale) ||
            (action.sendCheckout && isSendingCheckout)
          }
          key={action.label}
          onClick={() => {
            if (action.transferToQueue) {
              onTransferToQueue?.();
              return;
            }

            action.onClick?.();
          }}
          variant={action.primary ? "default" : "outline"}
        >
          <action.icon className="size-4 shrink-0" />
          {action.transferToQueue && isTransferringToQueue
            ? "Transferindo..."
            : action.confirmSale && isConfirmingSale
              ? "Encerrando..."
              : action.sendCheckout && isSendingCheckout
                ? "Enviando..."
                : action.label}
        </Button>
      ))}
    </div>
  );
}

function buildCheckoutMessage(session: SalesTicketView) {
  const productName = session.product?.name ?? "seu produto";
  const checkoutUrl = session.product?.checkout_url ?? "";

  return `Perfeito! Para finalizar a compra de ${productName}, acesse seu link seguro de checkout: ${checkoutUrl}`;
}

function SessionHistoryTab({ session }: { session: SalesTicketView }) {
  const events = [
    { label: "Lead entrou na sala", date: session.created_at },
    { label: "Atendimento aceito", date: session.accepted_at },
    { label: "Atendimento aberto", date: session.opened_at },
    { label: "Atendimento encerrado", date: session.closed_at },
  ].filter((e) => e.date);

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div className="flex gap-4 group" key={event.label}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "size-6 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                index === events.length - 1
                  ? "border-kynovra-digital-green bg-kynovra-digital-green/20 text-kynovra-digital-green"
                  : "border-white/10 bg-white/[0.04] text-muted-foreground group-hover:border-primary/50",
              )}
            >
              {index === events.length - 1 ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <History className="size-3" />
              )}
            </div>
            {index < events.length - 1 && (
              <div className="w-px h-full bg-white/5 my-1" />
            )}
          </div>
          <div className="min-w-0 pb-4">
            <p className="font-bold text-white text-xs tracking-tight">
              {event.label}
            </p>
            <p className="mt-1 text-muted-foreground/40 text-[10px] font-medium uppercase">
              {new Date(String(event.date)).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPrice(value?: number | null) {
  if (typeof value !== "number") return "--";
  return value.toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}
