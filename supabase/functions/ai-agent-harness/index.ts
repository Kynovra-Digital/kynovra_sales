import {
  generateAIText,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type SessionType = "sales" | "support";
type HarnessMode = "analysis" | "auto" | "copilot";

type HarnessBody = {
  agentId?: string;
  input?: string;
  metadata?: Record<string, unknown>;
  mode?: HarnessMode;
  organizationId?: string;
  selectedText?: string;
  sessionId?: string;
  sessionType?: SessionType;
  tone?: string;
  tool?: string;
};

type AISettings = {
  fallback_enabled?: boolean | null;
  fallback_model_id?: string | null;
  max_output_tokens?: number | null;
  model_id: string;
  provider?: string | null;
  temperature?: number | null;
  timeout_seconds?: number | null;
};

const BASE_PROMPT = `
Você é o AI Agent Harness do Kynovra Sales.
Você não é um agente final; você executa ferramentas para agentes.
Use apenas dados reais recebidos no contexto.
Não invente informações.
Se faltar dado, retorne que precisa de confirmação.
Responda curto, útil e operacional.
Use raciocínio de baixa latência: decida com o contexto disponível, não exponha cadeia de pensamento e entregue somente a resposta final acionável.
Priorize instruções explícitas, dados estruturados e trechos relevantes das bases vinculadas.
Em venda, ajude a converter com ética.
Em suporte, ajude a resolver com clareza.
Não execute ação crítica sozinho.
Não confirme venda.
Não envie checkout sem ação humana.
Não encerre atendimento sem ação humana.
Sempre respeite permissões e limites.
`.trim();

const TOOL_CATEGORIES = new Map<string, string>([
  ["sales.suggest_reply", "sales"],
  ["sales.detect_objection", "sales"],
  ["sales.break_objection", "sales"],
  ["sales.classify_lead_temperature", "sales"],
  ["sales.summarize_session", "sales"],
  ["sales.generate_checkout_message", "sales"],
  ["sales.suggest_next_action", "sales"],
  ["sales.explain_product_benefits", "sales"],
  ["sales.compare_need_with_product", "sales"],
  ["sales.generate_transfer_note", "sales"],
  ["sales.generate_followup_message", "sales"],
  ["support.suggest_reply", "support"],
  ["support.identify_reason", "support"],
  ["support.suggest_resolution", "support"],
  ["support.summarize_session", "support"],
  ["support.generate_continuity_note", "support"],
  ["support.generate_escalation_note", "support"],
  ["support.detect_frustration", "support"],
  ["support.suggest_handoff", "support"],
  ["support.explain_steps", "support"],
  ["support.generate_closing_message", "support"],
  ["chat.rewrite_message", "chat"],
  ["chat.shorten_message", "chat"],
  ["chat.make_more_human", "chat"],
  ["chat.make_more_professional", "chat"],
  ["chat.make_more_persuasive", "chat"],
  ["chat.extract_customer_data", "chat"],
  ["chat.detect_intent", "chat"],
  ["chat.detect_risk", "chat"],
  ["chat.summarize_recent_messages", "chat"],
  ["product.get_context", "product"],
  ["product.get_benefits", "product"],
  ["product.get_price_info", "product"],
  ["product.get_stock_status", "product"],
  ["product.get_checkout_info", "product"],
  ["product.search_knowledge_base", "product"],
  ["product.generate_public_answer", "product"],
  ["ops.generate_internal_note", "ops"],
  ["ops.generate_audit_summary", "ops"],
  ["ops.suggest_ticket_priority", "ops"],
  ["ops.detect_duplicate_ticket", "ops"],
  ["ops.prepare_transfer_context", "ops"],
  ["ops.prepare_human_handoff", "ops"],
  ["ai.test_global_model", "ai"],
  ["ai.estimate_usage", "ai"],
  ["ai.check_agent_limits", "ai"],
  ["ai.register_bad_response", "ai"],
  ["ai.generate_prompt_preview", "ai"],
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let stage = "inicialização";
  let requestedTool = "unknown";

  try {
    stage = "leitura do payload";
    const body = (await request.json()) as HarnessBody;
    requestedTool = body.tool ?? "unknown";
    if (!body.tool) {
      return harnessResponse({
        error: "Ferramenta do Harness é obrigatória.",
        output: "",
        success: false,
        tool: body.tool ?? "unknown",
      });
    }

    stage = "validação da ferramenta";
    if (!TOOL_CATEGORIES.has(body.tool)) {
      return harnessResponse({
        error: "Ferramenta do Harness inválida.",
        output: "",
        success: false,
        tool: body.tool,
      });
    }

    stage = "autenticação";
    const supabase = createAdminClient();
    const user = await resolveUser(request, supabase);
    if (!user && body.mode !== "auto") {
      return harnessResponse({
        error: "Autenticação obrigatória para usar o Harness.",
        output: "",
        success: false,
        tool: body.tool,
      });
    }

    stage = "perfil e permissões";
    const profile = user ? await loadProfile(supabase, user.id) : null;
    if (user && !profile) {
      return harnessResponse({
        error: "Perfil do usuário não encontrado.",
        output: "",
        success: false,
        tool: body.tool,
      });
    }

    const organizationId = profile?.organization_id ?? body.organizationId;
    if (!organizationId) {
      return harnessResponse({
        error: "Organização obrigatória para usar o Harness.",
        output: "",
        success: false,
        tool: body.tool,
      });
    }

    const scopedBody = {
      ...body,
      organizationId,
      tool: body.tool,
    };

    if (body.tool === "ai.register_bad_response") {
      stage = "registro de resposta ruim";
      const result = await registerBadResponse(
        supabase,
        scopedBody,
        user?.id ?? null,
      );
      return harnessResponse(result);
    }

    stage = "carregamento do contexto";
    const context = await loadContext(supabase, scopedBody);
    if (!context.settings?.model_id) {
      return harnessResponse({
        error: "Modelo global do AI Gateway não configurado.",
        output: "",
        success: false,
        tool: scopedBody.tool,
      });
    }

    stage = "validação das ferramentas permitidas";
    const enabledTools = normalizeEnabledTools(context.agent?.enabled_tools);
    if (enabledTools.length && !enabledTools.includes(scopedBody.tool)) {
      return harnessResponse({
        error: "Ferramenta não permitida para a IA deste produto.",
        output: "",
        success: false,
        tool: scopedBody.tool,
      });
    }

    stage = "validação do provider de IA";
    const provider = normalizeAIProvider(context.settings.provider);
    if (!hasAIProviderEnvironment(provider)) {
      return harnessResponse({
        error: "Provedor de IA não configurado no Supabase Secrets.",
        output: "",
        success: false,
        tool: scopedBody.tool,
      });
    }

    if (scopedBody.tool === "ai.estimate_usage") {
      stage = "estimativa de uso";
      const text = `${scopedBody.input ?? ""}\n${scopedBody.selectedText ?? ""}`;
      return harnessResponse({
        output: "Estimativa calculada localmente pelo Harness.",
        structured: { estimatedInputTokens: estimateTokens(text) },
        success: true,
        tool: scopedBody.tool,
      });
    }

    if (scopedBody.tool === "ai.check_agent_limits") {
      stage = "checagem de limites";
      return harnessResponse({
        output:
          "Limites carregados. A aplicação deve aplicar a menor restrição entre agente e configuração global.",
        structured: {
          agent: context.agent ?? null,
          globalMaxOutputTokens: context.settings.max_output_tokens ?? null,
        },
        success: true,
        tool: scopedBody.tool,
      });
    }

    if (scopedBody.tool === "ai.generate_prompt_preview") {
      stage = "preview do prompt";
      return harnessResponse({
        output: buildPrompt(scopedBody, context),
        success: true,
        tool: scopedBody.tool,
      });
    }

    stage = "ferramentas locais de produto";
    if (isProductReadTool(scopedBody.tool)) {
      const productOutput = productReadOutput(scopedBody.tool, context);
      if (productOutput) return harnessResponse(productOutput);
    }

    stage = "montagem do prompt";
    const prompt = buildPrompt(scopedBody, context);
    let completion: CompletionResult;

    try {
      stage = "geração de resposta pela IA";
      completion = await callGatewayModel(context.settings, prompt);

      if (!completion.text && context.settings.fallback_enabled) {
        completion = await callGatewayModel(
          {
            ...context.settings,
            model_id:
              context.settings.fallback_model_id ?? context.settings.model_id,
          },
          prompt,
        );
      }
    } catch (error) {
      console.error("ai-agent-harness generation failed", error);
      return harnessResponse({
        error: safeAIErrorMessage(error),
        output: "",
        success: false,
        tool: scopedBody.tool,
      });
    }

    stage = "registro de uso da IA";
    const inputTokens = completion.inputTokens ?? estimateTokens(prompt);
    const outputTokens =
      completion.outputTokens ?? estimateTokens(completion.text);

    await supabase.from("ai_agent_usage").insert({
      agent_id: context.agent?.id ?? null,
      cost_estimate: null,
      input_tokens: inputTokens,
      metadata: {
        gateway: provider === "vercel",
        mode: scopedBody.mode ?? "copilot",
        tone: scopedBody.tone ?? null,
      },
      model: completion.model,
      organization_id: scopedBody.organizationId,
      output_tokens: outputTokens,
      provider,
      session_id: scopedBody.sessionId ?? null,
      session_type: scopedBody.sessionType ?? null,
      tool: scopedBody.tool,
    });

    return harnessResponse({
      output: completion.text,
      success: true,
      tool: scopedBody.tool,
      usage: {
        inputTokens,
        model: completion.model,
        outputTokens,
        provider,
      },
    });
  } catch (error) {
    console.error("ai-agent-harness failed", { error, stage, requestedTool });
    return harnessResponse({
      error: `Falha segura ao executar ferramenta de IA na etapa: ${stage}.`,
      output: "",
      success: false,
      tool: requestedTool,
    });
  }
});

function harnessResponse(
  body: {
    error?: string;
    output: string;
    structured?: Record<string, unknown>;
    success: boolean;
    tool: string;
    usage?: Record<string, unknown>;
  },
  status = 200,
) {
  return jsonResponse(body, status);
}

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
  return data ?? null;
}

