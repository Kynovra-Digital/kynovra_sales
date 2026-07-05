type SiliconFlowTextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  temperature?: number | null;
};

type SiliconFlowResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  usage?: { completion_tokens?: number; prompt_tokens?: number };
};

const SILICONFLOW_BASE_URL = "https://api.siliconflow.com/v1";

function getSiliconFlowApiKey() {
  return (
    Deno.env.get("SILICONFLOW_API_KEY") ?? Deno.env.get("SILICON_FLOW_API_KEY")
  );
}

export function hasSiliconFlowEnvironment() {
  return Boolean(getSiliconFlowApiKey());
}

export async function generateSiliconFlowText({
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: SiliconFlowTextOptions) {
  const apiKey = getSiliconFlowApiKey();
  if (!apiKey) throw new Error("SiliconFlow não configurado.");

  const response = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
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
        `SiliconFlow respondeu com status ${response.status}.`,
    );
  }

  return {
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    text: data.choices?.[0]?.message?.content?.trim() ?? "",
  };
}
