import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("create_support_session", {
      p_custom_reason: body.customReason ?? null,
      p_initial_message: body.initialMessage ?? null,
      p_product_id: body.productId,
      p_reason: body.reason,
    });

    if (error) throw error;
    return jsonResponse({ data, ok: true });
  } catch {
    return jsonResponse(
      { message: "Não foi possível criar a sala de suporte.", ok: false },
      400,
    );
  }
});
