import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type GatewayModel = {
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  context_length?: number;
  contextWindow?: number;
  description?: string;
  id: string;
  inputModalities?: string[];
  modelType?: string;
  name?: string;
  object?: string;
  outputModalities?: string[];
  owned_by?: string;
  provider?: string;
  type?: string;
};

const VERCEL_MODEL_IDS = new Set([
  "openai/gpt-oss-20b",
  "arcee-ai/trinity-mini",
  "amazon/nova-micro",
  "meta/llama-3.2-1b",
  "mistral/ministral-3b",
]);

const OPENROUTER_MODEL_IDS = new Set([
  "qwen/qwen3.6-plus",
  "deepseek/deepseek-v4-flash",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openai/gpt-oss-120b:free",
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      provider?: string;
    };
    const isOpenRouter = body.provider === "openrouter";
    const apiKey = Deno.env.get(
      isOpenRouter ? "OPENROUTER_API_KEY" : "AI_GATEWAY_API_KEY",
    );
    if (!apiKey) {
      return jsonResponse(
        { message: "Provedor de IA não configurado.", models: [], ok: false },
        500,
      );
    }

    const response = await fetch(
      isOpenRouter
        ? "https://openrouter.ai/api/v1/models"
        : "https://ai-gateway.vercel.sh/v1/models",
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!response.ok) {
      throw new Error(`AI provider models failed with ${response.status}`);
    }

    const payload = await response.json();
    const models = ((payload.data ?? payload.models ?? []) as GatewayModel[])
      .filter(
        (model) => (model.modelType ?? model.type ?? "language") === "language",
      )
      .filter((model) =>
        (isOpenRouter ? OPENROUTER_MODEL_IDS : VERCEL_MODEL_IDS).has(model.id),
      )
      .map((model) => ({
        contextWindow: model.contextWindow ?? model.context_length,
        description: model.description,
        id: model.id,
        inputModalities:
          model.inputModalities ?? model.architecture?.input_modalities,
        name: model.name ?? model.id,
        outputModalities:
          model.outputModalities ?? model.architecture?.output_modalities,
        provider: model.provider ?? model.owned_by ?? model.id.split("/")[0],
      }));

    return jsonResponse({ models, ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      {
        message: "Não foi possível carregar modelos do provedor de IA.",
        models: [],
        ok: false,
      },
      500,
    );
  }
});
