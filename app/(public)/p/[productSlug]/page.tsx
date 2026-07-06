"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PoweredBy } from "@/components/public/powered-by";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PublicUser, usePublicAuth } from "@/hooks/use-public-auth";
import {
  getPublicProductBySlug,
  getPublicProductReviews,
  type PublicProductReview,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";

export default function ProductPreSalePage() {
  const params = useParams<{ productSlug: string }>();
  const router = useRouter();
  const { isLoading: authLoading, user } = usePublicAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { data: product, isLoading } = useQuery({
    queryFn: () => getPublicProductBySlug(params.productSlug),
    queryKey: queryKeys.products.public(params.productSlug),
  });
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    enabled: Boolean(params.productSlug),
    queryFn: () => getPublicProductReviews(params.productSlug),
    queryKey: queryKeys.products.publicReviews(params.productSlug),
  });
  const productImages = useMemo(
    () =>
      product
        ? Array.from(
            new Set(
              [
                ...(Array.isArray(product.image_urls)
                  ? product.image_urls
                  : []),
                product.image_url,
              ].filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
            ),
          ).slice(0, 5)
        : [],
    [product],
  );

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f5] text-slate-950">
        <p>Carregando produto...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f5f5] text-slate-950">
        <p>Produto não encontrado.</p>
      </main>
    );
  }

  const price =
    typeof product.price === "number"
      ? product.price.toLocaleString("pt-BR", {
          currency: "BRL",
          style: "currency",
        })
      : "Preço no atendimento";
  const oldPrice =
    typeof product.price === "number"
      ? (product.price * 1.72).toLocaleString("pt-BR", {
          currency: "BRL",
          style: "currency",
        })
      : null;
  const description =
    product.main_benefit ??
    product.support_info ??
    "Produto disponível para atendimento com um especialista Kynovra.";
  const productPath = `/p/${product.slug}`;
  const checkoutUrl = product.checkout_url?.trim() || null;
  const averageRating = getAverageRating(reviews);
  const safeSelectedImageIndex = productImages[selectedImageIndex]
    ? selectedImageIndex
    : 0;
  const selectedImage = productImages[safeSelectedImageIndex];
  const thumbnailImages = Array.from({ length: 4 })
    .map((_, slotIndex) => {
      const imageIndex = slotIndex + 1;
      const imageUrl = productImages[imageIndex];

      if (!imageUrl) {
        return null;
      }

      if (safeSelectedImageIndex === imageIndex) {
        return productImages[0]
          ? { imageUrl: productImages[0], index: 0 }
          : null;
      }

      return { imageUrl, index: imageIndex };
    })
    .filter((thumbnail): thumbnail is { imageUrl: string; index: number } =>
      Boolean(thumbnail),
    );

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#191919]">
      <div className="border-orange-200 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link
            className="inline-flex items-center gap-2 font-semibold text-sm text-slate-600 hover:text-orange-600"
            href="/"
          >
            <ArrowLeft className="size-4" />
            Voltar para loja
          </Link>
          <span className="font-black text-orange-600 text-xs uppercase tracking-[0.24em]">
            Kynovra Storefront
          </span>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-6">
        <div className="rounded-sm bg-white p-2 shadow-sm sm:p-3">
          <div className="relative mx-auto aspect-square max-h-[560px] w-full max-w-[560px] overflow-hidden bg-[#f7f7f7]">
            {selectedImage ? (
              <Image
                alt={product.name}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                src={selectedImage}
              />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-orange-100 to-red-100 text-orange-600">
                <ShoppingBag className="size-16" />
              </div>
            )}
          </div>
          <div className="mx-auto mt-2 grid max-w-[560px] grid-cols-4 gap-2">
            {thumbnailImages.length > 0
              ? thumbnailImages.map((thumbnail) => (
                  <button
                    aria-label={`Ver imagem ${thumbnail.index + 1} de ${product.name}`}
                    className="relative aspect-square cursor-pointer overflow-hidden border border-orange-500 bg-[#f7f7f7] transition hover:opacity-90"
                    key={`${product.id}-thumb-${thumbnail.index}`}
                    onClick={() => setSelectedImageIndex(thumbnail.index)}
                    type="button"
                  >
                    <Image
                      alt={`${product.name} miniatura ${thumbnail.index + 1}`}
                      className="object-cover"
                      fill
                      sizes="96px"
                      src={thumbnail.imageUrl}
                    />
                  </button>
                ))
              : null}
          </div>
        </div>

        <div className="rounded-sm bg-white p-4 shadow-sm lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[2px] bg-[#ffe100] px-1.5 py-0.5 font-black text-[10px] text-black uppercase">
              Choice
            </span>
            <span className="text-slate-500 text-xs uppercase tracking-[0.14em]">
              {product.category ?? "Produto Kynovra"}
            </span>
          </div>

          <h1 className="mt-3 font-semibold text-2xl leading-tight lg:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5 text-orange-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  className="size-4 fill-current"
                  key={`rating-${product.id}-${index}`}
                />
              ))}
            </span>
            <span className="font-semibold">
              {averageRating ? averageRating.toFixed(1) : "Novo"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">
              {reviews.length > 0
                ? `${reviews.length} avaliação${reviews.length === 1 ? "" : "ões"}`
                : "Sem avaliações ainda"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-orange-600">Top selling</span>
          </div>

          <div className="mt-5 rounded-sm bg-[#fff5ef] p-4">
            <div className="flex flex-wrap items-end gap-2">
              <span className="font-black text-4xl text-orange-600">
                {price}
              </span>
              {oldPrice ? (
                <span className="pb-1 text-slate-500 text-sm line-through">
                  {oldPrice}
                </span>
              ) : null}
              {oldPrice ? (
                <span className="mb-1 rounded-sm bg-orange-600 px-1.5 py-0.5 font-bold text-white text-xs">
                  -42%
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-medium text-orange-700 text-sm">
              Bundle deals disponíveis no atendimento
            </p>
          </div>

          <div className="mt-5 grid gap-3 text-sm">
            <InfoRow
              icon={<Truck className="size-4" />}
              label="Entrega"
              text="Condições, prazo e disponibilidade confirmados no atendimento."
            />
            <InfoRow
              icon={<ShieldCheck className="size-4" />}
              label="Compra assistida"
              text="Um especialista orienta sua compra em uma sala segura."
            />
            <InfoRow
              icon={<PackageCheck className="size-4" />}
              label="Produto ativo"
              text="Disponível para campanhas e atendimento comercial."
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              className="h-12 rounded-none bg-orange-600 font-black text-white uppercase tracking-[0.12em] hover:bg-orange-500"
              disabled={authLoading}
              onClick={() =>
                requireAuthOrRun(productPath, user, router, () => {
                  router.push(`/a/${product.slug}`);
                })
              }
              type="button"
            >
              <MessageCircle className="size-4" />
              Falar com atendente
            </Button>
            <Button
              className="h-12 flex-1 rounded-none bg-orange-600 font-black text-white uppercase tracking-[0.12em] hover:bg-orange-500"
              disabled={authLoading || !checkoutUrl}
              onClick={() =>
                requireAuthOrRun(productPath, user, router, () => {
                  if (checkoutUrl) {
                    window.location.assign(checkoutUrl);
                  }
                })
              }
              type="button"
            >
              <ExternalLink className="size-4" />
              Comprar agora
            </Button>
          </div>
          {!checkoutUrl ? (
            <p className="mt-2 text-slate-500 text-xs">
              Checkout direto indisponível. Fale com atendente para continuar.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-sm bg-white p-5 shadow-sm">
            <Tabs className="h-auto min-h-0 gap-5" defaultValue="details">
              <TabsList
                className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-slate-200 border-b bg-transparent p-0"
                variant="line"
              >
                <TabsTrigger
                  className="h-10 flex-none rounded-none px-0 font-black text-slate-500 uppercase tracking-tight data-active:text-orange-600"
                  value="details"
                >
                  Tudo sobre o produto
                </TabsTrigger>
                <TabsTrigger
                  className="h-10 flex-none rounded-none px-0 font-black text-slate-500 uppercase tracking-tight data-active:text-orange-600"
                  value="reviews"
                >
                  Avaliações e comentários
                </TabsTrigger>
              </TabsList>

              <TabsContent className="h-auto min-h-0" value="details">
                <p className="text-slate-700 leading-relaxed">{description}</p>
                {product.support_info ? (
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    {product.support_info}
                  </p>
                ) : null}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    "Atendimento humano ou IA",
                    "Link público seguro",
                    "Orientação antes da compra",
                  ].map((item) => (
                    <div
                      className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-sm"
                      key={item}
                    >
                      <CheckCircle2 className="mb-2 size-4 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent className="h-auto min-h-0" value="reviews">
                <ProductReviews
                  averageRating={averageRating}
                  isLoading={isLoadingReviews}
                  reviews={reviews}
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="rounded-sm bg-white p-5 shadow-sm">
            <h2 className="font-black text-sm uppercase tracking-[0.16em]">
              Loja segura
            </h2>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Clique em comprar para abrir o atendimento canônico do produto e
              continuar com especialista.
            </p>
            <Button
              className="mt-5 w-full rounded-none bg-black"
              disabled={authLoading}
              onClick={() =>
                requireAuthOrRun(productPath, user, router, () => {
                  router.push(`/a/${product.slug}`);
                })
              }
              type="button"
            >
              Abrir atendimento
            </Button>
          </aside>
        </div>
      </section>

      <PoweredBy />
    </main>
  );
}

function requireAuthOrRun(
  currentPath: string,
  user: PublicUser | null,
  router: { push: (href: string) => void },
  action: () => void,
) {
  if (!user) {
    router.push(`/login?next=${encodeURIComponent(currentPath)}`);
    return;
  }

  action();
}

function ProductReviews({
  averageRating,
  isLoading,
  reviews,
}: {
  averageRating: number | null;
  isLoading: boolean;
  reviews: PublicProductReview[];
}) {
  if (isLoading) {
    return <p className="text-slate-500 text-sm">Carregando avaliações...</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50 p-5">
        <h3 className="font-black text-base">Ainda não há avaliações.</h3>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
          Os comentários aparecerão aqui depois que clientes encerrarem o
          atendimento e enviarem uma avaliação do produto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-sm border border-orange-100 bg-orange-50 p-4">
        <div>
          <p className="font-black text-3xl text-orange-600">
            {averageRating ? averageRating.toFixed(1) : "-"}
          </p>
          <div className="mt-1 flex text-orange-500">
            <RatingStars rating={averageRating ?? 0} />
          </div>
        </div>
        <p className="pb-1 text-slate-600 text-sm">
          Baseado em {reviews.length} avaliação
          {reviews.length === 1 ? "" : "ões"} real
          {reviews.length === 1 ? "" : "is"} de atendimento.
        </p>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <article
            className="rounded-sm border border-slate-200 bg-white p-4"
            key={review.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex text-orange-500">
                  <RatingStars rating={review.rating ?? 0} />
                </div>
                <p className="mt-1 text-slate-500 text-xs">
                  Cliente verificado · {formatReviewDate(review.created_at)}
                </p>
              </div>
              <span className="rounded-sm bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 text-xs">
                Compra assistida
              </span>
            </div>
            {review.comment ? (
              <p className="mt-3 text-slate-700 text-sm leading-relaxed">
                “{review.comment}”
              </p>
            ) : (
              <p className="mt-3 text-slate-500 text-sm italic">
                Cliente avaliou sem comentário textual.
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return [1, 2, 3, 4, 5].map((star) => (
    <Star
      className={`size-4 ${star <= Math.round(rating) ? "fill-current" : "fill-transparent"}`}
      key={`rating-star-${star}`}
    />
  ));
}

function getAverageRating(reviews: PublicProductReview[]) {
  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === "number");

  if (ratings.length === 0) {
    return null;
  }

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function InfoRow({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-sm border border-slate-100 bg-white p-3">
      <div className="mt-0.5 text-orange-600">{icon}</div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-0.5 text-slate-500 text-xs leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
