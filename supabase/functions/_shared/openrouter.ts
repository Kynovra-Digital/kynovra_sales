type OpenRouterTextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  temperature?: number | null;
};

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  usage?: { completion_tokens?: number; prompt_tokens?: number };
};

export function hasOpenRouterEnvironment() {
  return Boolean(Deno.env.get("OPENROUTER_API_KEY"));
}

export async function generateOpenRouterText({
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: OpenRouterTextOptions) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OpenRouter não configurado.");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      body: JSON.stringify({
        max_completion_tokens: maxOutputTokens ?? undefined,
        messages: [{ content: prompt, role: "user" }],
        model: modelId,
        stream: false,
        temperature: temperature ?? undefined,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("APP_URL") ?? "https://kynovra.com",
        "X-Title": "Kynovra Sales",
      },
      method: "POST",
    },
  );

  const data = (await response.json().catch(() => ({}))) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `OpenRouter respondeu com status ${response.status}.`,
    );
  }

  return {
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    text: data.choices?.[0]?.message?.content?.trim() ?? "",
  };
}
