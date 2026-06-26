import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type SendEmailPayload = {
  from?: string;
  html?: string;
  replyTo?: string;
  subject?: string;
  text?: string;
  to?: string | string[];
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as SendEmailPayload;

    if (!body.to || !body.subject) {
      return jsonResponse(
        { message: "Destinatário e assunto são obrigatórios.", ok: false },
        400,
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return jsonResponse(
        {
          message: "RESEND_API_KEY não configurada no Supabase.",
          ok: false,
        },
        500,
      );
    }

    const from =
      body.from ??
      Deno.env.get("EMAIL_FROM") ??
      "Kynovra Sales <onboarding@resend.dev>";
    const html = body.html ?? `<p>${escapeHtml(body.text ?? "")}</p>`;

    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        html,
        reply_to: body.replyTo,
        subject: body.subject,
        to: body.to,
      }),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const providerError = await response.text();
      console.error("Resend failed", {
        status: response.status,
        statusText: response.statusText,
        providerError,
      });

      return jsonResponse(
        {
          message:
            "Não foi possível enviar o e-mail pelo provedor configurado.",
          ok: false,
        },
        502,
      );
    }

    const result = await response.json();

    return jsonResponse({ id: result.id, ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { message: "Não foi possível enviar o e-mail.", ok: false },
      500,
    );
  }
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
