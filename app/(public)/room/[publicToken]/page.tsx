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
import { PoweredBy } from "@/components/public/powered-by";
import { SessionFeedback } from "@/components/public/session-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { data: session, isLoading } = useQuery({
    queryFn: () => getPublicSalesSession(params.publicToken),
    queryKey: queryKeys.publicRooms.sales(params.publicToken),
    refetchInterval: 2500,
  });

  if (isLoading || !session) {
    return <PublicWaitingRoom statusMessage="Iniciando conexão segura..." />;
  }

  if (isWaitingSession(session)) {
    return (
      <PublicWaitingRoom
        publicToken={params.publicToken}
        session={session}
        statusMessage="Aguardando um especialista disponível..."
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
      <PublicChatRoom publicToken={params.publicToken} session={session} />
    );
  }

  return (
    <PublicWaitingRoom
      publicToken={params.publicToken}
      session={session}
      statusMessage="Sincronizando dados da sala..."
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
    <main className="public-surface grid min-h-screen place-items-center p-4 text-slate-900">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-[2.5rem] border border-white bg-white/80 p-8 text-center shadow-[0_40px_120px_-20px_rgba(15,23,42,0.15)] backdrop-blur-md md:p-12"
      >
        <div className="mx-auto flex size-20 items-center justify-center rounded-[2rem] border border-blue-100 bg-blue-50 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]">
          <div className="size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>

        <div className="mt-8">
          <span className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.25em]">
            Sala de Atendimento
          </span>
          <h1 className="mt-3 font-bold text-3xl text-slate-900 tracking-tight leading-tight">
            Conectando você ao nosso time
          </h1>
          <p className="mx-auto mt-4 max-w-md text-slate-500 font-medium">
            Aguarde um instante. Estamos localizando o melhor especialista para
            o seu atendimento.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left flex items-center gap-4">
            <div className="size-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
              <ShoppingBag className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">
                {String(session?.product_name ?? "Produto")}
              </p>
              <p className="text-slate-500 text-xs font-medium truncate">
                {String(
                  session?.main_benefit ?? "Atendimento comercial seguro.",
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-6 py-4 text-blue-700 text-sm font-bold flex items-center justify-center gap-3">
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
}) {
  return (
    <main className="public-surface grid min-h-screen place-items-center p-4 text-slate-900">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-[2.5rem] border border-white bg-white/80 p-10 text-center shadow-[0_40px_120px_-20px_rgba(0,0,0,0.1)]"
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
    <main className="public-surface min-h-screen p-3 text-slate-900 sm:p-6 md:p-8">
      <section className="mx-auto grid max-w-6xl gap-6 h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] lg:grid-cols-[22rem_1fr]">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <ShoppingBag className="size-5" />
              </div>
              <p className="font-bold text-slate-900">Kynovra Store</p>
            </div>

            <p className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em]">
              Você está em
            </p>
            <h1 className="mt-2 font-bold text-2xl tracking-tight leading-tight">
              {String(session.product_name ?? "Produto")}
            </h1>
            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
              Atendimento comercial exclusivo. Tire suas dúvidas e finalize sua
              compra com segurança total.
            </p>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="size-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Conexão Criptografada
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
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
          className="flex flex-col overflow-hidden rounded-[2.5rem] border border-white bg-white/95 shadow-[0_32px_100px_-20px_rgba(0,0,0,0.1)]"
        >
          <header className="flex items-center justify-between border-slate-100 border-b bg-white/50 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  {session.handled_by_type === "ai" ? (
                    <Zap className="size-5 fill-current text-blue-500" />
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
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth premium-scrollbar"
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[85%] rounded-[2rem] rounded-bl-none bg-slate-100 p-5 text-sm font-medium leading-relaxed md:max-w-md shadow-sm"
              >
                {session.handled_by_type === "ai"
                  ? AI_FIRST_MESSAGE
                  : "Olá! Meu nome é [Atendente] e já estou analisando seu pedido. Em que posso te ajudar com a finalização da compra?"}
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
                        ? "rounded-[1.5rem] rounded-br-none bg-blue-600 text-white"
                        : "rounded-[1.5rem] rounded-bl-none bg-slate-100 text-slate-800",
                    )}
                  >
                    {item.content}
                  </div>
                  <span className="mt-1.5 px-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {item.sender_type === "customer" ? "Você" : "Atendente"}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          <form
            className="border-slate-100 border-t bg-white p-4 md:p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  id="public-chat-message"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-5 pr-12 transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Escreva sua mensagem..."
                  value={message}
                />
              </div>
              <Button
                aria-label="Enviar mensagem"
                disabled={sendMutation.isPending || !message.trim()}
                size="icon"
                className="size-12 shrink-0 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
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
