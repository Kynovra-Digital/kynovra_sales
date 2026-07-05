"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageCheck, Plus, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ManualEvaluationDialog } from "@/components/products/manual-evaluation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listProductQualifications,
  type ProductQualificationRow,
} from "@/lib/supabase/queries/products";
import { queryKeys } from "@/lib/supabase/query-keys";

const loadingSkeletonKeys = [
  "product-qualification-loading-1",
  "product-qualification-loading-2",
  "product-qualification-loading-3",
  "product-qualification-loading-4",
];

export function ProductQualificationPanel() {
  const {
    data = [],
    isError,
    isLoading,
  } = useQuery({
    queryFn: listProductQualifications,
    queryKey: queryKeys.products.qualification,
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {loadingSkeletonKeys.map((key) => (
          <div
            className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
            key={key}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        description="Não foi possível carregar as avaliações dos produtos agora."
        title="Erro ao carregar qualificações"
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        description="Os produtos aparecerão aqui quando clientes avaliarem atendimentos vinculados a eles."
        title="Nenhum produto qualificado ainda"
      />
    );
  }

  const totalReviews = data.reduce(
    (total, item) => total + item.reviewCount,
    0,
  );
  const averageRating = getGlobalAverageRating(data);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Produtos qualificados" value={data.length} />
        <MetricTile label="Avaliações recebidas" value={totalReviews} />
        <MetricTile
          label="Média geral"
          value={averageRating ? averageRating.toFixed(1) : "-"}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {data.map((item) => (
          <ProductQualificationCard
            item={item}
            key={item.product.id}
            onEvaluate={() => {
              setSelectedProductId(item.product.id);
              setIsEvaluationOpen(true);
            }}
          />
        ))}
      </section>

      {selectedProductId && (
        <ManualEvaluationDialog
          open={isEvaluationOpen}
          onOpenChange={(open) => {
            setIsEvaluationOpen(open);
            if (!open) setSelectedProductId(null);
          }}
          productId={selectedProductId}
        />
      )}
    </div>
  );
}

function ProductQualificationCard({
  item,
  onEvaluate,
}: {
  item: ProductQualificationRow;
  onEvaluate: () => void;
}) {
  return (
    <Card className="min-w-0 border-white/10 bg-white/[0.035]">
      <CardContent className="flex min-w-0 flex-col gap-4 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            {item.product.image_url ? (
              <Image
                alt=""
                className="size-full object-cover"
                height={56}
                unoptimized
                src={item.product.image_url}
                width={56}
              />
            ) : (
              <PackageCheck className="size-5 text-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-base text-white">
                {item.product.name}
              </h3>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                {item.product.status}
              </Badge>
            </div>
            <p className="truncate text-muted-foreground text-sm">
              /a/{item.product.slug}
            </p>
          </div>

          <Button
            className="gap-2 shrink-0"
            onClick={onEvaluate}
            size="sm"
            variant="outline"
          >
            <Plus className="size-3.5" />
            Avaliar
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <ProductStat
            label="Nota média"
            value={item.averageRating ? item.averageRating.toFixed(1) : "-"}
          />
          <ProductStat label="Avaliações" value={item.reviewCount} />
          <ProductStat label="Comentários" value={item.comments.length} />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          {item.comments.length ? (
            item.comments.map((comment) => (
              <div
                className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3"
                key={comment.id}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">
                    {comment.sessionType === "support" ? "Suporte" : "Venda"}
                  </Badge>
                  <span className="flex items-center gap-1 text-primary">
                    <Star className="size-3 fill-current" />
                    {comment.rating ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm text-white/85">
                  {comment.comment}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-muted-foreground text-sm">
              Produto avaliado sem comentário textual.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-semibold text-2xl text-white">{value}</p>
    </div>
  );
}

function ProductStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function getGlobalAverageRating(items: ProductQualificationRow[]) {
  const ratings = items
    .map((item) => item.averageRating)
    .filter((rating): rating is number => typeof rating === "number");

  if (ratings.length === 0) return null;

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
