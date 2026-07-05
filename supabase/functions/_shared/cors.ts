const allowedOrigins = (Deno.env.get("ALLOWED_CORS_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": allowedOrigins[0] ?? "",
  Vary: "Origin",
};

export function corsHeadersForRequest(request: Request) {
  const origin = request.headers.get("Origin")?.replace(/\/$/, "");
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : "";

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": allowedOrigin,
  };
}

export function optionsResponse(request: Request) {
  return new Response("ok", { headers: corsHeadersForRequest(request) });
}

export function jsonResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...(request ? corsHeadersForRequest(request) : corsHeaders),
      "Content-Type": "application/json",
    },
    status,
  });
}
