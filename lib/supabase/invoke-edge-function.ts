"use client";

import { FunctionsFetchError } from "@supabase/supabase-js";
import { createClient } from "./client";

export async function invokeEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
) {
  const supabase = createClient();
  const firstAttempt = await supabase.functions.invoke<T>(functionName, {
    body,
  });

  if (!(firstAttempt.error instanceof FunctionsFetchError)) {
    return firstAttempt;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.refresh_token) {
    await supabase.auth.refreshSession();
  }

  return supabase.functions.invoke<T>(functionName, { body });
}
