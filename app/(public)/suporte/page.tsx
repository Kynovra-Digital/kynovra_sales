"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, KeyRound, MessageCircleMore } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PoweredBy } from "@/components/public/powered-by";
import { PublicAccessModal } from "@/components/public/public-access-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePublicAuth } from "@/hooks/use-public-auth";
import {
  createSupportSession,
  listPublicActiveProducts,
  validateContinuityCode,
} from "@/lib/supabase/queries/public";

export default function PublicSupportEntryPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = usePublicAuth();
  const [mode, setMode] = useState<"code" | "new">("new");
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [productId, setProductId] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [continuityCode, setContinuityCode] = useState("");
  const [isExpired, setExpired] = useState(false);
  const { data: products = [] } = useQuery({
    queryFn: listPublicActiveProducts,
    queryKey: ["public", "products"],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAccessModal(true);
    }
  }, [authLoading, user]);
  const createMutation = useMutation({
    mutationFn: () =>
      createSupportSession({
        customReason,
        initialMessage,
        productId,
        reason,
      }),
    onError: () => toast.error("Não foi possível iniciar o suporte."),
    onSuccess: (result) => router.push(`/suporte/sala/${result.public_token}`),
  });
  const validateMutation = useMutation({
    mutationFn: validateContinuityCode,
    onError: () => setExpired(true),
    onSuccess: (result) => {
      if (result.success && result.public_token) {
        router.push(`/suporte/sala/${result.public_token}`);
        return;
      }
      setExpired(true);
    },
  });

  function handleStartSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setShowAccessModal(true);
      return;
    }
    createMutation.mutate();
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setShowAccessModal(true);
      return;
    }
    validateMutation.mutate(continuityCode);
  }

  return (
    <main className="public-surface min-h-screen px-4 py-5 text-slate-950 md:py-8">
      <PublicAccessModal
        description="Entre com e-mail e senha ou continue com Google para abrir ou continuar seu suporte. Etapas sensíveis adicionais serão puladas."
        onOpenChange={setShowAccessModal}
        open={showAccessModal}
        redirectPath="/suporte"
        title="Entre para acessar o suporte"
      />
      <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-white bg-[linear-gradient(135deg,#0d132b,#2563eb_58%,#7c3aed)] p-5 text-white shadow-[0_28px_80px_rgb(37_99_235_/_0.22)] md:p-8">
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <MessageCircleMore />
          </span>
          <h1 className="mt-6 max-w-2xl font-semibold text-3xl md:text-4xl">
            Suporte Kynovra Sales
          </h1>
          <p className="mt-3 max-w-xl text-blue-50">
            Inicie um novo atendimento ou continue uma solicitação usando seu
            código.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => {
                setMode("new");
                setExpired(false);
              }}
              variant={mode === "new" ? "secondary" : "outline"}
            >
              Iniciar suporte
            </Button>
            <Button
              onClick={() => {
                setMode("code");
                setExpired(false);
              }}
              variant={mode === "code" ? "secondary" : "outline"}
            >
              Tenho um código de continuidade
            </Button>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_50px_rgb(15_23_42_/_0.08)]">
          {mode === "new" ? (
            <form className="grid gap-4" onSubmit={handleStartSupport}>
              <h2 className="font-semibold text-2xl">Iniciar suporte</h2>
              <SupportAuthStatus
                isLoading={authLoading}
                onLogin={() => setShowAccessModal(true)}
                userLabel={user?.name || user?.email || null}
              />
              <PublicField id="support-product" label="Produto">
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  id="support-product"
                  onChange={(event) => setProductId(event.target.value)}
                  required
                  value={productId}
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </PublicField>
              <PublicField id="support-reason" label="Motivo">
                <Input
                  id="support-reason"
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Acesso, compra ou entrega"
                  required
                  value={reason}
                />
              </PublicField>
              <PublicField id="support-other-reason" label="Outro motivo">
                <Input
                  id="support-other-reason"
                  onChange={(event) => setCustomReason(event.target.value)}
                  placeholder="Descreva se necessário"
                  value={customReason}
                />
              </PublicField>
              <PublicField id="support-message" label="Mensagem inicial">
                <Textarea
                  id="support-message"
                  onChange={(event) => setInitialMessage(event.target.value)}
                  placeholder="Conte rapidamente o que aconteceu"
                  required
                  value={initialMessage}
                />
              </PublicField>
              <Button
                className="h-11 gap-2"
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? "Iniciando..." : "Iniciar suporte"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={handleContinue}>
              <h2 className="font-semibold text-2xl">Código de continuidade</h2>
              <SupportAuthStatus
                isLoading={authLoading}
                onLogin={() => setShowAccessModal(true)}
                userLabel={user?.name || user?.email || null}
              />
              <PublicField id="continuity-code" label="Código de continuidade">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                  <KeyRound className="size-4 text-slate-500" />
                  <Input
                    className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    id="continuity-code"
                    onChange={(event) => setContinuityCode(event.target.value)}
                    placeholder="KS-7F4A9Q-X2M8P"
                    value={continuityCode}
                  />
                </div>
              </PublicField>
              <Button
                className="h-11"
                disabled={validateMutation.isPending}
                type="submit"
              >
                Continuar atendimento
              </Button>
              {isExpired ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                  Atendimento encerrado por limite de tempo.
                  <Button
                    className="mt-3"
                    onClick={() => {
                      setMode("new");
                      setExpired(false);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Iniciar novo suporte
                  </Button>
                </div>
              ) : null}
            </form>
          )}
        </aside>
      </section>
      <div className="mt-6">
        <PoweredBy />
      </div>
    </main>
  );
}

function SupportAuthStatus({
  isLoading,
  onLogin,
  userLabel,
}: {
  isLoading: boolean;
  onLogin: () => void;
  userLabel: string | null;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm">
      <p className="font-semibold text-blue-950">Identificação segura</p>
      <p className="mt-1 text-blue-800/80 text-xs leading-5">
        {userLabel
          ? `Você continuará como ${userLabel}.`
          : "Faça login para abrir ou continuar um suporte sem repetir dados sensíveis."}
      </p>
      {!userLabel ? (
        <Button
          className="mt-3 h-9 rounded-xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
          disabled={isLoading}
          onClick={onLogin}
          type="button"
          variant="outline"
        >
          {isLoading ? "Verificando..." : "Fazer login"}
        </Button>
      ) : null}
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