async function loadContext(
  supabase: ReturnType<typeof createAdminClient>,
  body: HarnessBody & { organizationId: string; tool: string },
) {
  const { data: settings, error: settingsError } = await supabase
    .from("organization_ai_settings")
    .select("*")
    .eq("organization_id", body.organizationId)
    .eq("is_active", true)
    .maybeSingle();
  if (settingsError) throw settingsError;

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", body.organizationId)
    .maybeSingle();

  const sessionContext = await loadSessionContext(supabase, body);
  const { data: agent } = body.agentId
    ? await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", body.agentId)
        .eq("organization_id", body.organizationId)
        .maybeSingle()
    : sessionContext.product?.id && body.sessionType
      ? await supabase
          .from("ai_agents")
          .select("*")
          .eq("organization_id", body.organizationId)
          .eq("product_id", sessionContext.product.id)
          .eq("agent_type", body.sessionType)
          .eq("is_managed_by_product", true)
          .eq("status", "active")
          .maybeSingle()
      : { data: null };

  const agentKnowledge = agent?.id
    ? await loadAgentKnowledge(supabase, body.organizationId, agent.id)
    : [];

  return {
    ...sessionContext,
    agent,
    knowledge: agentKnowledge.length
      ? agentKnowledge
      : sessionContext.knowledge,
    organization,
    settings: settings as AISettings | null,
  };
}

