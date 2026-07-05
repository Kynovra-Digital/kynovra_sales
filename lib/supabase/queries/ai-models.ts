"use client";

import { invokeEdgeFunction } from "@/lib/supabase/invoke-edge-function";

export type AIGatewayModel = {
  contextWindow?: number;
  description?: string;
  id: string;
  inputModalities?: string[];
  name: string;
  outputModalities?: string[];
  provider?: string;
};

export type AIProvider = "siliconflow";

const SILICONFLOW_MODELS: AIGatewayModel[] = [
  {
    id: "deepseek-ai/DeepSeek-V4-Flash",
    name: "DeepSeek V4 Flash",
    provider: "SiliconFlow",
  },
];

export async function listAiGatewayModels(
  provider: AIProvider,
): Promise<AIGatewayModel[]> {
  if (provider === "siliconflow") {
    return SILICONFLOW_MODELS;
  }

  const { data, error } = await invokeEdgeFunction<{
    message?: string;
    models?: AIGatewayModel[];
    ok: boolean;
  }>("ai-gateway-models", { provider });

  if (error) throw error;
  const result = data as {
    message?: string;
    models?: AIGatewayModel[];
    ok: boolean;
  };

  if (!result.ok) {
    throw new Error(result.message ?? "Não foi possível carregar modelos.");
  }

  return result.models ?? [];
}
