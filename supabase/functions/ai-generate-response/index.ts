import {
  type AIProvider,
  generateAIText,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type AIRequestBody = {
  modelId?: string;
  organizationId?: string;
  prompt?: string;
  provider?: AIProvider;
  sessionId?: string;
  sessionType?: "sales" | "support";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as AIRequestBody;
    const supabase = createAdminClient();

    if (!body.organizationId || !body.sessionId || !body.prompt) {
      return jsonResponse(
        { message: "Contexto de geração incompleto.", ok: false },
        400,
      );
    }

    const saved = await resolveSavedSettings(body.organizationId);
    const provider = normalizeAIProvider(body.provider ?? saved?.provider);
    const modelId = body.modelId ?? saved?.model_id;
    if (!hasAIProviderEnvironment(provider)) {
      return jsonResponse(
        { message: "Provedor de IA não configurado.", ok: false },
        500,
      );
    }
    if (!modelId) {
      return jsonResponse(
        { message: "Modelo global não configurado.", ok: false },
        400,
      );
    }

    const result = await generateAIText({
      modelId,
      prompt: body.prompt,
      provider,
    });

    const generatedText = result.text;

    const table =
      body.sessionType === "support" ? "support_messages" : "sales_messages";

    const { error } = await supabase.from(table).insert({
      content: generatedText.trim(),
      metadata: {
        gateway: provider === "vercel",
        model: modelId,
        provider,
      },
      organization_id: body.organizationId,
      sender_type: "ai",
      session_id: body.sessionId,
    });

    if (error) throw error;

    return jsonResponse({
      message: generatedText.trim(),
      ok: true,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        message: "Falha ao gerar resposta da IA.",
        ok: false,
      },
      500,
    );
  }
});

async function resolveSavedSettings(organizationId: string) {
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
