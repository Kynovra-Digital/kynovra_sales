"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { invokeEdgeFunction } from "@/lib/supabase/invoke-edge-function";

export type HardnessMasterPrompts = {
  created_at: string | null;
  id: string | null;
  organization_id: string;
  sales_master_prompt: string;
  support_master_prompt: string;
  updated_at: string | null;
  updated_by: string | null;
};

export async function getHardnessMasterPrompts(organizationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_hardness_master_prompts", {
    p_organization_id: organizationId,
  });

  if (error) throw error;
  return normalizeHardnessMasterPrompts(data, organizationId);
}

export async function saveHardnessMasterPrompts(input: {
  organizationId: string;
  salesMasterPrompt: string;
  supportMasterPrompt: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_hardness_master_prompts", {
    p_organization_id: input.organizationId,
    p_sales_master_prompt: input.salesMasterPrompt,
    p_support_master_prompt: input.supportMasterPrompt,
  });

  if (error) throw error;
  return normalizeHardnessMasterPrompts(data, input.organizationId);
}

export async function generateProductAIPrompt(input: {
  mode: "sales" | "support";
  organizationId: string;
  productId: string;
}) {
  const { data, error } = await invokeEdgeFunction<{
    prompt: string;
    success: boolean;
  }>("generate-product-ai-prompts", {
    mode: input.mode,
    organizationId: input.organizationId,
    productId: input.productId,
  });

  if (error) throw error;
  if (!data?.success) {
    throw new Error("Não foi possível gerar o prompt final da IA.");
  }

  return data.prompt;
}

function normalizeHardnessMasterPrompts(
  data: Json,
  organizationId: string,
): HardnessMasterPrompts {
  const record = isRecord(data) ? data : {};

  return {
    created_at: nullableString(record.created_at),
    id: nullableString(record.id),
    organization_id: stringValue(record.organization_id) || organizationId,
    sales_master_prompt: stringValue(record.sales_master_prompt),
    support_master_prompt: stringValue(record.support_master_prompt),
    updated_at: nullableString(record.updated_at),
    updated_by: nullableString(record.updated_by),
  };
}

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nullableString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function stringValue(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}
