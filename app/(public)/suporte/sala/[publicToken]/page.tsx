"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PoweredBy } from "@/components/public/powered-by";
import { SessionFeedback } from "@/components/public/session-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicSupportSession,
  listPublicSupportMessages,
  sendPublicSupportMessage,
  triggerPublicSupportAIAutoReply,
  triggerPublicSupportAITakeover,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";

const AI_FIRST_MESSAGE =
  "Olá, tudo bem? Seu atendimento já foi iniciado. Vou analisar sua solicitação e te ajudar com os próximos passos.";

export default function PublicSupportRoomPage() {
  const params = useParams<{ publicToken: string }>();
  const { data: session, isLoading } = useQuery({
    queryFn: () => getPublicSupportSession(params.publicToken),
    queryKey: queryKeys.publicRooms.support(params.publicToken),
    refetchInterval: 2500,
  });

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
    <main className="public-surface grid min-h-screen place-items-center p-4 text-slate-950">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/92 p-5 text-center shadow-[0_24px_80px_rgb(15_23_42_/_0.12)] backdrop-blur md:p-7">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 shadow-[0_0_36px_rgb(37_99_235_/_0.18)]">
          <div className="size-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        </div>
        <p className="mt-5 text-blue-700 text-xs font-medium uppercase tracking-[0.16em]">
          Sala de suporte
        </p>
        <h1 className="mt-2 font-semibold text-2xl text-slate-950">
          Estamos conectando você ao suporte.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600 text-sm">
          Aguarde alguns segundos. Seu atendimento será iniciado em instantes.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="font-medium text-slate-950">
            {String(session?.product_name ?? "Produto")}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <InfoRow label="Motivo" value={reason ?? "--"} />
            <InfoRow label="Status" value="Aguardando aceite" />
          </dl>
        </div>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 text-sm">
          {statusMessage}
        </div>
        <PoweredBy />
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
    <main className="public-surface grid min-h-screen place-items-center p-4 text-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/92 p-6 text-center shadow-[0_24px_80px_rgb(15_23_42_/_0.12)]">
        <p className="text-blue-700 text-xs font-medium uppercase tracking-[0.16em]">
          Suporte encerrado
        </p>
        <h1 className="mt-3 font-semibold text-2xl">
          Esta sala foi encerrada.
        </h1>
        <p className="mt-3 text-slate-600 text-sm">
          O suporte de {String(session.product_name ?? "produto")} não está mais
          ativo.
        </p>
        <SessionFeedback publicToken={publicToken} sessionType="support" />
        <PoweredBy />
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
    <main className="public-surface min-h-screen p-3 text-slate-950 sm:p-4">
      <section className="mx-auto grid max-w-6xl gap-4 py-3 md:py-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgb(15_23_42_/_0.08)] backdrop-blur">
          <p className="text-blue-700 text-xs font-medium uppercase tracking-[0.12em]">
            Sala de suporte
          </p>
          <h1 className="mt-2 font-semibold text-2xl">
            {String(session.product_name ?? "Produto")}
          </h1>
          <dl className="mt-4 grid gap-2 text-sm">
            <InfoRow label="Motivo" value={String(session.reason ?? "--")} />
            <InfoRow label="Status" value="Atendimento iniciado" />
            <InfoRow
              label="Código"
              value={String(session.continuity_code ?? "--")}
            />
          </dl>
        </aside>
        <section className="flex h-[calc(100vh-12rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_22px_70px_rgb(15_23_42_/_0.1)] lg:h-[calc(100vh-5rem)]">
          <div className="border-slate-200 border-b p-3">
            <p className="font-semibold">
              {session.handled_by_type === "ai"
                ? "IA de Suporte Kynovra"
                : "Equipe de Suporte Kynovra"}
            </p>
            <p className="text-emerald-600 text-sm">atendimento iniciado</p>
          </div>
          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
            ref={scrollRef}
          >
            {messages.length === 0 ? (
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 p-3 text-sm md:max-w-md">
                {session.handled_by_type === "ai"
                  ? AI_FIRST_MESSAGE
                  : "Olá, tudo bem? Seu atendimento de suporte já foi iniciado. Vou te ajudar com os próximos passos."}
              </div>
            ) : (
              messages.map((item) => (
                <div
                  className={
                    item.sender_type === "customer"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 p-3 text-sm text-white md:max-w-md"
                      : "max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 p-3 text-sm md:max-w-md"
                  }
                  key={item.id}
                >
                  {item.content}
                </div>
              ))
            )}
          </div>
          <form
            className="border-slate-200 border-t p-3"
            onSubmit={handleSubmit}
          >
            <PublicField id="public-support-message" label="Mensagem">
              <div className="flex gap-2">
                <Input
                  id="public-support-message"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Digite sua mensagem..."
                  value={message}
                />
                <Button
                  aria-label="Enviar mensagem"
                  disabled={sendMutation.isPending}
                  size="icon"
                  type="submit"
                >
                  <Send />
                </Button>
              </div>
            </PublicField>
          </form>
        </section>
      </section>
      <PoweredBy />
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-slate-500 text-xs">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
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
      <label className="font-medium text-slate-700 text-xs" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
