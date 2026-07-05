import {
  type AIProvider,
  generateAIText,
  getAIProviderSetupMessage,
  hasAIProviderEnvironment,
  normalizeAIProvider,
} from "../_shared/ai-provider.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type TestAIConnectionBody = {
  modelId?: string;
  organizationId?: string;
  provider?: AIProvider;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  let provider: AIProvider = "siliconflow";

  try {
    const body = (await request.json()) as TestAIConnectionBody;
    const supabase = createAdminClient();
    const user = await resolveUser(request, supabase);

    if (!user) {
      return jsonResponse(
        { message: "Usuário não autenticado.", ok: false },
        401,
      );
    }

    if (!body.organizationId) {
      return jsonResponse(
        { message: "Organização obrigatória.", ok: false },
        400,
      );
    }

    const canManageSettings = await canManageAISettings(
      supabase,
      user.id,
      body.organizationId,
    );

    if (!canManageSettings) {
      return jsonResponse(
        {
          message: "Sem permissão para testar a configuração de IA.",
          ok: false,
        },
        403,
      );
    }

    const saved = await resolveSavedSettings(supabase, body.organizationId);
    provider = normalizeAIProvider(body.provider ?? saved?.provider);
    const modelId = body.modelId ?? saved?.model_id;

    if (!hasAIProviderEnvironment(provider)) {
      return jsonResponse({
        message: getAIProviderSetupMessage(provider),
        ok: false,
      });
    }

    if (!modelId) {
      return jsonResponse({
        message: "Selecione um modelo antes de testar.",
        ok: false,
      });
    }

    const result = await generateAIText({
      maxOutputTokens: 512,
      modelId,
      prompt:
        "Responda com texto final curto e visível. Não explique. Escreva exatamente: conexão ativa.",
      provider,
    });

    const output = result.text;

    if (!output.trim()) {
      return jsonResponse({
        message: "Falha na conexão com o modelo selecionado.",
        ok: false,
      });
    }

    return jsonResponse({
      message: "Conexão ativa.",
      ok: true,
    });
  } catch (error) {
    console.error(error);
    const detail = sanitizeErrorMessage(error);
    const normalizedDetail = detail.toLowerCase();
    const isGatewayOperationError = normalizedDetail.includes(
      "operation is not supported",
    );
    const isRateLimitError =
      normalizedDetail.includes("rate-limited") ||
      normalizedDetail.includes("rate limit") ||
      normalizedDetail.includes("ratelimitexceedederror");
    const isBillingSetupError =
      normalizedDetail.includes("valid credit card") ||
      normalizedDetail.includes("unlock your free credits") ||
      normalizedDetail.includes("free tier users do not have access") ||
      normalizedDetail.includes("upgrade to paid credits") ||
      normalizedDetail.includes("restrictedmodelserror");

    return jsonResponse({
      message: resolveSafeConnectionErrorMessage({
        isBillingSetupError,
        isGatewayOperationError,
        isRateLimitError,
      }),
      ok: false,
    });
  }
});

function resolveSafeConnectionErrorMessage({
  isBillingSetupError,
  isGatewayOperationError,
  isRateLimitError,
}: {
  isBillingSetupError: boolean;
  isGatewayOperationError: boolean;
  isRateLimitError: boolean;
}) {
  if (isBillingSetupError) {
    return "O modelo selecionado exige créditos pagos no SiliconFlow. Configure o billing ou selecione um modelo disponível no plano atual.";
  }

  if (isRateLimitError) {
    return "O limite temporário do free tier foi atingido. Aguarde alguns minutos ou adicione créditos pagos para remover essa restrição.";
  }

  if (isGatewayOperationError) {
    return "O modelo selecionado não está liberado para a configuração atual do SiliconFlow. Verifique o plano, os créditos e o acesso ao modelo.";
  }

  return "Falha segura no teste de conexão.";
}

function sanitizeErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido na conexão.";

  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/vck_[A-Za-z0-9]+/gi, "[redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/gi, "[redacted]");
}

async function resolveUser(
  request: Request,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

async function canManageAISettings(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  organizationId: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.organization_id !== organizationId) return false;

  if (
    ["owner", "founder", "superadmin", "management", "admin"].includes(
      profile.role,
    )
  ) {
    return true;
  }

  const allowedPermissions = [
    "*",
    "ai.settings.manage",
    "settings.manage",
    "system.admin",
    "team.manage",
  ];

  const [{ data: direct }, { data: group }] = await Promise.all([
    supabase
      .from("profile_permissions")
      .select("permissions!inner(key)")
      .eq("organization_id", organizationId)
      .eq("profile_id", userId),
    supabase
      .from("group_members")
      .select("group_permissions!inner(permissions!inner(key))")
      .eq("organization_id", organizationId)
      .eq("profile_id", userId),
  ]);

  const directPermissionKeys =
    direct?.flatMap((row) => {
      const permission = row.permissions;
      return Array.isArray(permission)
        ? permission.map((item) => item.key)
        : [permission.key];
    }) ?? [];

  const groupPermissionKeys =
    group?.flatMap((row) =>
      (row.group_permissions ?? []).flatMap((groupPermission) => {
        const permission = groupPermission.permissions;
        return Array.isArray(permission)
          ? permission.map((item) => item.key)
          : [permission.key];
      }),
    ) ?? [];

  return [...directPermissionKeys, ...groupPermissionKeys].some((key) =>
    allowedPermissions.includes(key),
  );
}

async function resolveSavedSettings(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId?: string,
) {
  if (!organizationId) return null;
  const { data, error } = await supabase
    .from("organization_ai_settings")
    .select("model_id, provider")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