async function loadSessionContext(
  supabase: ReturnType<typeof createAdminClient>,
  body: HarnessBody & { organizationId: string; tool: string },
) {
  if (!body.sessionId || !body.sessionType) {
    return {
      knowledge: [],
      lead: null,
      messages: [],
      product: null,
      session: null,
    };
  }

  const sessionTable =
    body.sessionType === "support" ? "support_sessions" : "sales_sessions";
  const messagesTable =
    body.sessionType === "support" ? "support_messages" : "sales_messages";

  const { data: session, error: sessionError } = await supabase
    .from(sessionTable)
    .select("*")
    .eq("id", body.sessionId)
    .eq("organization_id", body.organizationId)
    .single();
  if (sessionError) throw sessionError;

  const [{ data: product }, { data: lead }, { data: messages }] =
    await Promise.all([
      session.product_id
        ? supabase
            .from("products")
            .select("*")
            .eq("id", session.product_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      body.sessionType === "sales" && session.lead_id
        ? supabase
            .from("leads")
            .select("*")
            .eq("id", session.lead_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from(messagesTable)
        .select("sender_type, content, created_at")
        .eq("session_id", body.sessionId)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

  const knowledge = product?.id
    ? await loadLinkedKnowledge(supabase, body.organizationId, product.id)
    : [];

  return {
    knowledge,
    lead,
    messages: (messages ?? []).reverse(),
    product,
    session,
  };
}

async function loadLinkedKnowledge(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  productId: string,
) {
  const { data: links, error: linksError } = await supabase
    .from("product_knowledge_bases")
    .select("knowledge_base_id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .limit(12);
  if (linksError) throw linksError;

  const ids = (links ?? []).map((link) => link.knowledge_base_id);
  if (!ids.length) return [];

  const { data: bases, error: basesError } = await supabase
    .from("knowledge_bases")
    .select("title, content_text, storage_bucket, storage_path")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("id", ids);
  if (basesError) throw basesError;

  return Promise.all(
    (bases ?? []).map(async (base) => {
      if (base.content_text?.trim()) {
        return { content: base.content_text, title: base.title };
      }

      if (!base.storage_bucket || !base.storage_path) {
        return {
          content: "",
          title: base.title,
        };
      }

      const { data } = await supabase.storage
        .from(base.storage_bucket)
        .download(base.storage_path);
      return {
        content: data ? await data.text() : "",
        title: base.title,
      };
    }),
  );
}

async function loadAgentKnowledge(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  agentId: string,
) {
  const { data: links, error: linksError } = await supabase
    .from("ai_agent_knowledge_bases")
    .select("knowledge_base_id")
    .eq("organization_id", organizationId)
    .eq("agent_id", agentId)
    .limit(12);
  if (linksError) throw linksError;

  const ids = (links ?? []).map((link) => link.knowledge_base_id);
  if (!ids.length) return [];

  const { data: bases, error: basesError } = await supabase
    .from("knowledge_bases")
    .select("title, content_text, storage_bucket, storage_path")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("id", ids);
  if (basesError) throw basesError;

  return Promise.all(
    (bases ?? []).map(async (base) => {
      if (base.content_text?.trim()) {
        return { content: base.content_text, title: base.title };
      }
      return {
        content: base.storage_path
          ? `Arquivo vinculado: ${base.storage_bucket}/${base.storage_path}`
          : "Sem conteúdo textual.",
        title: base.title,
      };
    }),
  );
}

function buildPrompt(
  body: HarnessBody & { organizationId: string; tool: string },
  context: Awaited<ReturnType<typeof loadContext>>,
) {
  const messages = context.messages ?? [];
  const recentMessages = messages
    .map(
      (message) =>
        `${formatSenderType(message.sender_type)}: ${message.content}`,
    )
    .join("\n");
  const lastCustomerMessage = [...messages]
    .reverse()
    .find((message) => message.sender_type === "customer");
  const lastHumanMessage = [...messages]
    .reverse()
    .find((message) => message.sender_type === "human");
  const knowledge = (context.knowledge ?? [])
    .map((item) => `- ${item.title}: ${item.content}`)
    .join("\n");
  const sessionGuidance =
    body.sessionType === "support"
      ? "Analise a conversa para identificar sozinho o motivo do suporte e sugira passos de resolução fundamentados no produto e nas bases vinculadas."
      : body.sessionType === "sales"
        ? "Analise a conversa para detectar sozinho objeções, intenção e temperatura do lead; responda usando os dados do produto e as bases vinculadas."
        : "Use somente o contexto disponível e não invente dados.";
  const toolGuidance = buildToolGuidance(body.tool, body.sessionType);

  return `
${BASE_PROMPT}

Organização:
${JSON.stringify(context.organization ?? {}, null, 2)}

Configuração global de IA:
gateway_model_id=${context.settings?.model_id ?? "pendente"}
temperature=${context.settings?.temperature ?? "padrão"}
max_output_tokens=${context.settings?.max_output_tokens ?? "padrão"}

Agente ativo:
${JSON.stringify(context.agent ?? {}, null, 2)}

Ferramenta solicitada: ${body.tool}
Modo: ${body.mode ?? "copilot"}
Tom: ${body.tone ?? "não informado"}
Tipo da sessão: ${body.sessionType ?? "não informado"}
Status da sessão: ${context.session?.status ?? "sem sessão"}

Diretriz específica:
${sessionGuidance}

Diretriz da ferramenta:
${toolGuidance}

Diretriz de copiloto:
Quando o modo for copiloto, leia a conversa como um diálogo contínuo.
Considere tanto as mensagens do cliente quanto as respostas anteriores do atendente.
Não repita informação que o atendente acabou de enviar, a menos que seja necessário esclarecer.
Continue a conversa no ponto atual e gere apenas a próxima resposta para o cliente.

Produto:
${JSON.stringify(context.product ?? {}, null, 2)}

Lead/cliente:
${JSON.stringify(context.lead ?? {}, null, 2)}

Base de conhecimento:
${knowledge || "Sem base cadastrada."}

Última mensagem do cliente:
${lastCustomerMessage?.content ?? "Nenhuma mensagem do cliente encontrada."}

Última resposta do atendente:
${lastHumanMessage?.content ?? "Nenhuma resposta humana anterior encontrada."}

Transcrição recente do atendimento:
${recentMessages || "Sem mensagens recentes."}

Entrada do humano:
${body.input ?? "Não informada."}

Texto selecionado:
${body.selectedText ?? "Não informado."}

Responda apenas com o resultado útil para a ferramenta solicitada.
`.trim();
}

function formatSenderType(senderType: string) {
  const labels: Record<string, string> = {
    ai: "IA",
    customer: "Cliente",
    human: "Atendente",
    system: "Sistema",
  };

  return labels[senderType] ?? senderType;
}

function buildToolGuidance(tool: string, sessionType?: SessionType) {
  if (tool === "sales.suggest_reply" || tool === "support.suggest_reply") {
    return `
Gere uma resposta final pronta para o atendente enviar ao cliente.
Analise toda a conversa disponível entre cliente, atendente, sistema e IA.
Considere o estado atual do atendimento, o produto, o lead/cliente, as mensagens recentes, a base de conhecimento e as regras do agente ativo.
Use a experiência operacional registrada no contexto para escolher a melhor próxima resposta.
Não escreva análise, resumo, justificativa, título, prefixo ou lista de opções.
Não diga "sugestão", "eu responderia" ou "segue".
Responda diretamente como mensagem para o cliente.
Se faltar informação essencial, faça uma pergunta curta de confirmação ao cliente.
Se o cliente estiver irritado, priorize empatia, clareza e próximos passos.
Se for venda, foque em conversão ética, benefício real e avanço natural da compra.
Se for suporte, foque em solução, orientação objetiva e segurança.
Não confirme pagamento, não prometa disponibilidade sem dado real, não encerre atendimento e não envie checkout por conta própria.
`.trim();
  }

  if (sessionType === "sales") {
    return "Execute a ferramenta comercial usando somente contexto real e sem realizar ação crítica.";
  }

  if (sessionType === "support") {
    return "Execute a ferramenta de suporte usando somente contexto real, com clareza e sem encerrar atendimento sozinho.";
  }

  return "Execute a ferramenta usando somente o contexto real disponível.";
}

async function registerBadResponse(
  supabase: ReturnType<typeof createAdminClient>,
  body: HarnessBody & { organizationId: string; tool: string },
  userId: string | null,
) {
  const { data, error } = await supabase
    .from("ai_bad_responses")
    .insert({
      agent_id: body.agentId ?? null,
      created_by: userId,
      message: String(
        body.metadata?.output ?? body.selectedText ?? body.input ?? "",
      ),
      metadata: body.metadata ?? {},
      note: typeof body.metadata?.note === "string" ? body.metadata.note : null,
      organization_id: body.organizationId,
      reason:
        typeof body.metadata?.reason === "string"
          ? body.metadata.reason
          : "Resposta inadequada",
      session_id: body.sessionId ?? null,
      session_type: body.sessionType ?? null,
      tool: body.tool,
    })
    .select("id")
    .single();

  if (error) throw error;

  return {
    output: "Resposta marcada para revisão.",
    structured: { badResponseId: data.id },
    success: true,
    tool: body.tool,
  };
}

function isProductReadTool(tool: string) {
  return new Set([
    "product.get_context",
    "product.get_stock_status",
    "product.get_checkout_info",
  ]).has(tool);
}

function productReadOutput(
  tool: string,
  context: Awaited<ReturnType<typeof loadContext>>,
) {
  if (!context.product) return null;

  if (tool === "product.get_context") {
    return {
      output: JSON.stringify(context.product),
      structured: { product: context.product },
      success: true,
      tool,
    };
  }

  if (tool === "product.get_stock_status") {
    return {
      output: `Estoque atual: ${context.product.stock_quantity ?? "não informado"}.`,
      structured: {
        stockMinimum: context.product.stock_minimum ?? null,
        stockQuantity: context.product.stock_quantity ?? null,
        status: context.product.status ?? null,
      },
      success: true,
      tool,
    };
  }

  if (tool === "product.get_checkout_info") {
    return {
      output: context.product.checkout_url
        ? "Checkout disponível no cadastro do produto. Envio depende de ação humana."
        : "Checkout não configurado para este produto.",
      structured: { checkoutUrl: context.product.checkout_url ?? null },
      success: true,
      tool,
    };
  }

  return null;
}

type CompletionResult = {
  inputTokens?: number;
  model: string;
  outputTokens?: number;
  text: string;
};

async function callGatewayModel(
  settings: AISettings,
  prompt: string,
): Promise<CompletionResult> {
  const provider = normalizeAIProvider(settings.provider);
  const result = await generateAIText({
    maxOutputTokens: settings.max_output_tokens ?? 800,
    modelId: settings.model_id,
    prompt,
    provider,
    temperature: settings.temperature ?? 0.7,
  });

  return {
    inputTokens: result.inputTokens,
    model: settings.model_id,
    outputTokens: result.outputTokens,
    text: result.text.trim(),
  };
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function normalizeEnabledTools(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function safeAIErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("credit") ||
    normalized.includes("restricted") ||
    normalized.includes("not authorized") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden")
  ) {
    return "O modelo global não autorizou geração com a chave atual do AI Gateway. Verifique créditos, billing ou escolha outro modelo em Configurações.";
  }

  if (
    normalized.includes("gateway") ||
    normalized.includes("model") ||
    normalized.includes("provider")
  ) {
    return "Não foi possível gerar resposta com o modelo global configurado. Verifique Configurações de IA.";
  }

  return "Não foi possível gerar resposta agora. Tente novamente em instantes.";
}
