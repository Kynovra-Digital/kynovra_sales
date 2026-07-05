"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  LockKeyhole,
  Send,
  ShieldCheck,
  User,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormattedContent } from "@/components/chat/formatted-content";
import { PoweredBy } from "@/components/public/powered-by";
import { PublicLoginPrompt } from "@/components/public/public-login-prompt";
import { SessionFeedback } from "@/components/public/session-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicAuth } from "@/hooks/use-public-auth";
import {
  getPublicSupportSession,
  listPublicSupportMessages,
  sendPublicSupportMessage,
  triggerPublicSupportAIAutoReply,
  triggerPublicSupportAITakeover,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

const AI_FIRST_MESSAGE =
  "Olá, tudo bem? Seu atendimento já foi iniciado. Vou analisar sua solicitação e te ajudar com os próximos passos.";

export default function PublicSupportRoomPage() {
  const params = useParams<{ publicToken: string }>();
  const { isLoading: authLoading, user } = usePublicAuth();
  const { data: session, isLoading } = useQuery({
    queryFn: () => getPublicSupportSession(params.publicToken),
    queryKey: queryKeys.publicRooms.support(params.publicToken),
    enabled: !!user,
    refetchInterval: 2500,
  });

  if (authLoading) {
    return (
      <PublicWaitingRoom statusMessage="Carregando autenticação segura..." />
    );
  }

  if (!user) {
    return (
      <PublicLoginPrompt
        description="Faça login com e-mail e senha ou continue com Google para acessar sua sala de suporte."
        redirectPath={`/suporte/sala/${params.publicToken}`}
        title="Entre para acessar o suporte"
      />
    );
  }

  if (isLoading || !session) {
    return (
      <PublicWaitingRoom statusMessage="Procurando atendente disponível..." />
    );
  }

  if (isWaitingSession(session)) {
    return (
      <PublicWaitingRoom
        publicToken={params.publicToken}
        reason={String(session.reason ?? "--")}
        session={session}
        statusMessage="Procurando atendente disponível..."
      />
    );
  }

  if (session.status === "closed") {
    return (
      <PublicClosedState publicToken={params.publicToken} session={session} />
    );
  }

  if (isStartedSession(session)) {
    return (
      <PublicSupportChatRoom
        publicToken={params.publicToken}
        session={session}
      />
    );
  }

  return (
    <PublicWaitingRoom
      publicToken={params.publicToken}
      reason={String(session.reason ?? "--")}
      session={session}
      statusMessage="Procurando atendente disponível..."
    />
  );
}

function PublicWaitingRoom({
  publicToken,
  reason,
  session,
  statusMessage,
}: {
  publicToken?: string;
  reason?: string;
  session?: Record<string, unknown>;
  statusMessage: string;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!publicToken || !isWaitingSession(session ?? {})) return;

    const interval = window.setInterval(() => {
      triggerPublicSupportAITakeover(publicToken)
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.publicRooms.support(publicToken),
          }),
        )
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [publicToken, queryClient, session]);

  return (
    <main className="public-surface grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%),linear-gradient(135deg,#f9fcff,#eff8ff_48%,#f6fffb)] p-4 text-[#0D132B]">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/90 bg-white/92 p-6 text-center shadow-[0_40px_120px_-24px_rgba(13,19,43,0.22)] backdrop-blur md:p-8">
        <div className="mx-auto flex size-18 items-center justify-center rounded-[1.5rem] border border-emerald-100 bg-emerald-50 shadow-[0_18px_50px_rgba(16,185,129,0.16)]">
          <div className="size-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
        </div>
        <p className="mt-6 text-[#0f766e] text-[10px] font-bold uppercase tracking-[0.22em]">
          Sala de suporte
        </p>
        <h1 className="mt-3 font-bold text-3xl text-[#0D132B] tracking-tight">
          Estamos conectando você ao suporte.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-slate-600 text-sm font-medium leading-relaxed">
          Aguarde alguns segundos. Seu atendimento será iniciado em instantes.
        </p>
        <div className="mt-6 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#2563EB] shadow-sm">
              <LifeBuoy className="size-5" />
            </div>
            <p className="min-w-0 truncate font-bold text-[#0D132B]">
              {String(session?.product_name ?? "Produto")}
            </p>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            <InfoRow label="Motivo" value={reason ?? "--"} />
            <InfoRow label="Status" value="Aguardando aceite" />
          </dl>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[#047857] text-sm font-bold">
          <ShieldCheck className="size-4 animate-pulse" />
          {statusMessage}
        </div>
        <div className="mt-8 border-slate-100 border-t pt-6">
          <PoweredBy />
        </div>
      </section>
    </main>
  );
}

