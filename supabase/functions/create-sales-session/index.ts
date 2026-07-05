import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

type CreateSalesSessionBody = {
  customerEmail?: string;
  customerName?: string;
  productSlug?: string;
  visitorId?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse(request);
  }

  try {
    const body = (await request.json()) as CreateSalesSessionBody;
    const productSlug = body.productSlug?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim().toLowerCase();
    const visitorId = normalizeVisitorId(body.visitorId);

    if (!productSlug) {
      return jsonResponse(
        {
          message: "Produto é obrigatório.",
          ok: false,
        },
        400,
      );
    }

    const supabase = createAdminClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("slug", productSlug)
      .eq("status", "active")
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return jsonResponse({ message: "Produto indisponível.", ok: false }, 404);
    }

    const { data: existingSession, error: existingError } = await supabase
      .from("sales_sessions")
      .select("id, public_token, status, visitor_id, visitor_expires_at")
      .eq("product_id", product.id)
      .eq("visitor_id", visitorId)
      .neq("status", "closed")
      .gte("visitor_expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingSession) {
      return jsonResponse({
        data: {
          public_token: existingSession.public_token,
          reused: true,
          session_id: existingSession.id,
          visitor_id: visitorId,
        },
        ok: true,
      });
    }

    if (!customerName || !customerEmail) {
      return jsonResponse({
        data: null,
        message: "Nenhuma sessão ativa encontrada para este visitante.",
        ok: true,
      });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        email: customerEmail,
        name: customerName,
        organization_id: product.organization_id,
        product_id: product.id,
        source: "product_public_link",
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    const publicToken = encodeHex(crypto.getRandomValues(new Uint8Array(24)));
    const visitorExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: session, error: sessionError } = await supabase
      .from("sales_sessions")
      .insert({
        accepted_by: null,
        handled_by_type: null,
        lead_id: lead.id,
        organization_id: product.organization_id,
        product_id: product.id,
        public_token: publicToken,
        session_code: `SALE-${publicToken.slice(0, 10).toUpperCase()}`,
        source: "product_public_link",
        status: "waiting",
        visitor_expires_at: visitorExpiresAt.toISOString(),
        visitor_id: visitorId,
      })
      .select("id, public_token")
      .single();

    if (sessionError) throw sessionError;

    await supabase.from("notifications").insert({
      metadata: {
        product_id: product.id,
        source: "product_public_link",
      },
      organization_id: product.organization_id,
      title: "Novo atendimento de venda",
      type: "sales_session.created",
    });

    return jsonResponse({
      data: {
        public_token: session.public_token,
        reused: false,
        session_id: session.id,
        visitor_id: visitorId,
      },
      ok: true,
    });
  } catch (error) {
    console.error("create-sales-session failed", error);
    return jsonResponse(
      { message: "Não foi possível criar a sala de atendimento.", ok: false },
      400,
    );
  }
});

function normalizeVisitorId(value?: string) {
  if (value && /^[a-zA-Z0-9-]{16,80}$/.test(value)) {
    return value;
  }

  return crypto.randomUUID();
}

function encodeHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
