import {
  generateAIText,
  getAIProviderSetupMessage,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type GenerateProductPromptBody = {
  mode?: "sales" | "support";
  organizationId?: string;
  productId?: string;
};

type AISettings = {
  fallback_enabled?: boolean | null;
  fallback_model_id?: string | null;
  max_output_tokens?: number | null;
  model_id: string;
  provider?: string | null;
  temperature?: number | null;
};

const DEFAULT_SALES_MASTER =
  "Crie um prompt operacional para o agente vendedor do Kynovra Sales usando [Produto], [Preço], [Benefícios], [Estoque], [Checkout], [Base de dados], [Tom], [Regras] e [Histórico].";

const DEFAULT_SUPPORT_MASTER =
  "Crie um prompt operacional para o agente de suporte do Kynovra Sales usando [Produto], [Garantia], [Suporte], [Base de dados], [Tom], [Regras] e [Histórico].";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  let stage = "inicialização";

  try {
    stage = "leitura do payload";
    const body = (await request.json()) as GenerateProductPromptBody;
    if (!body.organizationId || !body.productId || !body.mode) {
      return jsonResponse(
        {
          error: "organizationId, productId e mode são obrigatórios.",
          prompt: "",
          success: false,
        },
        400,
      );
    }

    stage = "autenticação";
    const supabase = createAdminClient();
    const user = await resolveUser(request, supabase);
    if (!user) {
      return jsonResponse(
        {
          error: "Autenticação obrigatória.",
          prompt: "",
          success: false,
        },
        401,
      );
    }

    stage = "perfil";
    const profile = await loadProfile(supabase, user.id);
    if (!profile || profile.organization_id !== body.organizationId) {
      return jsonResponse(
        {
          error: "Organização inválida.",
          prompt: "",
          success: false,
        },
        403,
      );
    }

    stage = "permissões";
    const canManage = await canManageProductAI(
      supabase,
      profile.id,
      profile.organization_id,
      profile.role,
    );
    if (!canManage) {
      return jsonResponse(
        {
          error: "Sem permissão para gerar prompt de IA do produto.",
          prompt: "",
          success: false,
        },
        403,
      );
    }

    stage = "carregamento de contexto";
    const [settings, product, hardness] = await Promise.all([
      loadAISettings(supabase, body.organizationId),
      loadProduct(supabase, body.organizationId, body.productId),
      loadHardness(supabase, body.organizationId),
    ]);

    if (!settings?.model_id) {
      return jsonResponse({
        error: "Modelo global de IA não configurado.",
        prompt: "",
        success: false,
      });
    }

    if (!product) {
      return jsonResponse(
        {
          error: "Produto não encontrado.",
          prompt: "",
          success: false,
        },
        404,
      );
    }

    stage = "validação do provider";
    const provider = normalizeAIProvider(settings.provider);
    if (!hasAIProviderEnvironment(provider)) {
      return jsonResponse({
        error: getAIProviderSetupMessage(provider),
        prompt: "",
        success: false,
      });
    }

    stage = "carregamento de bases";
    const knowledge = await loadLinkedKnowledge(
      supabase,
      body.organizationId,
      body.productId,
      body.mode,
    );
    const agent = await loadManagedAgent(
      supabase,
      body.organizationId,
      body.productId,
      body.mode,
    );

    stage = "montagem do prompt";
    const prompt = buildGenerationPrompt({
      agent,
      hardness,
      knowledge,
      mode: body.mode,
      product,
    });

    stage = "geração do prompt final";
    let completion = await generateAIText({
      maxOutputTokens: Math.max(settings.max_output_tokens ?? 1200, 1200),
      modelId: settings.model_id,
      prompt,
      provider,
      temperature: settings.temperature ?? 0.4,
    });

    if (!completion.text && settings.fallback_enabled) {
      completion = await generateAIText({
        maxOutputTokens: Math.max(settings.max_output_tokens ?? 1200, 1200),
        modelId: settings.fallback_model_id ?? settings.model_id,
        prompt,
        provider,
        temperature: settings.temperature ?? 0.4,
      });
    }

    const finalPrompt = sanitizeGeneratedPrompt(
      completion.text || completion.reasoning || "",
    );

    stage = "registro de uso";
    await supabase.from("ai_agent_usage").insert({
      agent_id: agent?.id ?? null,
      cost_estimate: null,
      input_tokens: completion.inputTokens ?? estimateTokens(prompt),
      metadata: {
        mode: body.mode,
        source: "generate-product-ai-prompts",
      },
      model: settings.model_id,
      organization_id: body.organizationId,
      output_tokens: completion.outputTokens ?? estimateTokens(finalPrompt),
      provider,
      session_id: null,
      session_type: null,
      tool: "ai.generate_product_prompt",
    });

    return jsonResponse({
      prompt: finalPrompt,
      success: true,
    });
  } catch (error) {
    console.error("generate-product-ai-prompts failed", { error, stage });
    return jsonResponse(
      {
        error: `Falha segura ao gerar prompt na etapa: ${stage}.`,
        prompt: "",
        success: false,
      },
      500,
    );
  }
});

