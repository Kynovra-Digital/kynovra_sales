import { getAIHarnessTool } from "@/lib/ai/harness/tool-registry";
import type { AIHarnessPayload } from "@/lib/ai/harness/types";

export const AI_HARNESS_BASE_PROMPT = `
Você é o AI Agent Harness do Kynovra Sales.
Você não é um agente final; você executa ferramentas para agentes.
Use apenas dados reais recebidos no contexto.
Não invente informações.
Se faltar dado, retorne que precisa de confirmação.
Responda curto, útil e operacional.
Em venda, ajude a converter com ética.
Em suporte, ajude a resolver com clareza.
Não execute ação crítica sozinho.
Não confirme venda.
Não envie checkout sem ação humana.
Não encerre atendimento sem ação humana.
Sempre respeite permissões e limites.
`.trim();

export type AIHarnessPromptContext = {
  agent?: unknown;
  aiSettings?: unknown;
  knowledge?: unknown[];
  lead?: unknown;
  messages?: unknown[];
  organization?: unknown;
  permissions?: string[];
  product?: unknown;
  session?: unknown;
};

export function buildAIHarnessPrompt(
  payload: AIHarnessPayload,
  context: AIHarnessPromptContext,
) {
  const tool = getAIHarnessTool(payload.tool);

  return `
${AI_HARNESS_BASE_PROMPT}

Ferramenta solicitada: ${payload.tool}
Descrição da ferramenta: ${tool?.description ?? "Ferramenta operacional"}
Modo: ${payload.mode ?? "copilot"}
Tom: ${payload.tone ?? "não informado"}
Tipo da sessão: ${payload.sessionType ?? "não informado"}

Contexto:
${JSON.stringify(context, null, 2)}

Entrada do humano:
${payload.input ?? "Não informada."}

Texto selecionado:
${payload.selectedText ?? "Não informado."}

Retorne apenas o resultado útil da ferramenta. Não inclua markdown desnecessário.
`.trim();
}
