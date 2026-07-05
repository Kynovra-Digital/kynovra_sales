import {
  generateAIText,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type SessionType = "sales" | "support";

type AutoTakeoverBody = {
  publicToken?: string;
  sessionType?: SessionType;
};

type AISettings = {
  ai_auto_takeover_enabled?: boolean | null;
  human_accept_timeout_seconds?: number | null;
  max_output_tokens?: number | null;
  model_id?: string | null;
  provider?: string | null;
  temperature?: number | null;
};

type OrganizationSettings = {
  ai_takeover_timeout_seconds?: number | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as AutoTakeoverBody;

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

    if (session.status !== "waiting" || session.accepted_by) {
      return jsonResponse({
        ok: true,
        status: session.status,
        takeover: false,
      });
    }

    const [{ data: aiSettings }, { data: organizationSettings }] =
      await Promise.all([
        supabase
          .from("organization_ai_settings")
          .select(
            "ai_auto_takeover_enabled, human_accept_timeout_seconds, max_output_tokens, model_id, provider, temperature",
          )
          .eq("organization_id", session.organization_id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("organization_settings")
          .select("ai_takeover_timeout_seconds")
          .eq("organization_id", session.organization_id)
          .maybeSingle(),
      ]);

    const settings = aiSettings as AISettings | null;
    const orgSettings = organizationSettings as OrganizationSettings | null;
    const autoEnabled = settings?.ai_auto_takeover_enabled ?? true;

    if (!autoEnabled) {
      return jsonResponse({ ok: true, takeover: false, reason: "disabled" });
    }

    const timeoutSeconds =
      orgSettings?.ai_takeover_timeout_seconds ??
      settings?.human_accept_timeout_seconds ??
      60;
    const createdAt = new Date(session.created_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);

    if (elapsedSeconds < timeoutSeconds) {
      return jsonResponse({
        elapsedSeconds,
        ok: true,
        takeover: false,
        timeoutSeconds,
      });
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from(sessionTable)
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: "ai",
        ai_takeover_at: new Date().toISOString(),
        handled_by_type: "ai",
        opened_at: new Date().toISOString(),
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("status", "waiting")
      .is("accepted_by", null)
      .select("*")
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedSession) {
      return jsonResponse({ ok: true, takeover: false, reason: "race" });
    }

    const message = await generateFirstAIMessage({
      settings,
      session: updatedSession,
      sessionType: body.sessionType,
      supabase,
    });

    const { error: messageError } = await supabase.from(messageTable).insert({
      content: message,
      metadata: {
        source: "ai_auto_takeover",
      },
      organization_id: updatedSession.organization_id,
      sender_type: "ai",
      session_id: updatedSession.id,
    });

    if (messageError) throw messageError;

    return jsonResponse({
      message,
      ok: true,
      sessionId: updatedSession.id,
      takeover: true,
    });
  } catch (error) {
    console.error("ai-auto-takeover failed", error);
    return jsonResponse(
      {
        message: "Não foi possível executar o takeover automático da IA.",
        ok: false,
      },
      500,
    );
  }
});

async function generateFirstAIMessage({
  settings,
  session,
  sessionType,
  supabase,
}: {
  settings: AISettings | null;
  session: Record<string, unknown>;
  sessionType: SessionType;
  supabase: ReturnType<typeof createAdminClient>;
}) {
  const fallback =
    sessionType === "support"
      ? "Olá, tudo bem? Seu atendimento já foi iniciado. Vou analisar sua solicitação e te ajudar com os próximos passos."
      : "Olá, tudo bem? Seu atendimento já foi iniciado. Vou te ajudar com as informações do produto e a finalização da compra.";

  const provider = normalizeAIProvider(settings?.provider);
  if (!settings?.model_id || !hasAIProviderEnvironment(provider)) {
    return fallback;
  }

  try {
    const context = await loadSessionContext(supabase, session, sessionType);
    const result = await generateAIText({
      maxOutputTokens: settings.max_output_tokens ?? 240,
      modelId: settings.model_id,
      prompt: buildPrompt({
        context,
        sessionType,
        task: "A IA acabou de assumir porque nenhum humano aceitou no tempo configurado. Escreva a primeira mensagem ao cliente, curta, empática e útil.",
      }),
      provider,
      temperature: settings.temperature ?? 0.7,
    });

    return result.text.trim() || fallback;
  } catch (error) {
    console.error("ai-auto-takeover first message failed", error);
    return fallback;
  }
}

async function loadSessionContext(
  supabase: ReturnType<typeof createAdminClient>,
  session: Record<string, unknown>,
  sessionType: SessionType,
) {
  const productId = session.product_id as string | null;
  const leadId = session.lead_id as string | null;
  const messagesTable =
    sessionType === "support" ? "support_messages" : "sales_messages";

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
        .from(messagesTable)
        .select("sender_type, content, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true })
        .limit(40),
    ]);

  return { lead, messages: messages ?? [], product, session };
}

function buildPrompt({
  context,
  sessionType,
  task,
}: {
  context: Record<string, unknown>;
  sessionType: SessionType;
  task: string;
}) {
  return `
Você é a IA de atendimento do Kynovra Sales.
Você está assumindo uma sala pública em modo automático.
Use apenas os dados reais do contexto.
Não invente disponibilidade, pagamento, prazo ou política.
Não confirme venda sozinho.
Não envie checkout sozinho.
Não encerre atendimento sozinho.
Em venda, ajude na conversão com ética.
Em suporte, ajude com clareza e empatia.

Tipo da sessão: ${sessionType}
Tarefa: ${task}

Contexto:
${JSON.stringify(context, null, 2)}

Responda apenas com a mensagem para o cliente.
`.trim();
}
