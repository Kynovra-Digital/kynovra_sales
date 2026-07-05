import { jsonResponse, optionsResponse } from "../_shared/cors.ts";

const SILICONFLOW_MODELS = [
  {
    id: "deepseek-ai/DeepSeek-V4-Flash",
    name: "DeepSeek V4 Flash",
    provider: "SiliconFlow",
  },
];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  try {
    const _body = (await request.json().catch(() => ({}))) as {
      provider?: string;
    };

    return jsonResponse({ models: SILICONFLOW_MODELS, ok: true });
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
