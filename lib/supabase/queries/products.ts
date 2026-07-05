"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/database.types";

export type ProductRow = Tables<"products">;

type ProductQualificationEvaluation = Pick<
  Tables<"evaluations">,
  | "comment"
  | "created_at"
  | "id"
  | "rating"
  | "ratings"
  | "session_id"
  | "session_type"
>;

type ProductQualificationSession = {
  id: string;
  product_id: string | null;
};

export type ProductQualificationComment = {
  comment: string | null;
  createdAt: string;
  id: string;
  rating: number | null;
  sessionType: string;
};

export type ProductQualificationRow = {
  averageRating: number | null;
  comments: ProductQualificationComment[];
  product: Pick<
    ProductRow,
    "id" | "image_url" | "name" | "slug" | "status" | "subcategory"
  >;
  reviewCount: number;
};

export async function listProducts(options?: { includeArchived?: boolean }) {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function listProductQualifications() {
  const supabase = createClient();
  const [
    productsResult,
    evaluationsResult,
    salesSessionsResult,
    supportSessionsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, image_url, name, slug, status, subcategory")
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("evaluations")
      .select(
        "id, session_id, session_type, rating, ratings, comment, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("sales_sessions").select("id, product_id"),
    supabase.from("support_sessions").select("id, product_id"),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (evaluationsResult.error) throw evaluationsResult.error;
  if (salesSessionsResult.error) throw salesSessionsResult.error;
  if (supportSessionsResult.error) throw supportSessionsResult.error;

  const products = productsResult.data ?? [];
  const productIds = new Set(products.map((product) => product.id));
  const sessionProductByKey = new Map<string, string>();

  for (const session of (salesSessionsResult.data ??
    []) as ProductQualificationSession[]) {
    if (session.product_id) {
      sessionProductByKey.set(`sales:${session.id}`, session.product_id);
    }
  }

  for (const session of (supportSessionsResult.data ??
    []) as ProductQualificationSession[]) {
    if (session.product_id) {
      sessionProductByKey.set(`support:${session.id}`, session.product_id);
    }
  }

  const evaluationsByProduct = new Map<
    string,
    ProductQualificationEvaluation[]
  >();

  for (const evaluation of (evaluationsResult.data ??
    []) as ProductQualificationEvaluation[]) {
    const productId = sessionProductByKey.get(
      `${evaluation.session_type}:${evaluation.session_id}`,
    );

    if (!productId || !productIds.has(productId)) continue;

    const currentEvaluations = evaluationsByProduct.get(productId) ?? [];
    currentEvaluations.push(evaluation);
    evaluationsByProduct.set(productId, currentEvaluations);
  }

  return products
    .map<ProductQualificationRow>((product) => {
      const evaluations = evaluationsByProduct.get(product.id) ?? [];
      const ratings = evaluations
        .map((evaluation) => evaluation.rating)
        .filter((rating): rating is number => typeof rating === "number");
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((total, rating) => total + rating, 0) /
            ratings.length
          : null;

      return {
        averageRating,
        comments: evaluations
          .filter((evaluation) => evaluation.comment?.trim())
          .slice(0, 3)
          .map((evaluation) => ({
            comment: evaluation.comment,
            createdAt: evaluation.created_at,
            id: evaluation.id,
            rating: evaluation.rating,
            sessionType: evaluation.session_type,
          })),
        product,
        reviewCount: evaluations.length,
      };
    })
    .filter((item) => item.reviewCount > 0)
    .sort((first, second) => second.reviewCount - first.reviewCount);
}

export async function getProductAIConfiguration(productId: string) {
  const supabase = createClient();
  const [productResult, agentsResult, knowledgeResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).single(),
    supabase
      .from("ai_agents")
      .select("*")
      .eq("product_id", productId)
      .eq("is_managed_by_product", true),
    supabase
      .from("product_knowledge_bases")
      .select("knowledge_base_id")
      .eq("product_id", productId)
      .order("created_at", { ascending: true }),
  ]);

  if (productResult.error) throw productResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (knowledgeResult.error) throw knowledgeResult.error;

  const agentIds = (agentsResult.data ?? []).map((agent) => agent.id);
  const agentKnowledgeResult = agentIds.length
    ? await supabase
        .from("ai_agent_knowledge_bases")
        .select("agent_id, knowledge_base_id")
        .in("agent_id", agentIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (agentKnowledgeResult.error) throw agentKnowledgeResult.error;

  const salesAgent = (agentsResult.data ?? []).find(
    (agent) => agent.agent_type === "sales",
  );
  const supportAgent = (agentsResult.data ?? []).find(
    (agent) => agent.agent_type === "support",
  );

  const agentKnowledgeRows = agentKnowledgeResult.data ?? [];
  const salesKnowledgeBaseIds = salesAgent
    ? agentKnowledgeRows
        .filter((item) => item.agent_id === salesAgent.id)
        .map((item) => item.knowledge_base_id)
    : [];
  const supportKnowledgeBaseIds = supportAgent
    ? agentKnowledgeRows
        .filter((item) => item.agent_id === supportAgent.id)
        .map((item) => item.knowledge_base_id)
    : [];

  return {
    agents: agentsResult.data ?? [],
    knowledgeBaseIds: (knowledgeResult.data ?? []).map(
      (item) => item.knowledge_base_id,
    ),
    product: productResult.data,
    salesKnowledgeBaseIds,
    supportKnowledgeBaseIds,
  };
}

export async function createProduct(
  product: Omit<ProductRow, "created_at" | "id" | "updated_at">,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  product: Partial<Omit<ProductRow, "created_at" | "id" | "updated_at">>,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function archiveProduct(id: string) {
  return updateProduct(id, { status: "archived" });
}

export async function saveProductAIConfiguration(input: {
  knowledgeBaseIds?: string[];
  organizationId: string;
  productId: string;
  sales: Json;
  support: Json;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_product_ai_configuration", {
    p_knowledge_base_ids: input.knowledgeBaseIds ?? [],
    p_organization_id: input.organizationId,
    p_product_id: input.productId,
    p_sales: input.sales,
    p_support: input.support,
  });

  if (error) throw error;
  return data;
}

export async function generateUniqueProductSlug(input: {
  excludeProductId?: string | null;
  name: string;
  organizationId: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_unique_product_slug", {
    p_exclude_product_id: input.excludeProductId ?? undefined,
    p_name: input.name,
    p_organization_id: input.organizationId,
  });
  if (error) throw error;
  return data;
}

export async function generateUniqueProductCode(input: {
  excludeProductId?: string | null;
  organizationId: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_unique_product_code", {
    p_exclude_product_id: input.excludeProductId ?? undefined,
    p_organization_id: input.organizationId,
  });
  if (error) throw error;
  return data;
}

export async function insertManualProductEvaluation(input: {
  productId: string;
  rating: number;
  comment?: string | null;
  ratings?: Json | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "insert_manual_product_evaluation",
    {
      p_product_id: input.productId,
      p_rating: input.rating,
      p_comment: input.comment ?? null,
      p_ratings: input.ratings ?? null,
    },
  );

  if (error) throw error;
  return data;
}
