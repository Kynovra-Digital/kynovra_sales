"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { invokeEdgeFunction } from "@/lib/supabase/invoke-edge-function";

export type PublicProduct = Pick<
  Tables<"products">,
  | "category"
  | "checkout_url"
  | "id"
  | "image_url"
  | "image_urls"
  | "main_benefit"
  | "name"
  | "price"
  | "slug"
  | "status"
  | "support_info"
>;

export type PublicStorefrontProduct = Pick<
  Tables<"products">,
  | "category"
  | "id"
  | "image_url"
  | "main_benefit"
  | "name"
  | "price"
  | "public_cta"
  | "public_description"
  | "public_headline"
  | "short_description"
  | "show_price_publicly"
  | "slug"
  | "status"
  | "subcategory"
  | "support_info"
>;

export type PublicStorefrontCampaign = Pick<
  Tables<"campaigns">,
  | "banner_url"
  | "description"
  | "ends_at"
  | "headline"
  | "id"
  | "name"
  | "section_banner_url"
  | "slug"
  | "starts_at"
  | "status"
> & {
  products: PublicStorefrontProduct[];
};

export type PublicStorefront = {
  campaigns: PublicStorefrontCampaign[];
};

export type PublicProductReview = {
  comment: string | null;
  created_at: string;
  id: string;
  rating: number | null;
  ratings: Record<string, number>;
  session_type: string;
};

export type PublicStorefrontSubcategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicStorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: PublicStorefrontSubcategory[];
};

export type PublicRoomMessage = {
  content: string;
  created_at: string;
  id: string;
  sender_type: string;
};

export async function getPublicProductBySlug(productSlug: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_product_by_slug", {
    p_product_slug: productSlug,
  });

  if (error) throw error;
  return data as PublicProduct;
}

export async function getPublicProductReviews(productSlug: string) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "get_public_product_reviews",
    {
      p_product_slug: productSlug,
    },
  );

  if (error) throw error;
  return data as PublicProductReview[];
}

export async function listPublicActiveProducts() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_public_active_products");

  if (error) throw error;
  return (data ?? []) as PublicProduct[];
}

export async function getPublicStorefront() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_storefront");

  if (error) throw error;
  return (data ?? { campaigns: [] }) as PublicStorefront;
}

export async function getPublicStorefrontCategories() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "get_public_storefront_categories",
  );

  if (error) throw error;
  return (data ?? []) as PublicStorefrontCategory[];
}

export async function createSalesSessionFromProduct(input: {
  customerEmail: string;
  customerName: string;
  productSlug: string;
}) {
  const visitorId = getSalesVisitorId();
  const { data, error } = await invokeEdgeFunction<{
    data?: {
      public_token: string;
      reused: boolean;
      session_id: string;
      visitor_id: string;
    };
    message?: string;
    ok: boolean;
  }>("create-sales-session", {
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    productSlug: input.productSlug,
    visitorId,
  });

  if (error) throw error;
  if (!data?.ok || !data.data) {
    throw new Error(data?.message ?? "Não foi possível iniciar atendimento.");
  }

  setSalesVisitorId(data.data.visitor_id);
  return data.data;
}

export async function findExistingSalesSessionFromProduct(productSlug: string) {
  const visitorId = getSalesVisitorId();

  if (!visitorId) {
    return null;
  }

  const { data, error } = await invokeEdgeFunction<{
    data?: {
      public_token: string;
      reused: boolean;
      session_id: string;
      visitor_id: string;
    } | null;
    message?: string;
    ok: boolean;
  }>("create-sales-session", {
    productSlug,
    visitorId,
  });

  if (error) throw error;
  if (!data?.ok || !data.data) {
    return null;
  }

  setSalesVisitorId(data.data.visitor_id);
  return data.data;
}

export async function getPublicSalesSession(publicToken: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_sales_session", {
    p_public_token: publicToken,
  });

  if (error) throw error;
  return data as Record<string, unknown>;
}

