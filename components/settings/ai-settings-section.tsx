"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Gauge,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  type AIGatewayModel,
  type AIProvider,
  listAiGatewayModels,
} from "@/lib/supabase/queries/ai-models";
import {
  getAiSettings,
  saveAiSettings,
  testAiConnection,
} from "@/lib/supabase/queries/ai-settings";
import { queryKeys } from "@/lib/supabase/query-keys";

type ConnectionState = "error" | "idle" | "success" | "testing";

export function AISettingsSection() {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<AIProvider>("siliconflow");
  const [modelId, setModelId] = useState("");
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [maxOutputTokens, setMaxOutputTokens] = useState("800");
  const [timeoutSeconds, setTimeoutSeconds] = useState("30");
  const [fallbackEnabled, setFallbackEnabled] = useState(false);
  const [fallbackModelId, setFallbackModelId] = useState("");
  const [isAutoTakeoverEnabled, setAutoTakeoverEnabled] = useState(true);
  const [humanAcceptTimeoutSeconds, setHumanAcceptTimeoutSeconds] =
    useState("60");
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [hasTestedConnection, setHasTestedConnection] = useState(false);
  const organizationId = organization?.id ?? profile?.organization_id ?? "";

  const { data: savedSettings } = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getAiSettings(organizationId),
    queryKey: queryKeys.aiSettings.global,
  });

  const {
    data: models = [],
    error: modelsError,
    isFetching: isModelsFetching,
    refetch: refetchModels,
  } = useQuery({
    queryFn: () => listAiGatewayModels(provider),
    queryKey: ["ai-provider-models", provider],
  });

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return models;
    return models.filter((model) =>
      `${model.id} ${model.name} ${model.provider ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [models, search]);

  const savedProvider = savedSettings
    ? normalizeProvider(savedSettings.provider)
    : null;
  const savedModelId = savedSettings?.model_id ?? savedSettings?.model ?? "";
  const effectiveModelId =
    modelId || (provider === savedProvider ? savedModelId : "");
  const canSave = Boolean(effectiveModelId);
  const canTest = Boolean(effectiveModelId);
  const providerName = getProviderName(provider);

  useEffect(() => {
    if (!savedSettings) return;
    setProvider(normalizeProvider(savedSettings.provider));
    setModelId(savedSettings.model_id ?? savedSettings.model ?? "");
    setTemperature(String(savedSettings.temperature ?? 0.7));
    setMaxOutputTokens(String(savedSettings.max_output_tokens ?? 800));
    setTimeoutSeconds(String(savedSettings.timeout_seconds ?? 30));
    setFallbackEnabled(savedSettings.fallback_enabled ?? false);
    setFallbackModelId(
      savedSettings.fallback_model_id ?? savedSettings.fallback_model ?? "",
    );
    setAutoTakeoverEnabled(savedSettings.ai_auto_takeover_enabled ?? true);
    setHumanAcceptTimeoutSeconds(
      String(savedSettings.human_accept_timeout_seconds ?? 60),
    );
  }, [savedSettings]);

  useEffect(() => {
    if (modelId || models.length === 0) return;

    const savedModelForProvider =
      provider === savedProvider ? savedModelId : "";
    if (
      savedModelForProvider &&
      models.some((model) => model.id === savedModelForProvider)
    ) {
      setModelId(savedModelForProvider);
      return;
    }

    setModelId(models[0]?.id ?? "");
  }, [modelId, models, provider, savedModelId, savedProvider]);

  useEffect(() => {
    if (hasTestedConnection) return;

    if (modelsError) {
      setConnectionState("error");
      return;
    }

    if (savedSettings?.model_id) {
      setConnectionState("idle");
      return;
    }

    setConnectionState("idle");
  }, [hasTestedConnection, modelsError, savedSettings?.model_id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return saveAiSettings({
        fallbackEnabled,
        fallbackModelId: fallbackEnabled ? fallbackModelId : null,
        humanAcceptTimeoutSeconds: Number(humanAcceptTimeoutSeconds),
        isAutoTakeoverEnabled,
        maxOutputTokens: Number(maxOutputTokens),
        modelId: effectiveModelId,
        organizationId,
        provider,
        temperature: Number(temperature),
        timeoutSeconds: Number(timeoutSeconds),
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a configuração de IA.";
      toast.error(message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.aiSettings.global,
      });
      toast.success("Configuração global de IA salva.");
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return testAiConnection({
        modelId: effectiveModelId,
        organizationId,
        provider,
      });
    },
    onError: (error) => {
      setConnectionState("error");
      const message =
        error instanceof Error
          ? error.message
          : "Falha na conexão com o AI Gateway.";
      toast.error(message);
    },
    onMutate: () => {
      setHasTestedConnection(true);
      setConnectionState("testing");
    },
    onSuccess: (result) => {
      setConnectionState(result.ok ? "success" : "error");
      toast[result.ok ? "success" : "error"](result.message);
    },
  });

  return (
    <section className="grid min-w-0 gap-4" id="ia">
      <div className="data-panel min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-white/10 border-b p-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-blue-100">
              <Bot />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-base">
                Inteligência Artificial
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Escolha o provedor e o modelo global. As chaves ficam somente
                nos Supabase Secrets.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
            <Button
              className="gap-2"
              disabled={isModelsFetching}
              onClick={() => {
                void refetchModels().then((result) => {
                  if (result.error) {
                    toast.error("Não foi possível atualizar a lista.");
                    return;
                  }
                  toast.success("Lista de modelos atualizada.");
                });
              }}
              size="sm"
              variant="outline"
            >
              <RefreshCcw data-icon="inline-start" />
              Atualizar modelos
            </Button>
            <Button
              className="gap-2"
              disabled={testMutation.isPending}
              onClick={() => {
                if (!canTest) {
                  toast.error("Selecione um modelo antes de testar.");
                  return;
                }
                if (!organizationId) {
                  toast.error("Organização não carregada.");
                  return;
                }
                testMutation.mutate();
              }}
              size="sm"
              variant="outline"
            >
              <Gauge data-icon="inline-start" />
              {connectionState === "testing" ? "Testando..." : "Testar conexão"}
            </Button>
            <Button
              className="gap-2"
              disabled={saveMutation.isPending}
              onClick={() => {
                if (!canSave) {
                  toast.error("Selecione um modelo antes de salvar.");
                  return;
                }
                if (!organizationId) {
                  toast.error("Organização não carregada.");
                  return;
                }
                saveMutation.mutate();
              }}
              size="sm"
            >
              <Save data-icon="inline-start" />
              Salvar IA
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-4 p-4">
          <div className="grid w-full min-w-0 gap-4">
            <Field
              description="A escolha é global para todos os agentes da organização."
              label="Provedor de IA"
            >
              <Select
                onValueChange={(value) => {
                  setProvider(value as AIProvider);
                  setModelId("");
                  setFallbackModelId("");
                  setSearch("");
                  setConnectionState("idle");
                }}
                value={provider}
              >
                <SelectTrigger className="premium-input h-10 !w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="siliconflow">SiliconFlow</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field
              description={`A lista vem do ${providerName} via Supabase Edge Function.`}
              label="Buscar modelo"
            >
              <div className="premium-input flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border px-3">
                <Search className="size-4 text-muted-foreground" />
                <Input
                  className="h-auto w-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, provider ou id do modelo"
                  value={search}
                />
              </div>
            </Field>

            <Field label="Modelo de IA">
              <Select onValueChange={setModelId} value={modelId}>
                <SelectTrigger className="premium-input h-10 !w-full">
                  <SelectValue
                    placeholder={
                      isModelsFetching
                        ? "Carregando modelos..."
                        : "Selecione um modelo"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                        <span className="ml-2 text-muted-foreground text-xs">
                          {model.provider ? `· ${model.provider}` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <ModelListState
              error={modelsError}
              isLoading={isModelsFetching}
              models={filteredModels}
            />

            <div className="grid w-full gap-4">
              <Field
                description="0.7 para atendimento comercial equilibrado."
                label="Criatividade da resposta"
              >
                <Input
                  className="premium-input h-10 !w-full"
                  max="2"
                  min="0"
                  onChange={(event) => setTemperature(event.target.value)}
                  step="0.1"
                  type="number"
                  value={temperature}
                />
              </Field>

              <Field
                description="800 para atendimento rápido e objetivo."
                label="Máximo de tokens por resposta"
              >
                <Input
                  className="premium-input h-10 !w-full"
                  min="1"
                  onChange={(event) => setMaxOutputTokens(event.target.value)}
                  type="number"
                  value={maxOutputTokens}
                />
              </Field>

              <Field
                description="30 segundos."
                label="Tempo limite de resposta"
              >
                <Input
                  className="premium-input h-10 !w-full"
                  min="1"
                  onChange={(event) => setTimeoutSeconds(event.target.value)}
                  type="number"
                  value={timeoutSeconds}
                />
              </Field>
            </div>

            <div className="grid w-full gap-4">
              <ToggleCard
                checked={fallbackEnabled}
                description="Tenta um segundo modelo do Gateway antes de devolver falha segura."
                label="Fallback global"
                onCheckedChange={setFallbackEnabled}
              />
              <ToggleCard
                checked={isAutoTakeoverEnabled}
                description="A IA só assume quando a regra de timeout do Supabase permitir."
                label="IA assume por timeout"
                onCheckedChange={setAutoTakeoverEnabled}
              />
            </div>

            {fallbackEnabled ? (
              <Field label="Modelo fallback">
                <Select
                  onValueChange={setFallbackModelId}
                  value={fallbackModelId}
                >
                  <SelectTrigger className="premium-input h-10 !w-full">
                    <SelectValue placeholder="Selecione o modelo fallback" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}

            <Field
              description="Tempo antes da IA automática poder assumir uma sessão aguardando aceite."
              label="Timeout humano para IA assumir"
            >
              <Input
                className="premium-input h-10 !w-full"
                min="1"
                onChange={(event) =>
                  setHumanAcceptTimeoutSeconds(event.target.value)
                }
                type="number"
                value={humanAcceptTimeoutSeconds}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <InfoCard
          description="SiliconFlow usa secrets server-side separados no Supabase."
          icon={Sparkles}
          title="SiliconFlow"
        />
        <InfoCard
          description="A lista de modelos é carregada dinamicamente. Não há catálogo hardcoded como fonte final."
          icon={RefreshCcw}
          title="Dropdown dinâmico"
        />
        <InfoCard
          description="As IAs de venda e suporte dos produtos herdam o modelo global sem armazenar provider ou chave."
          icon={ShieldCheck}
          title="IAs de produto protegidas"
        />
      </div>
    </section>
  );
}

function getProviderName(_provider: AIProvider) {
  return "SiliconFlow";
}

function normalizeProvider(_provider?: string | null): AIProvider {
  return "siliconflow";
}

function Field({
  children,
  description,
  label,
}: {
  children: React.ReactNode;
  description?: string;
  label: string;
}) {
  return (
    <div className="grid w-full min-w-0 gap-2">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
      {description ? (
        <span className="text-muted-foreground text-xs">{description}</span>
      ) : null}
    </div>
  );
}

function ModelListState({
  error,
  isLoading,
  models,
}: {
  error: Error | null;
  isLoading: boolean;
  models: AIGatewayModel[];
}) {
  if (isLoading)
    return <StatusNote label="Carregando modelos do provedor..." />;
  if (error)
    return <StatusNote label="Não foi possível carregar os modelos." />;
  if (models.length === 0) {
    return <StatusNote label="Nenhum modelo encontrado para esta busca." />;
  }
  return <StatusNote label={`${models.length} modelos disponíveis.`} />;
}

function StatusNote({ label }: { label: string }) {
  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function ToggleCard({
  checked,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{label}</p>
          <p className="mt-1 text-muted-foreground text-xs">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function InfoCard({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/15 text-blue-100">
          <Icon className="size-4" />
        </span>
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="mt-3 text-muted-foreground text-xs">{description}</p>
    </article>
  );
}
