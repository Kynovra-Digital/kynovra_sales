"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  History,
  LayoutGrid,
  Search,
  Timer,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SalesWorkspace } from "@/components/chat/sales-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  acceptSalesTicket,
  closeSalesTicket,
  confirmManualSale,
  listMySalesTickets,
  listWaitingSalesTickets,
  openSalesTicket,
  type SalesTicketView,
  subscribeSalesQueue,
  takeOverAISalesTicket,
  transferSalesTicket,
} from "@/lib/supabase/queries/sales";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function SalesPage() {
  const { permissions, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: waitingTickets = [], isLoading: loadingQueue } = useQuery({
    queryFn: listWaitingSalesTickets,
    queryKey: queryKeys.sales.queue,
  });

  const { data: myTickets = [], isLoading: loadingMine } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => listMySalesTickets(user?.id ?? ""),
    queryKey: queryKeys.sales.mine,
  });

  const allVisibleTickets = [...waitingTickets, ...myTickets];
  const activeCall = allVisibleTickets.find(
    (ticket) => ticket.id === activeTicketId,
  );
  const canAccept = permissions.includes("sales.ticket.accept");

  useEffect(
    () =>
      subscribeSalesQueue(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sales.queue });
        void queryClient.invalidateQueries({ queryKey: queryKeys.sales.mine });
      }),
    [queryClient],
  );

  const refreshTickets = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.sales.queue });
    await queryClient.invalidateQueries({ queryKey: queryKeys.sales.mine });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptSalesTicket,
    onSuccess: async (result) => {
      await refreshTickets();
      if (result?.success === false) {
        toast.error(result.message);
      } else {
        toast.success(result?.message || "Atendimento aceito com sucesso.");
      }
    },
  });

  const takeOverAIMutation = useMutation({
    mutationFn: takeOverAISalesTicket,
    onSuccess: async (result, ticketId) => {
      await refreshTickets();
      if (result?.success === false) {
        toast.error(result.message);
        return;
      }

      setActiveTicketId(ticketId);
      toast.success(result?.message || "Atendimento transferido da IA.");
    },
  });

  const openMutation = useMutation({
    mutationFn: openSalesTicket,
    onSuccess: async (_result, ticketId) => {
      await refreshTickets();
      setActiveTicketId(ticketId);
      toast.success("Atendimento iniciado.");
    },
    onError: () =>
      toast.error("Aceite este ticket antes de abrir o atendimento."),
  });

  const transferMutation = useMutation({
    mutationFn: transferSalesTicket,
    onError: () =>
      toast.error("Não foi possível devolver o atendimento para a fila."),
    onSuccess: async (result) => {
      if (result?.success === false) {
        toast.error(result.message);
        return;
      }

      setActiveTicketId(null);
      await refreshTickets();
      toast.success(result?.message || "Atendimento devolvido para a fila.");
    },
  });

  const closeMutation = useMutation({
    mutationFn: closeSalesTicket,
    onSuccess: async () => {
      setActiveTicketId(null);
      await refreshTickets();
      toast.success("Atendimento encerrado.");
    },
  });

  const confirmSaleMutation = useMutation({
    mutationFn: (ticket: SalesTicketView) =>
      confirmManualSale(ticket.id, ticket.product?.price ?? null),
    onError: () =>
      toast.error("Não foi possível marcar este atendimento como ganho."),
    onSuccess: async (result) => {
      if (result?.success === false) {
        toast.error(result.message);
        return;
      }

      setActiveTicketId(null);
      await refreshTickets();
      toast.success(
        result?.message || "Venda marcada como ganha e atendimento encerrado.",
      );
    },
  });

  const filteredWaiting = waitingTickets.filter(
    (t) =>
      ticketName(t).toLowerCase().includes(search.toLowerCase()) ||
      ticketProduct(t).toLowerCase().includes(search.toLowerCase()),
  );

  const filteredMine = myTickets.filter(
    (t) =>
      ticketName(t).toLowerCase().includes(search.toLowerCase()) ||
      ticketProduct(t).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid min-w-0 gap-6"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Admin" },
          { label: "Vendas" },
          { label: "Fila de Atendimento" },
        ]}
        description="Gerencie a prioridade comercial e conversas em tempo real."
        title="Command Center: Vendas"
      />

      <motion.div
        variants={itemVariants}
        className="grid min-w-0 gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {[
          [
            String(waitingTickets.length),
            "Aguardando",
            "Fila comercial",
            "blue",
          ],
          [
            String(myTickets.length),
            "Meus Tickets",
            "Sob sua gestão",
            "purple",
          ],
          [
            String(myTickets.filter((t) => t.status === "in_progress").length),
            "Em Curso",
            "Ativos agora",
            "green",
          ],
          [String(0), "Enviados", "Checkouts (24h)", "blue"],
          [String(0), "Acessados", "Alta intenção", "purple"],
          [String(0), "Convertidos", "Vendas hoje", "green"],
        ].map(([value, label, hint, glow], _index) => (
          <MetricCard
            description={hint}
            glow={glow as "blue" | "purple" | "green"}
            key={label}
            title={label}
            value={value}
          />
        ))}
      </motion.div>

      <motion.section
        variants={itemVariants}
        className="data-panel min-w-0 overflow-hidden"
      >
        <div className="flex flex-col gap-4 border-white/5 border-b p-5 lg:flex-row lg:items-center lg:justify-between bg-white/[0.01]">
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              <LayoutGrid className="size-5 text-primary" />
              Fila de Chamados
            </h2>
            <p className="text-muted-foreground/60 text-sm mt-0.5">
              Filtre e selecione atendimentos para iniciar a operação.
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:max-w-3xl lg:justify-end">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input
                className="h-10 pl-10 rounded-xl border-white/5 bg-white/[0.03] transition-all focus:bg-white/[0.05] focus:ring-primary/20"
                placeholder="Buscar por cliente, produto ou origem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-muted-foreground"
              >
                <Filter className="size-4 mr-2" />
                Filtros
              </Button>
              <Separator
                orientation="vertical"
                className="h-6 bg-white/5 mx-1"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-10 rounded-xl text-primary hover:bg-primary/10"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-8 p-6">
          <TicketSection
            action={(ticket) => (
              <Button
                className="flex-1 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold h-9"
                disabled={
                  !canAccept ||
                  acceptMutation.isPending ||
                  takeOverAIMutation.isPending
                }
                onClick={() =>
                  isAITicket(ticket)
                    ? takeOverAIMutation.mutate(ticket.id)
                    : acceptMutation.mutate(ticket.id)
                }
                size="sm"
              >
                {isAITicket(ticket)
                  ? takeOverAIMutation.isPending &&
                    takeOverAIMutation.variables === ticket.id
                    ? "Transferindo..."
                    : "Transferir atendimento"
                  : acceptMutation.isPending &&
                      acceptMutation.variables === ticket.id
                    ? "Aceitando..."
                    : "Aceitar Agora"}
              </Button>
            )}
            empty={
              loadingQueue
                ? "Carregando fila..."
                : "Nenhum atendimento na fila."
            }
            closeAction={(ticket) => closeMutation.mutate(ticket.id)}
            tickets={filteredWaiting}
            title="Aguardando Aceite"
          />

          <Separator className="bg-white/5" />

          <TicketSection
            action={(ticket) => (
              <Button
                className="flex-1 rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold h-9"
                onClick={() => openMutation.mutate(ticket.id)}
                size="sm"
                variant="outline"
              >
                {ticket.status === "accepted" ? "Iniciar Chat" : "Continuar"}
              </Button>
            )}
            empty={
              loadingMine
                ? "Sincronizando seus tickets..."
                : "Você não tem atendimentos ativos."
            }
            closeAction={(ticket) => closeMutation.mutate(ticket.id)}
            tickets={filteredMine}
            title="Meus Atendimentos"
            highlight
          />
        </div>
      </motion.section>

      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 overflow-hidden bg-background lg:left-[var(--sidebar-width)] top-0"
          >
            <div className="grid h-full min-w-0 grid-rows-[64px_minmax(0,1fr)] overflow-hidden">
              <header className="flex min-w-0 items-center justify-between gap-4 border-white/5 border-b bg-[#050a18]/80 px-4 backdrop-blur-2xl">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative">
                    <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                      <UserRound className="size-5" />
                    </div>
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#050a18] bg-kynovra-digital-green shadow-[0_0_10px_rgb(16_185_129_/_0.5)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold text-white text-base">
                        {ticketName(activeCall)}
                      </h3>
                      <StatusBadge label="Operacional" />
                    </div>
                    <p className="truncate text-muted-foreground/60 text-xs font-medium">
                      {ticketProduct(activeCall)} · {activeCall.source} ·{" "}
                      {activeCall.handled_by_type || "humano"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden xl:flex items-center gap-3 mr-4 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5">
                    <Timer className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground/80">
                      {elapsed(activeCall.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      className="hidden md:inline-flex h-9 rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.06]"
                      disabled={transferMutation.isPending}
                      onClick={() => transferMutation.mutate(activeCall.id)}
                      size="sm"
                      variant="outline"
                    >
                      <History className="size-4 mr-2" />
                      {transferMutation.isPending
                        ? "Transferindo..."
                        : "Transferir"}
                    </Button>
                    <Button
                      className="hidden md:inline-flex h-9 rounded-xl border-destructive/20 bg-destructive/5 text-red-400 hover:bg-destructive/10"
                      onClick={() => closeMutation.mutate(activeCall.id)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="size-4 mr-2" />
                      Encerrar
                    </Button>
                    <Separator
                      orientation="vertical"
                      className="h-6 bg-white/5 mx-1"
                    />
                    <Button
                      aria-label="Fechar painel"
                      className="size-10 rounded-xl hover:bg-white/5 text-muted-foreground"
                      onClick={() => setActiveTicketId(null)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                </div>
              </header>
              <div className="min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.02),transparent_50%)]">
                <SalesWorkspace
                  isConfirmingSale={confirmSaleMutation.isPending}
                  isTransferringToQueue={transferMutation.isPending}
                  onConfirmSale={() => confirmSaleMutation.mutate(activeCall)}
                  onTransferToQueue={() =>
                    transferMutation.mutate(activeCall.id)
                  }
                  session={activeCall}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TicketSection({
  action,
  closeAction,
  empty,
  tickets,
  title,
  highlight = false,
}: {
  action: (ticket: SalesTicketView) => ReactNode;
  closeAction: (ticket: SalesTicketView) => void;
  empty: string;
  tickets: SalesTicketView[];
  title: string;
  highlight?: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3
          className={cn(
            "font-bold text-xs uppercase tracking-[0.15em]",
            highlight ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          {title}
        </h3>
        <span className="rounded-full bg-white/[0.03] px-2.5 py-0.5 font-bold text-[10px] text-muted-foreground/80 border border-white/5">
          {tickets.length}
        </span>
      </div>

      {tickets.length ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SalesTicketCard
                  action={action(ticket)}
                  closeAction={() => closeAction(ticket)}
                  index={index}
                  ticket={ticket}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[1.5rem] border border-dashed border-white/5 bg-white/[0.01] p-8 text-center"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/[0.02] text-muted-foreground/30 mb-3">
            <UserRound className="size-6" />
          </div>
          <p className="text-muted-foreground/40 text-sm font-medium">
            {empty}
          </p>
        </motion.div>
      )}
    </section>
  );
}

function SalesTicketCard({
  action,
  closeAction,
  index,
  ticket,
}: {
  action: ReactNode;
  closeAction: () => void;
  index: number;
  ticket: SalesTicketView;
}) {
  const isAI = isAITicket(ticket);
  const badge = isAI
    ? "IA atendendo"
    : ticket.status === "waiting"
      ? "Pendente"
      : ticket.status === "accepted"
        ? "Aceito"
        : "Em Curso";

  const isWaiting = ticket.status === "waiting";

  return (
    <article
      className={cn(
        "group relative min-w-0 rounded-2xl border p-4 text-left transition-all duration-300",
        isWaiting
          ? "border-white/5 bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04]"
          : "border-primary/20 bg-primary/[0.03] hover:border-primary/40 hover:bg-primary/[0.05]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
              isWaiting
                ? "border-white/5 bg-white/5 text-muted-foreground group-hover:text-primary"
                : "border-primary/30 bg-primary/20 text-primary",
            )}
          >
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-white text-sm tracking-tight leading-tight">
              {ticketName(ticket)}
            </p>
            <p className="mt-1 truncate text-muted-foreground/70 text-[11px] font-medium uppercase tracking-wider">
              {ticketProduct(ticket)}
            </p>
          </div>
        </div>
        <StatusBadge label={badge} tone={isWaiting ? "amber" : "green"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1 border border-white/5">
          <Timer className="size-3 text-muted-foreground/60" />
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase">
            {elapsed(ticket.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1 border border-white/5">
          <span className="text-[10px] font-black text-primary uppercase">
            P{index + 1}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1 border font-bold text-[10px] uppercase",
            ticketTemperature(ticket) === "Lead quente"
              ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
              : "border-blue-500/20 bg-blue-500/10 text-blue-400",
          )}
        >
          {ticketTemperature(ticket)}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {action}
        <Button
          aria-label="Encerrar atendimento"
          onClick={closeAction}
          size="icon"
          variant="outline"
          className="size-9 shrink-0 rounded-xl border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-100"
        >
          <X className="size-4" />
        </Button>
      </div>
    </article>
  );
}

function ticketName(ticket: SalesTicketView) {
  return ticket.lead?.name ?? ticket.session_code ?? "Lead";
}

function ticketProduct(ticket: SalesTicketView) {
  return ticket.product?.name ?? "Produto";
}

function isAITicket(ticket: SalesTicketView) {
  return ticket.status === "in_progress" && ticket.handled_by_type === "ai";
}

function ticketTemperature(ticket: SalesTicketView) {
  // Simple logic for visual variety
  if (ticket.status === "in_progress") return "Lead quente";
  return "Lead morno";
}

function elapsed(createdAt: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000),
  );
  if (minutes < 1) return "Agora";
  return `${minutes}m`;
}
