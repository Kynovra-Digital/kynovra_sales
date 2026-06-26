import type { AIHarnessPayload } from "@/lib/ai/harness/types";

export type AIHarnessClientContext = {
  currentInput?: string;
  selectedText?: string;
};

export function buildAIHarnessClientPayload(
  payload: AIHarnessPayload,
  context?: AIHarnessClientContext,
): AIHarnessPayload {
  return {
    ...payload,
    input: payload.input ?? context?.currentInput,
    selectedText: payload.selectedText ?? context?.selectedText,
  };
}
