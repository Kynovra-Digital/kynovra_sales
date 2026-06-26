import {
  type AIProvider,
  generateAIText,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type TestAIConnectionBody = {
  modelId?: string;
  organizationId?: string;
  provider?: AIProvider;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as TestAIConnectionBody;
    const saved = await resolveSavedSettings(body.organizationId);
    const provider = normalizeAIProvider(body.provider ?? saved?.provider);
    const modelId = body.modelId ?? saved?.model_id;

    if (!hasAIProviderEnvironment(provider)) {
      return jsonResponse({
        message: "Provedor de IA não configurado.",
        ok: false,
      });
    }

    if (!modelId) {
      return jsonResponse({
        message: "Selecione um modelo antes de testar.",
        ok: false,
      });
    }

    const result = await generateAIText({
      maxOutputTokens: 64,
      modelId,
      prompt: "Responda apenas: conexão ativa.",
      provider,
    });

    const output = result.text;

    if (!output.trim()) {
      return jsonResponse({
        message: "Falha na conexão com o modelo selecionado.",
        ok: false,
      });
    }

    return jsonResponse({
      message: "Conexão ativa.",
      ok: true,
    });
  } catch (error) {
    console.error(error);
    const detail = sanitizeErrorMessage(error);
    const normalizedDetail = detail.toLowerCase();
    const isGatewayOperationError = normalizedDetail.includes(
      "operation is not supported",
    );
    const isRateLimitError =
      normalizedDetail.includes("rate-limited") ||
      normalizedDetail.includes("rate limit") ||
      normalizedDetail.includes("ratelimitexceedederror");
    const isBillingSetupError =
      normalizedDetail.includes("valid credit card") ||
      normalizedDetail.includes("unlock your free credits") ||
      normalizedDetail.includes("free tier users do not have access") ||
      normalizedDetail.includes("upgrade to paid credits") ||
      normalizedDetail.includes("restrictedmodelserror");

    return jsonResponse({
      message: resolveSafeConnectionErrorMessage({
        isBillingSetupError,
        isGatewayOperationError,
        isRateLimitError,
        provider,
      }),
      ok: false,
    });
  }
});

function resolveSafeConnectionErrorMessage({
  isBillingSetupError,
  isGatewayOperationError,
  isRateLimitError,
  provider,
}: {
  isBillingSetupError: boolean;
  isGatewayOperationError: boolean;
  isRateLimitError: boolean;
  provider: AIProvider;
}) {
  if (isBillingSetupError) {
    return "O modelo selecionado exige créditos pagos no Vercel AI Gateway. Configure o billing ou selecione um modelo disponível no plano atual.";
  }

  if (isRateLimitError) {
    return "O limite temporário do free tier foi atingido. Aguarde alguns minutos ou adicione créditos pagos para remover essa restrição.";
  }

  if (isGatewayOperationError) {
    return provider === "openrouter"
      ? "O modelo selecionado não aceitou a operação pelo OpenRouter. Verifique a disponibilidade e os limites da chave."
      : "O modelo selecionado não está liberado para a configuração atual do AI Gateway. Verifique o plano, os créditos e o acesso ao modelo no time da Vercel.";
  }

  return "Falha segura no teste de conexão.";
}

function sanitizeErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido na conexão.";

  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/vck_[A-Za-z0-9]+/gi, "[redacted]");
}

async function resolveSavedSettings(organizationId?: string) {
  if (!organizationId) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_ai_settings")
    .select("model_id, provider")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