export function subscribePublicSalesSession(
  publicToken: string,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`public-sales-session:${publicToken}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `public_token=eq.${publicToken}`,
        schema: "public",
        table: "sales_sessions",
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribePublicSalesMessages(
  publicToken: string,
  sessionId: string | undefined,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase.channel(`public-sales-messages:${publicToken}`);

  if (sessionId) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        filter: `session_id=eq.${sessionId}`,
        schema: "public",
        table: "sales_messages",
      },
      onChange,
    );
  } else {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sales_messages",
      },
      onChange,
    );
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listPublicSalesMessages(publicToken: string) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "get_public_sales_messages",
    {
      p_public_token: publicToken,
    },
  );

  if (error) throw error;
  return (data ?? []) as PublicRoomMessage[];
}

export async function sendPublicSalesMessage(
  publicToken: string,
  content: string,
) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "send_public_sales_message",
    {
      p_content: content,
      p_public_token: publicToken,
    },
  );

  if (error) throw error;
  return data;
}

export async function triggerPublicSalesAITakeover(publicToken: string) {
  const { data, error } = await invokeEdgeFunction("ai-auto-takeover", {
    publicToken,
    sessionType: "sales",
  });

  if (error) throw error;
  return data;
}

export async function triggerPublicSalesAIAutoReply(publicToken: string) {
  const { data, error } = await invokeEdgeFunction("ai-public-auto-reply", {
    publicToken,
    sessionType: "sales",
  });

  if (error) throw error;
  return data;
}

export async function createSupportSession(input: {
  customReason?: string;
  initialMessage?: string;
  productId: string;
  reason: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_support_session", {
    p_custom_reason: input.customReason || undefined,
    p_initial_message: input.initialMessage || undefined,
    p_product_id: input.productId,
    p_reason: input.reason,
  });

  if (error) throw error;
  return data as { public_token: string; session_id: string };
}

export async function getPublicSupportSession(publicToken: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_support_session", {
    p_public_token: publicToken,
  });

  if (error) throw error;
  return data as Record<string, unknown>;
}

export function subscribePublicSupportSession(
  publicToken: string,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`public-support-session:${publicToken}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `public_token=eq.${publicToken}`,
        schema: "public",
        table: "support_sessions",
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribePublicSupportMessages(
  publicToken: string,
  sessionId: string | undefined,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase.channel(`public-support-messages:${publicToken}`);

  if (sessionId) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        filter: `session_id=eq.${sessionId}`,
        schema: "public",
        table: "support_messages",
      },
      onChange,
    );
  } else {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "support_messages",
      },
      onChange,
    );
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listPublicSupportMessages(publicToken: string) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "get_public_support_messages",
    {
      p_public_token: publicToken,
    },
  );

  if (error) throw error;
  return (data ?? []) as PublicRoomMessage[];
}

export async function sendPublicSupportMessage(
  publicToken: string,
  content: string,
) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "send_public_support_message",
    {
      p_content: content,
      p_public_token: publicToken,
    },
  );

  if (error) throw error;
  return data;
}

export async function triggerPublicSupportAITakeover(publicToken: string) {
  const { data, error } = await invokeEdgeFunction("ai-auto-takeover", {
    publicToken,
    sessionType: "support",
  });

  if (error) throw error;
  return data;
}

export async function triggerPublicSupportAIAutoReply(publicToken: string) {
  const { data, error } = await invokeEdgeFunction("ai-public-auto-reply", {
    publicToken,
    sessionType: "support",
  });

  if (error) throw error;
  return data;
}

export async function submitPublicSessionFeedback(input: {
  comment?: string;
  publicToken: string;
  ratings: Record<string, number>;
  sessionType: "sales" | "support";
}) {
  const supabase = createClient();
  const { data, error } = await rpcUntyped(
    supabase,
    "submit_public_session_feedback",
    {
      p_comment: input.comment ?? null,
      p_public_token: input.publicToken,
      p_ratings: input.ratings,
      p_session_type: input.sessionType,
    },
  );

  if (error) throw error;
  return data as { success?: boolean };
}

function rpcUntyped(
  supabase: ReturnType<typeof createClient>,
  functionName: string,
  args: Record<string, unknown>,
) {
  return (
    supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => ReturnType<typeof supabase.rpc>
  )(functionName, args);
}

const SALES_VISITOR_COOKIE = "kynovra_sales_visitor_id";
const SALES_VISITOR_MAX_AGE_SECONDS = 24 * 60 * 60;

function getSalesVisitorId() {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${SALES_VISITOR_COOKIE}=`))
    ?.split("=")[1];
}

function setSalesVisitorId(visitorId: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: escrita sincrona e universalmente suportada; o read path (getSalesVisitorId) precisa de acesso sync antes do RPC, e a Cookie Store API exigiria refator async em ambos os caminhos.
  document.cookie = `${SALES_VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Max-Age=${SALES_VISITOR_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export async function validateContinuityCode(code: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("validate_continuity_code", {
    p_code: code,
  });

  if (error) throw error;
  return data as { public_token?: string; success?: boolean };
}