function PublicClosedState({
  publicToken,
  session,
}: {
  publicToken: string;
  session: Record<string, unknown>;
}) {
  return (
    <main className="public-surface grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f8fbff,#eef6ff_52%,#f7fffb)] p-4 text-[#0D132B]">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/90 bg-white/92 p-8 text-center shadow-[0_40px_120px_-24px_rgba(13,19,43,0.18)]">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <LockKeyhole className="size-7" />
        </div>
        <p className="text-[#2563EB] text-[10px] font-bold uppercase tracking-[0.2em]">
          Suporte encerrado
        </p>
        <h1 className="mt-3 font-bold text-2xl">Esta sala foi encerrada.</h1>
        <p className="mt-3 text-slate-600 text-sm">
          O suporte de {String(session.product_name ?? "produto")} não está mais
          ativo.
        </p>
        <SessionFeedback publicToken={publicToken} sessionType="support" />
        <div className="mt-8 border-slate-100 border-t pt-6">
          <PoweredBy />
        </div>
      </section>
    </main>
  );
}

function PublicSupportChatRoom({
  publicToken,
  session,
}: {
  publicToken: string;
  session: Record<string, unknown>;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages = [] } = useQuery({
    queryFn: () => listPublicSupportMessages(publicToken),
    queryKey: queryKeys.publicRooms.supportMessages(publicToken),
    refetchInterval: 2500,
  });
  const sendMutation = useMutation({
    mutationFn: () => sendPublicSupportMessage(publicToken, message.trim()),
    onError: () => toast.error("Não foi possível enviar a mensagem."),
    onSuccess: async () => {
      setMessage("");
      if (session.handled_by_type === "ai") {
        await triggerPublicSupportAIAutoReply(publicToken).catch(() => {
          toast.error("A IA não conseguiu responder agora.");
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.publicRooms.supportMessages(publicToken),
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  }

  return (
    <main className="public-surface min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,#f9fcff,#eff8ff_48%,#f6fffb)] p-3 text-[#0D132B] sm:p-6 md:p-8">
      <section className="mx-auto grid max-w-6xl gap-6 h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-[1.75rem] border border-white/90 bg-white/88 p-6 shadow-[0_24px_70px_rgba(13,19,43,0.1)] backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0f766e] text-white shadow-lg shadow-emerald-200">
              <LifeBuoy className="size-5" />
            </div>
            <p className="font-bold text-[#0D132B]">Kynovra Support</p>
          </div>
          <p className="text-[#0f766e] text-[10px] font-bold uppercase tracking-[0.2em]">
            Sala de suporte
          </p>
          <h1 className="mt-2 font-bold text-2xl text-[#0D132B] tracking-tight">
            {String(session.product_name ?? "Produto")}
          </h1>
          <p className="mt-4 text-slate-600 text-sm font-medium leading-relaxed">
            Atendimento pós-venda com leitura limpa, histórico preservado e
            conexão segura com a equipe.
          </p>
          <dl className="mt-6 grid gap-2 text-sm">
            <InfoRow label="Motivo" value={String(session.reason ?? "--")} />
            <InfoRow label="Status" value="Atendimento iniciado" />
            <InfoRow
              label="Código"
              value={String(session.continuity_code ?? "--")}
            />
          </dl>
          <div className="mt-auto hidden border-slate-100 border-t pt-6 lg:block">
            <PoweredBy />
          </div>
        </aside>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-white/96 shadow-[0_34px_100px_-24px_rgba(13,19,43,0.22)]">
          <div className="flex items-center gap-4 border-blue-100 border-b bg-white/70 px-6 py-4 backdrop-blur-sm">
            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#ecfdf5] text-slate-500 ring-1 ring-emerald-100">
                {session.handled_by_type === "ai" ? (
                  <Zap className="size-5 fill-current text-[#0f766e]" />
                ) : (
                  <User className="size-5" />
                )}
              </div>
              <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
            </div>
            <div>
              <p className="font-bold text-[#0D132B] leading-none">
                {session.handled_by_type === "ai"
                  ? "IA de Suporte Kynovra"
                  : "Equipe de Suporte Kynovra"}
              </p>
              <p className="mt-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                Atendimento iniciado
              </p>
            </div>
          </div>
          <div
            className="premium-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6 scroll-smooth"
            ref={scrollRef}
          >
            {messages.length === 0 ? (
              <div className="max-w-[85%] rounded-[1.5rem] rounded-bl-none border border-slate-200 bg-white p-4 text-slate-800 text-sm font-medium leading-relaxed shadow-sm md:max-w-md">
                <FormattedContent>
                  {session.handled_by_type === "ai"
                    ? AI_FIRST_MESSAGE
                    : "Olá, tudo bem? Seu atendimento de suporte já foi iniciado. Vou te ajudar com os próximos passos."}
                </FormattedContent>
              </div>
            ) : (
              messages.map((item) => (
                <div
                  className={cn(
                    "max-w-[85%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm md:max-w-md",
                    item.sender_type === "customer"
                      ? "ml-auto rounded-br-none bg-[#0D132B] text-white shadow-blue-200"
                      : "rounded-bl-none border border-slate-200 bg-white text-slate-800",
                  )}
                  key={item.id}
                >
                  <FormattedContent>{item.content}</FormattedContent>
                </div>
              ))
            )}
          </div>
          <form
            className="border-blue-100 border-t bg-white p-4 md:p-6"
            onSubmit={handleSubmit}
          >
            <PublicField id="public-support-message" label="Mensagem">
              <div className="flex gap-3">
                <Input
                  className="h-12 rounded-2xl border-emerald-100 bg-[#f6fffb] px-5 transition-all font-medium focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  id="public-support-message"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Digite sua mensagem..."
                  value={message}
                />
                <Button
                  aria-label="Enviar mensagem"
                  className="size-12 shrink-0 rounded-2xl bg-[#0f766e] shadow-emerald-100 shadow-lg transition-all hover:bg-[#0b5f59] active:scale-95"
                  disabled={sendMutation.isPending || !message.trim()}
                  size="icon"
                  type="submit"
                >
                  {sendMutation.isPending ? (
                    <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <Send className="size-5" />
                  )}
                </Button>
              </div>
            </PublicField>
            <p className="mt-3 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              Sua conversa é privada e segura
            </p>
          </form>
        </section>
      </section>
      <div className="mt-4 lg:hidden">
        <PoweredBy />
      </div>
    </main>
  );
}

function isWaitingSession(session: Record<string, unknown>) {
  return (
    session.status === "waiting_for_acceptance" ||
    session.status === "waiting" ||
    session.status === "accepted"
  );
}

function isStartedSession(session: Record<string, unknown>) {
  return session.status === "ai_takeover" || session.status === "in_progress";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
      <dt className="text-slate-500 text-xs">{label}</dt>
      <dd className="mt-1 font-semibold text-[#0D132B]">{value}</dd>
    </div>
  );
}

function PublicField({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="font-semibold text-slate-700 text-xs" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
