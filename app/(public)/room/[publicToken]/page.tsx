"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LockKeyhole,
  Send,
  ShieldCheck,
  ShoppingBag,
  User,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormattedContent } from "@/components/chat/formatted-content";
import { PoweredBy } from "@/components/public/powered-by";
import { PublicLoginPrompt } from "@/components/public/public-login-prompt";
import { SessionFeedback } from "@/components/public/session-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type PublicUser, usePublicAuth } from "@/hooks/use-public-auth";
import {
  getPublicSalesSession,
  listPublicSalesMessages,
  sendPublicSalesMessage,
  triggerPublicSalesAIAutoReply,
  triggerPublicSalesAITakeover,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

const AI_FIRST_MESSAGE =
  "Olá! Sou o assistente inteligente da Kynovra. Já estou analisando seu interesse e logo um especialista humano também poderá se juntar a nós. Como posso te ajudar com este produto hoje?";

export default function PublicSalesRoomPage() {
  const params = useParams<{ publicToken: string }>();
  const { user, isLoading: authLoading, signOut } = usePublicAuth();

  const { data: session, isLoading } = useQuery({
    queryFn: () => getPublicSalesSession(params.publicToken),
    queryKey: queryKeys.publicRooms.sales(params.publicToken),
    refetchInterval: 2500,
    enabled: !!user, // Só carrega a sessão se usuário estiver logado
  });

  // Se ainda estiver carregando auth, mostra loader
  if (authLoading) {
    return <PublicWaitingRoom statusMessage="Carregando autenticação..." />;
  }

  // Se não estiver logado, mostra tela de login
  if (!user) {
    return (
      <PublicLoginPrompt
        description="Faça login com e-mail e senha ou continue com Google para acessar sua sala de atendimento."
        redirectPath={`/room/${params.publicToken}`}
        title="Entre para acessar o atendimento"
      />
    );
  }

  if (isLoading || !session) {
    return <PublicWaitingRoom statusMessage="Iniciando conexão segura..." />;
  }

  if (isWaitingSession(session)) {
    return (
      <PublicWaitingRoom
        publicToken={params.publicToken}
        session={session}
        statusMessage="Aguardando um especialista disponível..."
        user={user}
        onSignOut={signOut}
      />
    );
  }

  if (session.status === "closed") {
    return (
      <PublicClosedState
        publicToken={params.publicToken}
        session={session}
        user={user}
        onSignOut={signOut}
      />
    );
  }

  if (isStartedSession(session)) {
    return (
      <PublicChatRoom
        publicToken={params.publicToken}
        session={session}
        user={user}
        onSignOut={signOut}
      />
    );
  }

  return (
    <PublicWaitingRoom
      publicToken={params.publicToken}
      session={session}
      statusMessage="Sincronizando dados da sala..."
      user={user}
      onSignOut={signOut}
    />
  );
}

function PublicWaitingRoom({
  publicToken,
  session,
  statusMessage,
}: {
  publicToken?: string;
  session?: Record<string, unknown>;
  statusMessage: string;
  user?: PublicUser;
  onSignOut?: () => void;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!publicToken || !isWaitingSession(session ?? {})) return;

    const interval = window.setInterval(() => {
      triggerPublicSalesAITakeover(publicToken)
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.publicRooms.sales(publicToken),
          }),
        )
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [publicToken, queryClient, session]);

  return (
    <main className="public-surface grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#f8fbff,#eef6ff_52%,#f7fffb)] p-4 text-[#0D132B]">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-[2rem] border border-white/90 bg-white/90 p-8 text-center shadow-[0_40px_120px_-24px_rgba(13,19,43,0.22)] backdrop-blur-md md:p-12"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] border border-emerald-100 bg-emerald-50 shadow-[0_18px_50px_rgba(16,185,129,0.16)]">
          <div className="size-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
        </div>

        <div className="mt-8">
          <span className="text-[#2563EB] text-[10px] font-bold uppercase tracking-[0.25em]">
            Sala de Atendimento
          </span>
          <h1 className="mt-3 font-bold text-3xl text-[#0D132B] tracking-tight leading-tight">
            Conectando você ao nosso time
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-600 font-medium">
            Aguarde um instante. Estamos localizando o melhor especialista para
            o seu atendimento.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 text-left flex items-center gap-4">
            <div className="size-12 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-[#2563EB] shadow-sm">
              <ShoppingBag className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#0D132B] truncate">
                {String(session?.product_name ?? "Produto")}
              </p>
              <p className="text-slate-500 text-xs font-medium truncate">
                {String(
                  session?.main_benefit ?? "Atendimento comercial seguro.",
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700 text-sm font-bold flex items-center justify-center gap-3">
            <ShieldCheck className="size-4 animate-pulse" />
            {statusMessage}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <PoweredBy />
        </div>
      </motion.section>
    </main>
  );
}

function PublicClosedState({
  publicToken,
  session,
}: {
  publicToken: string;
  session: Record<string, unknown>;
  user?: PublicUser;
  onSignOut?: () => void;
}) {
  return (
    <main className="public-surface grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f8fbff,#eef6ff_52%,#f7fffb)] p-4 text-[#0D132B]">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-[2rem] border border-white/90 bg-white/90 p-10 text-center shadow-[0_40px_120px_-24px_rgba(13,19,43,0.18)]"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <LockKeyhole className="size-8" />
        </div>
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Sessão Encerrada
        </span>
        <h1 className="mt-3 font-bold text-2xl text-slate-900">
          Este atendimento foi finalizado
        </h1>
        <p className="mt-4 text-slate-500 font-medium">
          Obrigado pelo seu interesse em{" "}
          {String(session.product_name ?? "nosso produto")}. Se precisar de algo
          mais, inicie um novo contato.
        </p>
        <SessionFeedback publicToken={publicToken} sessionType="sales" />
        <div className="mt-10 pt-8 border-t border-slate-100">
          <PoweredBy />
        </div>
      </motion.section>
    </main>
  );
}

function PublicChatRoom({
  publicToken,
  session,
}: {
  publicToken: string;
  session: Record<string, unknown>;
  user?: PublicUser;
  onSignOut?: () => void;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryFn: () => listPublicSalesMessages(publicToken),
    queryKey: queryKeys.publicRooms.salesMessages(publicToken),
    refetchInterval: 2500,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendPublicSalesMessage(publicToken, message.trim()),
    onError: () => toast.error("Não foi possível enviar a mensagem."),
    onSuccess: async () => {
      setMessage("");
      if (session.handled_by_type === "ai") {
        await triggerPublicSalesAIAutoReply(publicToken).catch(() => {
          toast.error("A IA não conseguiu responder agora.");
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.publicRooms.salesMessages(publicToken),
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  }

  return (
    <main className="public-surface min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.13),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.11),transparent_34%),linear-gradient(135deg,#f8fbff,#eff7ff_48%,#f7fffb)] p-3 text-[#0D132B] sm:p-6 md:p-8">
      <section className="mx-auto grid max-w-6xl gap-6 h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] lg:grid-cols-[22rem_1fr]">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="rounded-[1.75rem] border border-white/90 bg-white/88 p-6 shadow-[0_24px_70px_rgba(13,19,43,0.1)] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <ShoppingBag className="size-5" />
              </div>
              <p className="font-bold text-slate-900">Kynovra Store</p>
            </div>

            <p className="text-[#2563EB] text-[10px] font-bold uppercase tracking-[0.2em]">
              Você está em
            </p>
            <h1 className="mt-2 font-bold text-2xl tracking-tight leading-tight text-[#0D132B]">
              {String(session.product_name ?? "Produto")}
            </h1>
            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
              Atendimento comercial exclusivo. Tire suas dúvidas e finalize sua
              compra com segurança total.
            </p>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 ring-1 ring-emerald-100">
                  <ShieldCheck className="size-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Conexão Criptografada
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB] ring-1 ring-blue-100">
                  <LockKeyhole className="size-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Checkout Seguro
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block mt-auto">
            <PoweredBy />
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-white/96 shadow-[0_34px_100px_-24px_rgba(13,19,43,0.22)]"
        >
          <header className="flex items-center justify-between border-blue-100 border-b bg-white/70 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-10 rounded-full bg-[#eef6ff] flex items-center justify-center text-slate-500 ring-1 ring-blue-100">
                  {session.handled_by_type === "ai" ? (
                    <Zap className="size-5 fill-current text-[#2563EB]" />
                  ) : (
                    <User className="size-5" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-none">
                  {session.handled_by_type === "ai"
                    ? "Assistente IA"
                    : "Especialista Kynovra"}
                </p>
                <p className="mt-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  Atendimento Ativo
                </p>
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6 space-y-6 scroll-smooth premium-scrollbar"
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[85%] rounded-[1.5rem] rounded-bl-none border border-slate-200 bg-white p-5 text-sm font-medium leading-relaxed text-slate-700 md:max-w-md shadow-sm"
              >
                <FormattedContent>
                  {session.handled_by_type === "ai"
                    ? AI_FIRST_MESSAGE
                    : "Olá! Meu nome é [Atendente] e já estou analisando seu pedido. Em que posso te ajudar com a finalização da compra?"}
                </FormattedContent>
              </motion.div>
            ) : (
              messages.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex flex-col",
                    item.sender_type === "customer"
                      ? "items-end"
                      : "items-start",
                  )}
                  key={item.id}
                >
                  <div
                    className={cn(
                      "max-w-[85%] p-4 text-sm font-medium leading-relaxed shadow-sm md:max-w-md",
                      item.sender_type === "customer"
                        ? "rounded-[1.5rem] rounded-br-none bg-[#2563EB] text-white shadow-blue-200"
                        : "rounded-[1.5rem] rounded-bl-none border border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    <FormattedContent>{item.content}</FormattedContent>
                  </div>
                  <span className="mt-1.5 px-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {item.sender_type === "customer" ? "Você" : "Atendente"}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          <form
            className="border-blue-100 border-t bg-white p-4 md:p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  id="public-chat-message"
                  className="h-12 rounded-2xl border-blue-100 bg-[#f8fbff] px-5 pr-12 transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Escreva sua mensagem..."
                  value={message}
                />
              </div>
              <Button
                aria-label="Enviar mensagem"
                disabled={sendMutation.isPending || !message.trim()}
                size="icon"
                className="size-12 shrink-0 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] shadow-lg shadow-blue-100 transition-all active:scale-95"
                type="submit"
              >
                {sendMutation.isPending ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Send className="size-5 ml-0.5" />
                )}
              </Button>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              Sua conversa é privada e segura
            </p>
          </form>
        </motion.section>
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
