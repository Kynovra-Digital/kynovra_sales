"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, RotateCcw, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  getHardnessMasterPrompts,
  saveHardnessMasterPrompts,
} from "@/lib/supabase/queries/hardness";
import { queryKeys } from "@/lib/supabase/query-keys";

const defaultSalesMasterPrompt =
  "Crie um prompt operacional para o agente vendedor do Kynovra Sales. Use [Produto], [Preço], [Benefícios], [Estoque], [Checkout], [Base de dados], [Tom], [Regras] e [Histórico] para orientar uma conversa comercial ética, consultiva e objetiva. Não invente dados, não confirme pagamento e não envie checkout sem ação humana.";

const defaultSupportMasterPrompt =
  "Crie um prompt operacional para o agente de suporte do Kynovra Sales. Use [Produto], [Garantia], [Suporte], [Base de dados], [Tom], [Regras] e [Histórico] para resolver dúvidas com clareza e empatia. Não invente dados, não encerre atendimento sozinho e encaminhe para humano quando faltar contexto.";

export function HardnessPage() {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const [salesMasterPrompt, setSalesMasterPrompt] = useState("");
  const [supportMasterPrompt, setSupportMasterPrompt] = useState("");

  const promptsQuery = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getHardnessMasterPrompts(organizationId),
    queryKey: queryKeys.hardness.global(organizationId),
  });

  useEffect(() => {
    if (!promptsQuery.data) return;
    setSalesMasterPrompt(promptsQuery.data.sales_master_prompt);
    setSupportMasterPrompt(promptsQuery.data.support_master_prompt);
  }, [promptsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return saveHardnessMasterPrompts({
        organizationId,
        salesMasterPrompt,
        supportMasterPrompt,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível salvar o Hardness.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.hardness.global(organizationId),
      });
      toast.success("Hardness salvo no Supabase.");
    },
  });

  function restoreDefaults() {
    setSalesMasterPrompt(defaultSalesMasterPrompt);
    setSupportMasterPrompt(defaultSupportMasterPrompt);
    toast.info("Prompts padrão restaurados. Clique em Salvar para aplicar.");
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="border-border/70 border-b px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/12 text-blue-200">
                <BrainCircuit className="size-5" />
              </span>
              <Badge variant="outline">Global por organização</Badge>
            </div>
            <h1 className="font-semibold text-2xl text-foreground">Hardness</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground text-sm">
              Configure os prompts master globais. Eles não pertencem a um
              produto específico: todos os produtos usam estes masters para
              gerar automaticamente o prompt final dos agentes de venda e
              suporte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={saveMutation.isPending}
              onClick={restoreDefaults}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Restaurar padrão
            </Button>
            <Button
              disabled={saveMutation.isPending || !organizationId}
              onClick={() => saveMutation.mutate()}
              type="button"
            >
              <Save className="size-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-4 rounded-2xl border border-blue-400/15 bg-blue-500/8 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-500/12 text-blue-200">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-base">
                Como o Hardness funciona
              </h2>
              <p className="mt-1 text-muted-foreground text-sm leading-6">
                Ao criar ou editar um produto, o Supabase usa estes prompts
                master, os dados do produto, as bases vinculadas e a
                configuração global de IA para gerar o prompt final salvo em
                <span className="font-mono"> ai_agents.prompt</span>. O Harness
                usa somente esse prompt final durante o atendimento.
              </p>
            </div>
          </div>
        </div>

        {promptsQuery.isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <PromptEditor
              description="Master usado para gerar o prompt final dos agentes de venda de todos os produtos."
              onChange={setSalesMasterPrompt}
              placeholder={defaultSalesMasterPrompt}
              title="Prompt Master para Agente Vendedor"
              value={salesMasterPrompt}
            />
            <PromptEditor
              description="Master usado para gerar o prompt final dos agentes de suporte de todos os produtos."
              onChange={setSupportMasterPrompt}
              placeholder={defaultSupportMasterPrompt}
              title="Prompt Master para Agente de Suporte"
              value={supportMasterPrompt}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function PromptEditor({
  description,
  onChange,
  placeholder,
  title,
  value,
}: {
  description: string;
  onChange: (value: string) => void;
  placeholder: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[430px] flex-col rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="font-semibold text-base">{title}</h2>
        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      </div>
      <Textarea
        className="min-h-[330px] flex-1 resize-y border-white/10 bg-background/60 text-sm leading-6"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
