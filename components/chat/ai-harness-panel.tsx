"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  AIHarnessMode,
  AIHarnessSessionType,
} from "@/lib/ai/harness/types";
import {
  registerAIHarnessBadResponse,
  runAIHarnessTool,
} from "@/lib/supabase/queries/ai-harness";

type AIHarnessPanelProps = {
  currentMessage: string;
  handledByType?: string | null;
  model?: string;
  mode: AIHarnessMode;
  modelId?: string;
  onUseSuggestion: (suggestion: string) => void;
  organizationId?: string;
  sessionId: string;
  sessionType: AIHarnessSessionType;
};

const defaultToolBySessionType: Record<AIHarnessSessionType, string> = {
  sales: "sales.suggest_reply",
  support: "support.suggest_reply",
};

export function AIHarnessPanel({
  currentMessage,
  handledByType,
  mode,
  modelId,
  onUseSuggestion,
  organizationId,
  sessionId,
  sessionType,
}: AIHarnessPanelProps) {
  const [suggestion, setSuggestion] = useState("");

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      const prompt =
        currentMessage.trim() ||
        "Modo copiloto: analise toda a conversa entre cliente e atendente, incluindo o que o cliente perguntou e como o atendente respondeu até agora. Use o produto, o histórico, a base de conhecimento e as regras do agente para criar a melhor próxima resposta para enviar ao cliente agora.";

      return runAIHarnessTool({
        input: prompt,
        metadata: {
          intent: "generate_customer_reply",
          source: "right_chat_ai_panel",
        },
        mode: "copilot",
        organizationId,
        selectedText: suggestion || undefined,
        sessionId,
        sessionType,
        tool: defaultToolBySessionType[sessionType],
      });
    },
    onError: () => {
      toast.error("Não foi possível falar com a IA.");
      setSuggestion(
        "Não foi possível conectar com a IA agora. Verifique a configuração global de IA e tente novamente.",
      );
    },
    onSuccess: (result) => {
      if (!result.success || !result.output) {
        const message = result.error || "A IA não retornou resposta.";
        setSuggestion(message);
        toast.error(message);
        return;
      }

      setSuggestion(result.output);
      toast.success("Resposta criada pela IA.");
    },
  });

  const badResponseMutation = useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return registerAIHarnessBadResponse({
        mode: "copilot",
        organizationId,
        output: suggestion,
        reason: "Resposta marcada pelo atendente",
        sessionId,
        sessionType,
      });
    },
    onError: () => {
      toast.error("Não foi possível marcar a resposta.");
    },
    onSuccess: () => {
      toast.success("Resposta marcada para revisão.");
    },
  });

  const activeMode =
    handledByType === "ai" || mode === "auto" ? "IA automática" : "Copiloto";

  function handleGenerateResponse() {
    if (generateMutation.isPending) return;
    if (!organizationId) {
      toast.error("Organização ainda não carregada. Aguarde alguns segundos.");
      return;
    }
    generateMutation.mutate();
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-muted-foreground text-xs">
            {activeMode} · {modelId ? modelId : "modelo global pendente"}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          IA
        </span>
      </div>

      <div className="grid gap-2">
        <label
          className="text-muted-foreground text-xs font-medium"
          htmlFor={`${sessionType}-ai-response-output`}
        >
          Resposta para o cliente
        </label>
        <Textarea
          className="min-h-[min(52vh,30rem)] resize-none"
          id={`${sessionType}-ai-response-output`}
          placeholder={
            generateMutation.isPending
              ? "A IA está analisando a conversa e o contexto..."
              : "Clique em Gerar resposta para a IA analisar a conversa e criar uma resposta para o cliente."
          }
          readOnly
          value={suggestion}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-2"
          disabled={generateMutation.isPending}
          onClick={handleGenerateResponse}
          type="button"
          variant="outline"
        >
          <Sparkles data-icon="inline-start" />
          {generateMutation.isPending ? "Gerando..." : "Gerar resposta"}
        </Button>
        <Button
          className="flex-1"
          disabled={!suggestion.trim()}
          onClick={() => onUseSuggestion(suggestion)}
          type="button"
        >
          Usar resposta
        </Button>
        <Button
          className="gap-2"
          disabled={!suggestion.trim() || badResponseMutation.isPending}
          onClick={() => badResponseMutation.mutate()}
          type="button"
          variant="outline"
        >
          <ThumbsDown data-icon="inline-start" />
          Marcar ruim
        </Button>
      </div>
    </div>
  );
}
