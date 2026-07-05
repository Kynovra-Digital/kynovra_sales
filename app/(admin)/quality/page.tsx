"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Star, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ManualEvaluationDialog } from "@/components/products/manual-evaluation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import {
  listProductQualifications,
  listProducts,
} from "@/lib/supabase/queries/products";
import { queryKeys } from "@/lib/supabase/query-keys";

function formatProductCommentDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export default function QualityPage() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  const { data: qualifications = [], isLoading } = useQuery({
    queryFn: listProductQualifications,
    queryKey: queryKeys.products.qualification,
  });

  const { data: products = [] } = useQuery({
    queryFn: () => listProducts(),
    queryKey: queryKeys.products.list,
  });

  const totalReviews = qualifications.reduce(
    (sum, item) => sum + item.reviewCount,
    0,
  );

  const averageRating =
    qualifications.length > 0
      ? qualifications.reduce(
          (sum, item) => sum + (item.averageRating ?? 0),
          0,
        ) / qualifications.length
      : 0;

  const productsWithReviews = qualifications.filter(
    (item) => item.reviewCount > 0,
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              onClick={() => {
                setSelectedProductId(null);
                setIsEvaluationOpen(true);
              }}
              size="sm"
            >
              <Plus data-icon="inline-start" />
              Inserir Avaliação Manual
            </Button>
            <Button className="gap-2" size="sm" variant="outline">
              <ThumbsUp data-icon="inline-start" />
              Exportar Relatório
            </Button>
          </div>
        }
        breadcrumbs={[{ label: "Admin" }, { label: "Relatórios de Qualidade" }]}
        description="Acompanhe avaliações, notas e pontos de melhoria dos produtos."
        title="Relatórios de Qualidade"
      />

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Média de todas as avaliações"
          glow="blue"
          title="Avaliação Geral"
          value={averageRating.toFixed(1)}
        />
        <MetricCard
          description="Total de avaliações registradas"
          glow="purple"
          title="Total de Avaliações"
          value={totalReviews.toString()}
        />
        <MetricCard
          description="Produtos com pelo menos 1 avaliação"
          glow="green"
          title="Produtos Avaliados"
          value={productsWithReviews.length.toString()}
        />
        <MetricCard
          description="Total de produtos ativos"
          glow="blue"
          title="Produtos Ativos"
          value={products.length.toString()}
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-muted-foreground text-sm">
          Carregando avaliações do Supabase...
        </div>
      ) : qualifications.length === 0 ? (
        <div className="data-panel p-6">
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedProductId(null);
                  setIsEvaluationOpen(true);
                }}
              >
                Inserir Primeira Avaliação
              </Button>
            }
            description="Avaliações manuais e automáticas aparecerão aqui."
            title="Nenhuma avaliação registrada"
          />
        </div>
      ) : (
        <div className="grid min-w-0 gap-4">
          {qualifications.map((qualification) => (
            <motion.article
              key={qualification.product.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-primary/30 hover:bg-white/[0.04]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]">
                      <Star className="size-6 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-white leading-tight">
                        {qualification.product.name}
                      </h3>
                      <p className="mt-1 text-muted-foreground text-sm truncate">
                        {qualification.product.subcategory ?? "Sem categoria"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-amber-200 text-sm">
                            {qualification.averageRating?.toFixed(1) ?? "N/A"}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {qualification.reviewCount}{" "}
                          {qualification.reviewCount === 1
                            ? "avaliação"
                            : "avaliações"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            qualification.product.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {qualification.product.status === "active"
                            ? "Ativo"
                            : qualification.product.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {qualification.comments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        Últimos comentários
                      </p>
                      <div className="space-y-2">
                        {qualification.comments.slice(0, 3).map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                          >
                            <div className="mb-1.5 flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => {
                                  const key = `quality-star-${i}`;
                                  return (
                                    <Star
                                      key={key}
                                      className={`size-3 ${
                                        i < Math.round(comment.rating ?? 0)
                                          ? "fill-amber-400 text-amber-400"
                                          : "fill-white/5 text-white/20"
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {comment.sessionType === "support"
                                  ? "Suporte"
                                  : "Venda"}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                · {formatProductCommentDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-white leading-relaxed">
                              {comment.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setSelectedProductId(qualification.product.id);
                      setIsEvaluationOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="size-3.5" />
                    Avaliar Produto
                  </Button>
                  <Button
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `${window.location.origin}/a/${qualification.product.slug}`,
                      );
                      toast.success("Link de atendimento copiado!");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Copiar Link
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

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

      {!selectedProductId && (
        <ManualEvaluationDialog
          open={isEvaluationOpen}
          onOpenChange={setIsEvaluationOpen}
          productId={products[0]?.id ?? ""}
        />
      )}
    </div>
  );
}
