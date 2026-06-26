import {
  ensureAIGatewayEnvironment,
  generateAIGatewayText,
} from "./ai-gateway.ts";
import {
  generateOpenRouterText,
  hasOpenRouterEnvironment,
} from "./openrouter.ts";

export type AIProvider = "openrouter" | "vercel";

type GenerateAITextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  provider: AIProvider;
  temperature?: number | null;
};

export function hasAIProviderEnvironment(provider: AIProvider) {
  return provider === "openrouter"
    ? hasOpenRouterEnvironment()
    : Boolean(ensureAIGatewayEnvironment());
}

export function generateAIText(options: GenerateAITextOptions) {
  return options.provider === "openrouter"
    ? generateOpenRouterText(options)
    : generateAIGatewayText(options);
}

export function normalizeAIProvider(value?: string | null): AIProvider {
  return value === "openrouter" ? "openrouter" : "vercel";
}
