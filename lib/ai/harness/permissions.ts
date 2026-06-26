import { getAIHarnessTool } from "@/lib/ai/harness/tool-registry";

export const AI_HARNESS_PERMISSIONS = {
  ai: "ai.harness.use",
  badResponse: "ai.bad_response.mark",
  chat: "ai.tool.chat",
  ops: "ai.tool.ops",
  product: "ai.tool.product",
  sales: "ai.tool.sales",
  support: "ai.tool.support",
  auto: "ai.auto.use",
} as const;

export function permissionForAIHarnessTool(tool: string) {
  const definition = getAIHarnessTool(tool);
  if (!definition) return AI_HARNESS_PERMISSIONS.ai;
  if (tool === "ai.register_bad_response") {
    return AI_HARNESS_PERMISSIONS.badResponse;
  }
  return AI_HARNESS_PERMISSIONS[definition.category];
}

export function isCriticalAIHarnessTool(tool: string) {
  return new Set([
    "sales.generate_checkout_message",
    "support.generate_closing_message",
    "ops.prepare_human_handoff",
    "ops.prepare_transfer_context",
  ]).has(tool);
}
