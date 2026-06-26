export type AIHarnessSessionType = "sales" | "support";

export type AIHarnessMode = "analysis" | "auto" | "copilot";

export type AIHarnessToolCategory =
  | "ai"
  | "chat"
  | "ops"
  | "product"
  | "sales"
  | "support";

export type AIHarnessPayload = {
  agentId?: string;
  input?: string;
  metadata?: Record<string, unknown>;
  mode?: AIHarnessMode;
  organizationId: string;
  selectedText?: string;
  sessionId?: string;
  sessionType?: AIHarnessSessionType;
  tone?: string;
  tool: string;
};

export type AIHarnessUsage = {
  costEstimate?: number;
  inputTokens?: number;
  model: string;
  outputTokens?: number;
  provider: string;
};

export type AIHarnessResponse = {
  error?: string;
  output: string;
  structured?: Record<string, unknown>;
  success: boolean;
  tool: string;
  usage?: AIHarnessUsage;
};

export type AIHarnessToolDefinition = {
  category: AIHarnessToolCategory;
  description: string;
  label: string;
  requiresLLM: boolean;
  tool: string;
};