async function resolveUser(
  request: Request,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user ?? null;
}

async function loadProfile(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function canManageProductAI(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string,
  organizationId: string,
  role: string,
) {
  if (
    ["owner", "founder", "superadmin", "management", "admin"].includes(role)
  ) {
    return true;
  }

  const allowedPermissions = ["*", "products.manage", "ai.settings.manage"];
  const [{ data: direct }, { data: group }] = await Promise.all([
    supabase
      .from("profile_permissions")
      .select("permissions!inner(key)")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId),
    supabase
      .from("group_members")
      .select("group_permissions!inner(permissions!inner(key))")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId),
  ]);

  const directKeys = (direct ?? [])
    .map((item) => {
      const permission = item.permissions as { key?: string } | null;
      return permission?.key;
    })
    .filter(Boolean);
  const groupKeys = (group ?? []).flatMap((item) => {
    const permissions = item.group_permissions as Array<{
      permissions?: { key?: string } | null;
    }> | null;
    return (permissions ?? [])
      .map((permission) => permission.permissions?.key)
      .filter(Boolean);
  });

  return [...directKeys, ...groupKeys].some((key) =>
    allowedPermissions.includes(key ?? ""),
  );
}

async function loadAISettings(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organization_ai_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as AISettings | null;
}

async function loadProduct(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadHardness(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("hardness_master_prompts")
    .select("sales_master_prompt, support_master_prompt")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return {
    sales_master_prompt: data?.sales_master_prompt || DEFAULT_SALES_MASTER,
    support_master_prompt:
      data?.support_master_prompt || DEFAULT_SUPPORT_MASTER,
  };
}

async function loadManagedAgent(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  productId: string,
  mode: "sales" | "support",
) {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("agent_type", mode)
    .eq("is_managed_by_product", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadLinkedKnowledge(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  productId: string,
  mode: "sales" | "support",
) {
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("agent_type", mode)
    .eq("is_managed_by_product", true)
    .maybeSingle();

  const ids = new Set<string>();

  if (agent?.id) {
    const { data: agentLinks, error: agentLinksError } = await supabase
      .from("ai_agent_knowledge_bases")
      .select("knowledge_base_id")
      .eq("organization_id", organizationId)
      .eq("agent_id", agent.id);
    if (agentLinksError) throw agentLinksError;
    for (const link of agentLinks ?? []) ids.add(link.knowledge_base_id);
  }

  const { data: productLinks, error: productLinksError } = await supabase
    .from("product_knowledge_bases")
    .select("knowledge_base_id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId);
  if (productLinksError) throw productLinksError;
  for (const link of productLinks ?? []) ids.add(link.knowledge_base_id);

  if (!ids.size) return [];

  const { data: bases, error: basesError } = await supabase
    .from("knowledge_bases")
    .select("title, category, content_text, storage_bucket, storage_path")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("id", [...ids])
    .limit(16);
  if (basesError) throw basesError;

  return Promise.all(
    (bases ?? []).map(async (base) => {
      if (base.content_text?.trim()) {
        return {
          content: base.content_text,
          title: base.title,
        };
      }

      if (base.storage_bucket && base.storage_path) {
        const { data } = await supabase.storage
          .from(base.storage_bucket)
          .download(base.storage_path);
        return {
          content: data ? await data.text() : "",
          title: base.title,
        };
      }

      return {
        content: "",
        title: base.title,
      };
    }),
  );
}

function buildGenerationPrompt({
  agent,
  hardness,
  knowledge,
  mode,
  product,
}: {
  agent: Record<string, unknown> | null;
  hardness: {
    sales_master_prompt: string;
    support_master_prompt: string;
  };
  knowledge: Array<{ content: string; title: string }>;
  mode: "sales" | "support";
  product: Record<string, unknown>;
}) {
  const master =
    mode === "sales"
      ? hardness.sales_master_prompt
      : hardness.support_master_prompt;
  const knowledgeText = knowledge
    .map((item) => `## ${item.title}\n${item.content}`)
    .join("\n\n");

  return `
Você vai criar um prompt operacional para um agente IA do Kynovra Sales.
Use o Prompt Master como regra principal.
Adapte o prompt ao produto, contexto, preço, garantia, benefícios, checkout, estoque, base de conhecimento e regras informadas.
Não invente dados.
Não inclua provider/modelo/API key.
O resultado deve ser um prompt pronto para ser salvo em ai_agents.prompt.
Responda somente com o prompt final, sem markdown, sem aspas e sem comentários externos.

Tipo do agente: ${mode === "sales" ? "venda" : "suporte"}

Prompt Master:
${master}

Dados do produto:
${JSON.stringify(product, null, 2)}

Configuração atual do agente:
${JSON.stringify(agent ?? {}, null, 2)}

Bases de conhecimento vinculadas:
${knowledgeText || "Nenhuma base textual vinculada."}
`.trim();
}

function sanitizeGeneratedPrompt(value: string) {
  return value
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}
