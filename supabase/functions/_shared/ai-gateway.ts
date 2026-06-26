type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type GatewayTextOptions = {
  maxOutputTokens?: number | null;
  modelId: string;
  prompt: string;
  temperature?: number | null;
};

type GatewayChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

type GatewayResponsesResponse = {
  error?: {
    message?: string;
  };
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

export function ensureAIGatewayEnvironment() {
  const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");

  if (!apiKey) {
    return null;
  }

  const runtime = globalThis as GlobalWithProcess;
  runtime.process ??= { env: {} };
  runtime.process.env ??= {};
  runtime.process.env.AI_GATEWAY_API_KEY = apiKey;

  return apiKey;
}

export async function generateAIGatewayText({
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: GatewayTextOptions) {
  const apiKey = ensureAIGatewayEnvironment();

  if (!apiKey) {
    throw new Error("AI Gateway não configurado.");
  }

  const chatResult = await generateWithChatCompletions({
    apiKey,
    maxOutputTokens,
    modelId,
    prompt,
    temperature,
  });

  if (chatResult.ok || !isOperationUnsupported(chatResult.error)) {
    if (!chatResult.ok) {
      throw new Error(chatResult.error);
    }

    return chatResult.value;
  }

  const responsesResult = await generateWithResponses({
    apiKey,
    maxOutputTokens,
    modelId,
    prompt,
    temperature,
  });

  if (!responsesResult.ok) {
    throw new Error(responsesResult.error);
  }

  return responsesResult.value;
}

type GatewayRequestOptions = GatewayTextOptions & {
  apiKey: string;
};

type GatewayGenerationResult = {
  inputTokens?: number;
  outputTokens?: number;
  text: string;
};

type Result<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      error: string;
      ok: false;
    };

async function generateWithChatCompletions({
  apiKey,
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: GatewayRequestOptions): Promise<Result<GatewayGenerationResult>> {
  const response = await fetch(
    "https://ai-gateway.vercel.sh/v1/chat/completions",
    {
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
    },
  );

  const data = (await response.json().catch(() => ({}))) as GatewayChatResponse;

  if (!response.ok) {
    return {
      error:
        data.error?.message ??
        `AI Gateway respondeu com status ${response.status}.`,
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      text: data.choices?.[0]?.message?.content?.trim() ?? "",
    },
  };
}

async function generateWithResponses({
  apiKey,
  maxOutputTokens,
  modelId,
  prompt,
  temperature,
}: GatewayRequestOptions): Promise<Result<GatewayGenerationResult>> {
  const response = await fetch("https://ai-gateway.vercel.sh/v1/responses", {
    body: JSON.stringify({
      input: prompt,
      max_output_tokens: maxOutputTokens ?? undefined,
      model: modelId,
      temperature: temperature ?? undefined,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response
    .json()
    .catch(() => ({}))) as GatewayResponsesResponse;

  if (!response.ok) {
    return {
      error:
        data.error?.message ??
        `AI Gateway respondeu com status ${response.status}.`,
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      text: extractResponsesText(data),
    },
  };
}

function extractResponsesText(data: GatewayResponsesResponse) {
  if (data.output_text?.trim()) {
    return data.output_text.trim();
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function isOperationUnsupported(message?: string) {
  return message?.toLowerCase().includes("operation is not supported") ?? false;
}
