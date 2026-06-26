import {
  generateAIText,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type SessionType = "sales" | "support";

type AutoReplyBody = {
  publicToken?: string;
  sessionType?: SessionType;
};

type AISettings = {
  max_output_tokens?: number | null;
  model_id?: string | null;
  provider?: string | null;
  temperature?: number | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AutoReplyBody;

    if (!body.publicToken || !body.sessionType) {
      return jsonResponse({
        message: "Token público e tipo da sessão são obrigatórios.",
        ok: false,
      });
    }

    const supabase = createAdminClient();
    const sessionTable =
      body.sessionType === "support" ? "support_sessions" : "sales_sessions";
    const messageTable =
      body.sessionType === "support" ? "support_messages" : "sales_messages";

    const { data: session, error: sessionError } = await supabase
      .from(sessionTable)
      .select("*")
      .eq("public_token", body.publicToken)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      return jsonResponse({ message: "Sala não encontrada.", ok: false }, 404);
    }

    if (session.status !== "in_progress" || session.handled_by_type !== "ai") {
      return jsonResponse({
        ok: true,
        replied: false,
        reason: "not_ai_session",
      });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("organization_ai_settings")
      .select("max_output_tokens, model_id, provider, temperature")
      .eq("organization_id", session.organization_id)
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const aiSettings = settings as AISettings | null;
    const provider = normalizeAIProvider(aiSettings?.provider);

    if (!aiSettings?.model_id || !hasAIProviderEnvironment(provider)) {
      return jsonResponse({
        message: "Modelo global de IA não configurado.",
        ok: false,
      });
    }

    const context = await loadContext({
      messageTable,
      session,
      sessionType: body.sessionType,
      supabase,
    });
    const result = await generateAIText({
      maxOutputTokens: aiSettings.max_output_tokens ?? 500,
      modelId: aiSettings.model_id,
      prompt: buildPrompt({ context, sessionType: body.sessionType }),
      provider,
      temperature: aiSettings.temperature ?? 0.7,
    });
    const content = result.text.trim();

    if (!content) {
      return jsonResponse({
        message: "A IA não retornou resposta.",
        ok: false,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from(messageTable)
      .insert({
        content,
        metadata: {
          model: aiSettings.model_id,
          provider,
          source: "ai_public_auto_reply",
        },
        organization_id: session.organization_id,
        sender_type: "ai",
        session_id: session.id,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    await supabase.from("ai_agent_usage").insert({
      agent_id: null,
      cost_estimate: null,
      input_tokens:
        result.inputTokens ?? estimateTokens(JSON.stringify(context)),
      metadata: {
        source: "ai_public_auto_reply",
      },
      model: aiSettings.model_id,
      organization_id: session.organization_id,
      output_tokens: result.outputTokens ?? estimateTokens(content),
      provider,
      session_id: session.id,
      session_type: body.sessionType,
      tool:
        body.sessionType === "support"
          ? "support.suggest_reply"
          : "sales.suggest_reply",
    });

    return jsonResponse({
      message: content,
      messageId: inserted.id,
      ok: true,
      replied: true,
    });
  } catch (error) {
    console.error("ai-public-auto-reply failed", error);
    return jsonResponse(
      {
        message: "Não foi possível gerar a resposta automática da IA.",
        ok: false,
      },
      500,
    );
  }
});

async function loadContext({
  messageTable,
  session,
  sessionType,
  supabase,
}: {
  messageTable: string;
  session: Record<string, unknown>;
  sessionType: SessionType;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const productId = session.product_id as string | null;
  const leadId = session.lead_id as string | null;

  const [{ data: product }, { data: lead }, { data: messages }] =
    await Promise.all([
      productId
        ? supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      sessionType === "sales" && leadId
        ? supabase.from("leads").select("*").eq("id", leadId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from(messageTable)
        .select("sender_type, content, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

  return {
    lead,
    messages: (messages ?? []).reverse(),
    product,
    session,
  };
}

function buildPrompt({
  context,
  sessionType,
}: {
  context: Record<string, unknown>;
  sessionType: SessionType;
}) {
  return `
Você é a IA de atendimento do Kynovra Sales em modo automático.
Analise toda a conversa entre cliente, atendente humano anterior, sistema e IA.
Responda a última mensagem do cliente considerando o produto, cliente, histórico e contexto.
Use somente dados reais do contexto.
Não invente dados.
Não confirme pagamento.
Não envie checkout sozinho.
Não encerre atendimento sozinho.
Se faltar dado essencial, peça confirmação curta.
Se o cliente estiver irritado, responda com empatia e próximos passos.
Em venda, foque em conversão ética.
Em suporte, foque em solução clara.

Tipo da sessão: ${sessionType}

Contexto:
${JSON.stringify(context, null, 2)}

Responda apenas com a mensagem final para o cliente.
`.trim();
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}
