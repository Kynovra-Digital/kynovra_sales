type SiliconFlowTextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  temperature?: number | null;
};

type SiliconFlowResponse = {
  choices?: Array<{
    message?: { content?: string; reasoning_content?: string };
  }>;
  error?: { message?: string };
  usage?: { completion_tokens?: number; prompt_tokens?: number };
};

const FREETOKENFAUCET_BASE_URL = "https://freetokenfaucet.com/v1";

function getFreeTokenFaucetApiKey() {
  return (
    Deno.env.get("FREETOKENFAUCET_API_KEY") ??
    Deno.env.get("AI_GATEWAY_API_KEY") ??
    Deno.env.get("SILICONFLOW_API_KEY") ??
    Deno.env.get("SILICON_FLOW_API_KEY")
  );
}

export function hasSiliconFlowEnvironment() {
  return Boolean(getFreeTokenFaucetApiKey());
}

export async function generateSiliconFlowText({
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: SiliconFlowTextOptions) {
  const apiKey = getFreeTokenFaucetApiKey();
  if (!apiKey) throw new Error("AI Gateway não configurado.");

  const response = await fetch(`${FREETOKENFAUCET_BASE_URL}/chat/completions`, {
    body: JSON.stringify({
      max_tokens: maxOutputTokens ?? undefined,
      messages: [{ content: prompt, role: "user" }],
      model: modelId,
      stream: false,
      temperature: temperature ?? undefined,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json().catch(() => ({}))) as SiliconFlowResponse;
  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `AI Gateway respondeu com status ${response.status}.`,
    );
  }

  const message = data.choices?.[0]?.message;
  const text = (message?.content ?? "").trim();
  const reasoning = (message?.reasoning_content ?? "").trim();

  return {
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    reasoning,
    text,
  };
}
