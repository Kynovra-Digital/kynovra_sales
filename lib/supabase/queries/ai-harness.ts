"use client";

import type {
  AIHarnessPayload,
  AIHarnessResponse,
} from "@/lib/ai/harness/types";
import { createClient } from "@/lib/supabase/client";

export async function runAIHarnessTool(payload: AIHarnessPayload) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("ai-agent-harness", {
    body: payload,
  });

  if (error) throw error;
  return data as AIHarnessResponse;
}

export async function registerAIHarnessBadResponse(
  payload: Omit<AIHarnessPayload, "tool"> & {
    note?: string;
    output: string;
    reason?: string;
  },
) {
  return runAIHarnessTool({
    ...payload,
    metadata: {
      ...(payload.metadata ?? {}),
      note: payload.note,
      output: payload.output,
      reason: payload.reason ?? "Resposta marcada pelo atendente",
    },
    selectedText: payload.output,
    tool: "ai.register_bad_response",
  });
}
