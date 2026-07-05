"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  createProductCategory,
  listProductCategories,
  listStorefrontPrimaryCategories,
} from "@/lib/supabase/queries/product-categories";
import { queryKeys } from "@/lib/supabase/query-keys";

export function ProductCategoriesPanel() {
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading, organization, profile } = useAuth();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const [categoryName, setCategoryName] = useState("");
  const [selectedParentSlug, setSelectedParentSlug] = useState("");
  const {
    data: primaryCategories = [],
    isError: isPrimaryCategoriesError,
    isLoading: isPrimaryCategoriesLoading,
  } = useQuery({
    queryFn: listStorefrontPrimaryCategories,
    queryKey: [...queryKeys.productCategories.list, "primary"],
  });
  const {
    data: secondaryCategories = [],
    isError,
    isLoading,
  } = useQuery({
    queryFn: listProductCategories,
    queryKey: queryKeys.productCategories.list,
  });
  const selectedParentCategory = primaryCategories.find(
    (category) => category.slug === selectedParentSlug,
  );

  useEffect(() => {
    if (selectedParentSlug || primaryCategories.length === 0) return;
    setSelectedParentSlug(primaryCategories[0]?.slug ?? "");
  }, [primaryCategories, selectedParentSlug]);

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      createProductCategory({
        name: categoryName.trim(),
        organizationId,
        parentSlug: selectedParentSlug,
      }),
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível criar a categoria secundária.");
    },
    onSuccess: async () => {
      setCategoryName("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productCategories.list,
      });
      toast.success("Categoria secundária criada.");
    },
  });
  const isOrganizationReady = Boolean(organizationId);
  const canCreateCategory =
    !isAuthLoading &&
    isOrganizationReady &&
    !isPrimaryCategoriesError &&
    !isPrimaryCategoriesLoading &&
    selectedParentSlug.length > 0 &&
    categoryName.trim().length > 1 &&
    !createCategoryMutation.isPending;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <StoreCategoryMetric
          description="Categorias criadas na dashboard"
          icon={<Layers3 className="size-4" />}
          title="Secundárias"
          value={String(secondaryCategories.length)}
        />
        <StoreCategoryMetric
          description="Dados reais conectados ao Supabase"
          icon={<Plus className="size-4" />}
          title="Fonte"
          value="Supabase"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle>Categorias secundárias cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CategoryState text="Carregando categorias secundárias..." />
            ) : null}
            {isError ? (
              <CategoryState text="Não foi possível carregar as categorias." />
            ) : null}
            {!isLoading && !isError && secondaryCategories.length === 0 ? (
              <EmptyState
                description="Crie categorias secundárias reais no Supabase e vincule cada uma à categoria principal no formulário."
                title="Nenhuma categoria secundária cadastrada"
              />
            ) : null}
            {!isLoading && !isError && secondaryCategories.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {secondaryCategories.map((category) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    key={category.id}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-sm">
                        {category.name}
                      </h3>
                      <p className="mt-1 font-mono text-muted-foreground text-xs">
                        {category.slug}
                      </p>
                    </div>
                    <Badge
                      className="mt-4 border-blue-400/30 bg-blue-500/10 text-blue-100"
                      variant="outline"
                    >
                      {category.parent_slug}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle>Nova categoria secundária</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canCreateCategory) return;
                createCategoryMutation.mutate();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="parent-category">Categoria principal</Label>
                {isPrimaryCategoriesError ? (
                  <CategoryState text="Não foi possível carregar as categorias principais do Supabase." />
                ) : null}
                <Select
                  disabled={
                    isPrimaryCategoriesLoading || primaryCategories.length === 0
                  }
                  onValueChange={setSelectedParentSlug}
                  value={selectedParentSlug}
                >
                  <SelectTrigger className="w-full" id="parent-category">
                    <SelectValue placeholder="Selecione a principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryCategories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-name">Nome da categoria</Label>
                <Input
                  id="category-name"
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Ex: Celulares"
                  value={categoryName}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Será criada como secundária de{" "}
                <span className="font-semibold text-blue-100">
                  {selectedParentCategory?.name ?? "uma categoria principal"}
                </span>
                .
              </p>
              <Button disabled={!canCreateCategory} type="submit">
                <Plus data-icon="inline-start" />
                Criar categoria secundária
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StoreCategoryMetric({
  description,
  icon,
  title,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-blue-200">
        {icon}
        <span className="font-medium text-xs uppercase tracking-[0.18em]">
          {title}
        </span>
      </div>
      <p className="mt-4 font-bold text-2xl text-white">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

function CategoryState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
