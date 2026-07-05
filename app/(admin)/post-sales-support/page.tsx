"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Filter,
  MessageCircleMore,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SupportWorkspace } from "@/components/chat/support-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  acceptSupportTicket,
  closeSupportTicket,
  listMySupportTickets,
  listWaitingSupportTickets,
  openSupportTicket,
  type SupportTicketView,
  subscribeSupportQueue,
  takeOverAISupportTicket,
  transferSupportTicket,
} from "@/lib/supabase/queries/support";
import { queryKeys } from "@/lib/supabase/query-keys";
import { getClientAppOrigin } from "@/lib/url/get-app-origin";
import { buildSupportLink } from "@/lib/url/public-links";

export default function PostSalesSupportPage() {
  const { permissions, user } = useAuth();
  const queryClient = useQueryClient();
  const [origin, setOrigin] = useState("");
  const [activeSupportId, setActiveSupportId] = useState<string | null>(null);
  const { data: waitingTickets = [] } = useQuery({
    queryFn: listWaitingSupportTickets,
    queryKey: queryKeys.support.queue,
  });
  const { data: myTickets = [] } = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => listMySupportTickets(user?.id ?? ""),
    queryKey: queryKeys.support.mine,
  });
  const activeSupport = [...waitingTickets, ...myTickets].find(
    (ticket) => ticket.id === activeSupportId,
  );
  const canAccept = permissions.includes("support.ticket.accept");
  const supportLink = buildSupportLink(origin);

  useEffect(() => {
    setOrigin(getClientAppOrigin());
  }, []);

  useEffect(
    () =>
      subscribeSupportQueue(() => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.support.queue,
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.support.mine,
        });
      }),
    [queryClient],
  );

  async function refreshTickets() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.support.queue });
    await queryClient.invalidateQueries({ queryKey: queryKeys.support.mine });
  }

  const acceptMutation = useMutation({
    mutationFn: acceptSupportTicket,
    onSuccess: async (result) => {
      await refreshTickets();
      toast[result?.success === false ? "error" : "success"](
        result?.message ?? "Ticket aceito. Agora você pode abrir o suporte.",
      );
    },
  });
  const takeOverAIMutation = useMutation({
    mutationFn: takeOverAISupportTicket,
    onSuccess: async (result, ticketId) => {
      await refreshTickets();
      if (result?.success === false) {
        toast.error(result.message);
        return;
      }

      setActiveSupportId(ticketId);
      toast.success(result?.message ?? "Suporte transferido da IA.");
    },
  });
  const openMutation = useMutation({
    mutationFn: openSupportTicket,
    onError: () => toast.error("Aceite este ticket antes de abrir o suporte."),
    onSuccess: async (_result, ticketId) => {
      await refreshTickets();
      setActiveSupportId(ticketId);
      toast.success("Suporte iniciado.");
    },
  });
  const transferMutation = useMutation({
    mutationFn: transferSupportTicket,
    onSuccess: async () => {
      setActiveSupportId(null);
      await refreshTickets();
      toast.success("Suporte transferido para a IA.");
    },
  });
  const closeMutation = useMutation({
    mutationFn: closeSupportTicket,
    onSuccess: async () => {
      setActiveSupportId(null);
      await refreshTickets();
      toast.success("Suporte encerrado.");
    },
  });

  async function copySupportLink() {
    await navigator.clipboard?.writeText(
      buildSupportLink(getClientAppOrigin()),
    );
    toast.success("Link de suporte copiado.");
  }

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              onClick={copySupportLink}
              size="sm"
              variant="outline"
            >
              <Copy data-icon="inline-start" />
              Copiar link de suporte
            </Button>
            <Button asChild className="gap-2" size="sm" variant="outline">
              <Link
                href={supportLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink data-icon="inline-start" />
                Abrir suporte
              </Link>
            </Button>
          </div>
        }
        breadcrumbs={[{ label: "Admin" }, { label: "Suporte Pós-Venda" }]}
        description="Resolva chamados, acompanhe continuidade e proteja a experiência do cliente."
        title="Suporte Pós-Venda"
      />

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          [String(waitingTickets.length), "Aguardando", "Fila de retorno"],
          [String(myTickets.length), "Meus suportes", "Sob minha gestão"],
          [
            String(
              myTickets.filter((ticket) => ticket.status === "in_progress")
                .length,
            ),
            "Em suporte",
            "Conversas ativas",
          ],
          ["0", "Encaminhados", "Com especialistas"],
          [
            String(myTickets.filter((ticket) => ticket.continuity_code).length),
            "Códigos ativos",
            "Continuidade",
          ],
          ["0", "Resolvidos hoje", "Experiência protegida"],
        ].map(([value, label, hint], index) => (
          <MetricCard
            description={hint}
            glow={index % 2 === 0 ? "blue" : "purple"}
            key={label}
            title={label}
            value={value}
          />
        ))}
      </div>

      <section className="data-panel min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-white/10 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold text-base">Chamados de suporte</h2>
            <p className="text-muted-foreground text-sm">
              Aceite um ticket antes de abrir a tela operacional de suporte.
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 xl:max-w-2xl">
            <div className="min-w-0 flex-1 space-y-2">
              <label
                className="text-muted-foreground text-xs font-medium"
                htmlFor="support-search"
              >
                Buscar suporte
              </label>
              <div className="premium-input flex h-9 min-w-0 items-center gap-2 rounded-lg border px-3">
                <Search className="size-4 text-muted-foreground" />
                <Input
                  className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  id="support-search"
                  placeholder="Cliente, produto ou código..."
                />
              </div>
            </div>
            {["Status", "Produto", "Motivo", "Código"].map((filter) => (
              <Button
                className="gap-2"
                key={filter}
                size="sm"
                variant="outline"
              >
                <Filter data-icon="inline-start" />
                {filter}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 gap-4 p-3">
          <TicketSection
            action={(ticket) => (
              <Button
                className="flex-1"
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
                    : "Transferir suporte"
                  : acceptMutation.isPending &&
                      acceptMutation.variables === ticket.id
                    ? "Aceitando..."
                    : "Aceitar suporte"}
              </Button>
            )}
            closeAction={(ticket) => closeMutation.mutate(ticket.id)}
            empty="Nenhum suporte aguardando aceite."
            tickets={waitingTickets}
            title="Fila aguardando aceite"
          />
          <TicketSection
            action={(ticket) => (
              <Button
                className="flex-1"
                onClick={() => openMutation.mutate(ticket.id)}
                size="sm"
              >
                {ticket.status === "accepted"
                  ? "Abrir suporte"
                  : "Continuar suporte"}
              </Button>
            )}
            closeAction={(ticket) => closeMutation.mutate(ticket.id)}
            empty="Você ainda não aceitou nenhum suporte."
            tickets={myTickets}
            title="Meus suportes"
          />
        </div>
      </section>

      {activeSupport ? (
        <div className="fixed inset-x-0 top-[var(--topbar-height)] bottom-0 z-40 overflow-hidden bg-[#0D132B] lg:left-[var(--sidebar-width)]">
          <div className="grid h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
            <header className="flex min-w-0 items-center justify-between gap-3 border-white/10 border-b bg-[#050a18] px-3 py-2 lg:px-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {supportName(activeSupport)}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {supportProduct(activeSupport)} · {activeSupport.reason} ·{" "}
                  {activeSupport.continuity_code ?? "sem código"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label="Em atendimento" />
                <Button
                  className="hidden sm:inline-flex"
                  onClick={() => transferMutation.mutate(activeSupport.id)}
                  size="sm"
                  variant="outline"
                >
                  Encaminhar
                </Button>
                <Button
                  className="hidden sm:inline-flex"
                  onClick={() => closeMutation.mutate(activeSupport.id)}
                  size="sm"
                  variant="outline"
                >
                  Encerrar
                </Button>
                <Button
                  aria-label="Fechar suporte"
                  onClick={() => setActiveSupportId(null)}
                  size="icon"
                  variant="ghost"
                >
                  <X />
                </Button>
              </div>
            </header>
            <div className="min-h-0 overflow-hidden p-3">
              <SupportWorkspace session={activeSupport} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TicketSection({
  action,
  closeAction,
  empty,
  tickets,
  title,
}: {
  action: (ticket: SupportTicketView) => ReactNode;
  closeAction: (ticket: SupportTicketView) => void;
  empty: string;
  tickets: SupportTicketView[];
  title: string;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-muted-foreground text-xs">
          {tickets.length} ticket(s)
        </span>
      </div>
      {tickets.length ? (
        <div className="grid min-w-0 gap-3 lg:grid-cols-3">
          {tickets.map((ticket, index) => (
            <SupportTicketCard
              action={action(ticket)}
              closeAction={() => closeAction(ticket)}
              index={index}
              key={ticket.id}
              ticket={ticket}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-muted-foreground text-sm">
          {empty}
        </div>
      )}
    </section>
  );
}

function SupportTicketCard({
  action,
  closeAction,
  index,
  ticket,
}: {
  action: ReactNode;
  closeAction: () => void;
  index: number;
  ticket: SupportTicketView;
}) {
  const badge = isAITicket(ticket)
    ? "IA atendendo"
    : ticket.status === "waiting"
      ? "Aguardando aceite"
      : ticket.status === "accepted"
        ? "Aceito por você"
        : "Em atendimento";

  return (
    <article className="min-w-0 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-left transition-colors hover:border-primary/35 hover:bg-primary/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-kynovra-tech-purple/25 bg-kynovra-tech-purple/15 text-purple-100">
            <MessageCircleMore className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{supportName(ticket)}</p>
            <p className="mt-1 truncate text-muted-foreground text-sm">
              {supportProduct(ticket)} · {ticket.reason}
            </p>
          </div>
        </div>
        <StatusBadge label={badge} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <span className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5 text-muted-foreground">
          {elapsed(ticket.created_at)}
        </span>
        <span className="truncate rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5 font-mono text-blue-100">
          {ticket.continuity_code ?? "sem código"}
        </span>
        <span className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5 text-kynovra-digital-green">
          P{index + 1}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <StatusBadge
          label={ticket.status === "waiting" ? "Aguardando retorno" : badge}
        />
      </div>
      <div className="mt-4 flex gap-2">
        {action}
        <Button
          aria-label="Encerrar suporte"
          className="border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-100"
          onClick={closeAction}
          size="icon-sm"
          variant="outline"
        >
          <X />
        </Button>
      </div>
    </article>
  );
}

function supportName(ticket: SupportTicketView) {
  return ticket.public_token.slice(0, 8).toUpperCase();
}

function supportProduct(ticket: SupportTicketView) {
  return ticket.product?.name ?? "Produto";
}

function isAITicket(ticket: SupportTicketView) {
  return ticket.status === "in_progress" && ticket.handled_by_type === "ai";
}

function elapsed(createdAt: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000),
  );
  return `${minutes} min`;
}
