import {
  generateSiliconFlowText,
  hasSiliconFlowEnvironment,
} from "./siliconflow.ts";

export type AIProvider = "siliconflow";

type GenerateAITextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  provider: AIProvider;
  temperature?: number | null;
};

export function hasAIProviderEnvironment(provider: AIProvider) {
  if (provider === "siliconflow") return hasSiliconFlowEnvironment();
  return false;
}

export function getAIProviderSetupMessage(provider: AIProvider) {
  if (provider === "siliconflow") {
    return "AI Gateway não configurado. Cadastre o secret FREETOKENFAUCET_API_KEY e redeploye as Edge Functions de IA.";
  }

  return "Provedor de IA não configurado.";
}

export function generateAIText(options: GenerateAITextOptions) {
  return generateSiliconFlowText(options);
}

export function normalizeAIProvider(_value?: string | null): AIProvider {
  return "siliconflow";
}
