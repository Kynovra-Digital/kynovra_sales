"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type ProductCategoryRow = Tables<"product_categories">;
export type StorefrontPrimaryCategoryRow = {
  name: string;
  slug: string;
};

export type ProductSecondaryCategoryRow = ProductCategoryRow & {
  parent_slug: string;
};

export async function listStorefrontPrimaryCategories() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("storefront_primary_categories");

  if (error) throw error;
  return (data ?? []) as StorefrontPrimaryCategoryRow[];
}

export async function listProductCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("parent_slug", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductSecondaryCategoryRow[];
}

export async function createProductCategory(input: {
  name: string;
  organizationId: string;
  parentSlug: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .insert({
      name: input.name,
      organization_id: input.organizationId,
      parent_slug: input.parentSlug,
      slug: slugify(input.name),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
