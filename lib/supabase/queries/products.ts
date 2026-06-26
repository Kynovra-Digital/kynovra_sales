"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/database.types";

export type ProductRow = Tables<"products">;

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
