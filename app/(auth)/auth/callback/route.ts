import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(next, requestUrl.origin);

  // Handle OAuth code exchange (Google, etc.)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirecionar para a página de destino (pode ser uma sala pública)
      return NextResponse.redirect(redirectUrl);
    }

    // Se falhar, tentar verificar se é um erro de OAuth já completado no client
    const errorDescription = requestUrl.searchParams.get("error_description");
    if (errorDescription) {
      const errorUrl = new URL("/login", requestUrl.origin);
      errorUrl.searchParams.set("error", errorDescription);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Handle email OTP verification
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("verification", "failed");

  return NextResponse.redirect(loginUrl);
}

function getSafeRedirectPath(next: string | null) {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
