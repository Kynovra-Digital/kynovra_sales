"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { invokeEdgeFunction } from "@/lib/supabase/invoke-edge-function";

export type OrganizationAISettings = Tables<"organization_ai_settings">;

export async function getGlobalAISettings(organizationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_global_ai_settings", {
    p_organization_id: organizationId,
  });

  if (error) throw error;
  return data as OrganizationAISettings | null;
}

export const getAiSettings = getGlobalAISettings;

export async function saveGlobalAISettings(input: {
  fallbackEnabled?: boolean;
  fallbackModelId?: string | null;
  humanAcceptTimeoutSeconds?: number;
  isAutoTakeoverEnabled?: boolean;
  maxOutputTokens?: number;
  modelId: string;
  organizationId: string;
  provider: "openrouter" | "vercel";
  temperature?: number;
  timeoutSeconds?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_global_ai_settings", {
    p_ai_auto_takeover_enabled: input.isAutoTakeoverEnabled ?? true,
    p_fallback_enabled: input.fallbackEnabled ?? false,
    p_fallback_model_id: input.fallbackModelId ?? undefined,
    p_human_accept_timeout_seconds: input.humanAcceptTimeoutSeconds ?? 60,
    p_max_output_tokens: input.maxOutputTokens,
    p_model_id: input.modelId,
    p_organization_id: input.organizationId,
    p_provider: input.provider,
    p_temperature: input.temperature,
    p_timeout_seconds: input.timeoutSeconds,
  });

  if (error) throw error;
  return data;
}

export const saveAiSettings = saveGlobalAISettings;

export async function testGlobalAIConnection(input: {
  modelId?: string;
  organizationId?: string;
  provider?: "openrouter" | "vercel";
}): Promise<{ message: string; ok: boolean }> {
  const { data, error } = await invokeEdgeFunction<{
    message: string;
    ok: boolean;
  }>("test-ai-connection", {
    modelId: input.modelId,
    organizationId: input.organizationId,
    provider: input.provider,
  });

  if (error) {
    return {
      message:
        error.message ??
        "Falha na conexão. Revise o modelo e o secret do AI Gateway.",
      ok: false,
    };
  }

  return data as { message: string; ok: boolean };
}

export const testAiConnection = testGlobalAIConnection;
