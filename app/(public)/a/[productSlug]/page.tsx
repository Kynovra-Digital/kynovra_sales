"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, ShoppingBag, Star, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PoweredBy } from "@/components/public/powered-by";
import { PublicAccessModal } from "@/components/public/public-access-modal";
import { Button } from "@/components/ui/button";
import { usePublicAuth } from "@/hooks/use-public-auth";
import {
  createSalesSessionFromProduct,
  findExistingSalesSessionFromProduct,
  getPublicProductBySlug,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";

export default function ProductAttendanceEntryPage() {
  const params = useParams<{ productSlug: string }>();
  const router = useRouter();
  const { isLoading: authLoading, user } = usePublicAuth();
  const [showAccessModal, setShowAccessModal] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryFn: () => getPublicProductBySlug(params.productSlug),
    queryKey: queryKeys.products.public(params.productSlug),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAccessModal(true);
    }
  }, [authLoading, user]);

  const { isFetching: isCheckingSession } = useQuery({
    enabled: Boolean(product && product.status === "active"),
    queryFn: async () => {
      const existing = await findExistingSalesSessionFromProduct(
        params.productSlug,
      );

      if (existing?.public_token) {
        router.replace(`/room/${existing.public_token}`);
      }

      return existing;
    },
    queryKey: ["public-sales-existing-session", params.productSlug],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createSalesSessionFromProduct({
        customerEmail: user?.email ?? "",
        customerName: getPublicUserDisplayName(user),
        productSlug: params.productSlug,
      }),
    onError: () => toast.error("Não foi possível iniciar o atendimento."),
    onSuccess: (result) => router.push(`/room/${result.public_token}`),
  });

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || product.status !== "active") return;
    if (!user) {
      setShowAccessModal(true);
      return;
    }
    createMutation.mutate();
  }

  if (isLoading || authLoading || isCheckingSession) {
    return (
      <PublicState
        description="Estamos verificando se você já possui um atendimento em andamento..."
        title="Kynovra Sales"
        isLoading
      />
    );
  }

  if (!product) {
    return (
      <PublicState
        description="O link informado não está disponível ou foi removido. Verifique se o endereço está correto."
        title="Produto não encontrado"
      />
    );
  }

  if (product.status === "paused") {
    return (
      <PublicState
        description="Este produto está temporariamente indisponível para atendimento. Tente novamente mais tarde."
        title={product.name}
      />
    );
  }

  if (product.status === "out_of_stock") {
    return (
      <PublicState
        actionLabel="Ver outros produtos"
        description="Infelizmente este produto está com o estoque esgotado no momento."
        title={product.name}
      />
    );
  }

  return (
    <main className="public-surface min-h-screen px-4 py-8 text-slate-900 md:py-12">
      <PublicAccessModal
        description="Entre com e-mail e senha ou continue com Google para iniciar um atendimento comercial seguro. Dados sensíveis adicionais serão pulados."
        onOpenChange={setShowAccessModal}
        open={showAccessModal}
        redirectPath={`/a/${params.productSlug}`}
        title="Entre para falar com especialista"
      />
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Checkout Seguro
              </p>
              <h2 className="font-bold text-lg leading-none">Kynovra Store</h2>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Criptografia 256-bit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={`customer-avatar-${i}`}
                    className="size-6 rounded-full border-2 border-white bg-slate-200"
                  />
                ))}
              </div>
              <span className="text-xs">842 pessoas atendidas hoje</span>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden rounded-[2.5rem] border border-white bg-white/40 shadow-[0_32px_120px_-20px_rgba(15,23,42,0.12)] backdrop-blur-sm"
          >
            <div className="relative flex min-h-[30rem] flex-col items-center justify-center p-8 md:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#dbeafe,transparent_40%),radial-gradient(circle_at_70%_80%,#ede9fe,transparent_40%)]" />

              <motion.div
                whileHover={{ y: -5 }}
                className="relative w-full max-w-md rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)] backdrop-blur-md"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-inner">
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <ShoppingBag className="size-32" />
                  </div>
                  <div className="absolute top-4 right-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md uppercase tracking-widest">
                    Lançamento
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-1 text-amber-400 mb-2">
                    {["one", "two", "three", "four", "five"].map((star) => (
                      <Star
                        key={`product-star-${star}`}
                        className="size-3.5 fill-current"
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      4.9/5.0
                    </span>
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 tracking-tight">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-slate-500 font-medium leading-relaxed">
                    {product.main_benefit}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Preço Especial
                      </p>
                      <p className="text-2xl font-black text-blue-600">
                        Confira no chat
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                      <Zap className="size-4 fill-current" />
                      <span className="text-xs font-bold">Pronta entrega</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-md md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="size-3.5" />
                Venda Assistida
              </span>

              <h1 className="mt-6 font-bold text-3xl text-slate-900 leading-[1.15] tracking-tight">
                Inicie seu atendimento exclusivo
              </h1>

              <p className="mt-4 text-slate-500 font-medium leading-relaxed">
                Entre com sua conta para conectar-se a um especialista que
                guiará sua jornada, sem repetir dados sensíveis.
              </p>

              <form className="mt-8 grid gap-5" onSubmit={handleStart}>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="font-bold text-blue-900 text-sm">
                    Identificação segura
                  </p>
                  <p className="mt-1 text-blue-800/80 text-xs leading-5">
                    {user
                      ? `Você continuará como ${getPublicUserDisplayName(user)}.`
                      : "Faça login para iniciar o atendimento. Nome e e-mail serão usados a partir da sua conta autenticada."}
                  </p>
                  {!user ? (
                    <Button
                      className="mt-3 h-10 rounded-xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowAccessModal(true)}
                      type="button"
                      variant="outline"
                    >
                      Fazer login
                    </Button>
                  ) : null}
                </div>

                <Button
                  className="mt-2 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-300 transition-all active:scale-[0.98] font-bold text-base gap-3"
                  disabled={createMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Iniciando...
                    </div>
                  ) : (
                    <>
                      Falar com especialista
                      <ArrowRight className="size-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[10px] font-medium text-slate-400 text-center uppercase tracking-widest">
                  Garantia de satisfação de 7 dias
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-center gap-3">
              <div className="size-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Privacidade Garantida
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Seus dados estão protegidos por criptografia de ponta.
                </p>
              </div>
            </div>
          </motion.aside>
        </section>

        <footer className="mt-12 flex flex-col items-center gap-6">
          <PoweredBy />
        </footer>
      </div>
    </main>
  );
}

function PublicState({
  actionLabel,
  description,
  title,
  isLoading = false,
}: {
  actionLabel?: string;
  description: string;
  title: string;
  isLoading?: boolean;
}) {
  return (
    <main className="public-surface grid min-h-screen place-items-center px-4 text-slate-900">
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2.5rem] border border-white bg-white/80 p-10 text-center shadow-[0_32px_100px_-20px_rgba(0,0,0,0.1)] backdrop-blur-md"
      >
        {isLoading ? (
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          </div>
        ) : (
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShoppingBag className="size-8" />
          </div>
        )}
        <h1 className="font-bold text-2xl tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">
          {description}
        </p>

        {actionLabel && (
          <Button
            className="mt-8 h-12 px-8 rounded-xl font-bold"
            variant="outline"
          >
            {actionLabel}
          </Button>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100">
          <PoweredBy />
        </div>
      </motion.section>
    </main>
  );
}

function getPublicUserDisplayName(
  user: ReturnType<typeof usePublicAuth>["user"],
) {
  return user?.name?.trim() || user?.email?.split("@").at(0) || "Cliente";
}

function LockKeyhole({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-labelledby="lock-title"
    >
      <title id="lock-title">Ícone de cadeado</title>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}
