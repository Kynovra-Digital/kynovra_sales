import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("validate_continuity_code", {
      p_code: body.code,
    });

    if (error) throw error;
    return jsonResponse(data);
  } catch {
    return jsonResponse(
      { message: "Não foi possível validar o código.", ok: false },
      400,
    );
  }
});
