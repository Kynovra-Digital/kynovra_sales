"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Globe2,
  Save,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { AISettingsSection } from "@/components/settings/ai-settings-section";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getAiSettings } from "@/lib/supabase/queries/ai-settings";
import {
  getOrganizationSettings,
  saveOrganizationSettings,
} from "@/lib/supabase/queries/settings";
import { queryKeys } from "@/lib/supabase/query-keys";

export default function SettingsPage() {
  const { organization, profile } = useAuth();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState("America/Fortaleza");
  const [salesPublicEnabled, setSalesPublicEnabled] = useState(true);
  const [supportPublicEnabled, setSupportPublicEnabled] = useState(true);

  const { data: settings, isLoading } = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getOrganizationSettings(organizationId),
    queryKey: queryKeys.settings.general,
  });

  const { data: aiSettings } = useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => getAiSettings(organizationId),
    queryKey: queryKeys.aiSettings.global,
  });

  useEffect(() => {
    if (!settings) return;
    setTimezone(settings.timezone ?? "America/Fortaleza");
    setSalesPublicEnabled(settings.sales_public_enabled ?? true);
    setSupportPublicEnabled(settings.support_public_enabled ?? true);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return saveOrganizationSettings({
        organization_id: organizationId,
        sales_public_enabled: salesPublicEnabled,
        support_public_enabled: supportPublicEnabled,
        timezone,
      });
    },
    onError: () => {
      toast.error("Não foi possível salvar as configurações.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.settings.general,
      });
      toast.success("Configurações gerais salvas.");
    },
  });

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={
          <Button
            className="gap-2"
            disabled={saveMutation.isPending || !organizationId}
            onClick={() => saveMutation.mutate()}
            size="sm"
          >
            <Save data-icon="inline-start" />
            Salvar configurações
          </Button>
        }
        breadcrumbs={[{ label: "Admin" }, { label: "Configurações" }]}
        description="Centralize as regras da organização, IA, links públicos, atendimento, suporte, notificações e segurança."
        title="Configurações do SaaS"
      />

      {isLoading ? (
        <div className="data-panel p-4 text-muted-foreground text-sm">
          Carregando configurações do Supabase...
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-4">
          <SettingsSection
            description="Dados básicos usados por toda a operação."
            icon={Building2}
            title="Organização"
          >
            <ReadOnlyRow
              label="Nome da organização"
              value={organization?.name ?? "Organização não carregada"}
            />
            <Field
              description="Define a base de horários para dashboards, filas e auditoria."
              label="Fuso horário"
            >
              <Input
                className="premium-input h-10"
                onChange={(event) => setTimezone(event.target.value)}
                value={timezone}
              />
            </Field>
          </SettingsSection>

          <SettingsSection
            description="Controle dos links públicos de venda e suporte."
            icon={Globe2}
            title="Área pública"
          >
            <ToggleRow
              checked={salesPublicEnabled}
              description="Permite iniciar atendimento pelos links /a/[productSlug]."
              label="Links públicos de venda"
              onCheckedChange={setSalesPublicEnabled}
            />
            <ToggleRow
              checked={supportPublicEnabled}
              description="Permite iniciar suporte pelo link único /suporte."
              label="Link público de suporte"
              onCheckedChange={setSupportPublicEnabled}
            />
          </SettingsSection>

          <AISettingsSection />

          <SettingsSection
            description="Preferências que alimentam o sino da topbar."
            icon={Bell}
            title="Notificações"
          >
            <ReadOnlyRow
              label="Canal principal"
              value="Sino da topbar via Supabase Realtime"
            />
            <ReadOnlyRow
              label="Página de notificações"
              value="Desativada por regra de produto"
            />
          </SettingsSection>
        </div>

        <aside className="grid min-w-0 gap-4 content-start">
          <div className="data-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-sm">Status</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Resumo das configurações críticas.
                </p>
              </div>
              <Settings2 className="size-5 text-blue-200" />
            </div>
            <div className="mt-4 grid gap-2">
              <StatusLine
                label="Configuração geral"
                status={settings ? "Ativo" : "Pendente"}
              />
              <StatusLine
                label="Modelo de IA"
                status={aiSettings?.model_id ? "Ativo" : "Pendente"}
              />
              <StatusLine
                label="Links públicos"
                status={
                  salesPublicEnabled && supportPublicEnabled
                    ? "Ativo"
                    : "Requer revisão"
                }
              />
            </div>
          </div>

          <div className="data-panel p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-kynovra-digital-green/30 bg-kynovra-digital-green/10 text-kynovra-digital-green">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-sm">Segurança</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Chaves e regras críticas ficam no Supabase. O frontend só
                  consome RPCs, Edge Functions, Realtime e Storage.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SettingsSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <section className="data-panel min-w-0 overflow-hidden">
      <div className="flex items-start gap-3 border-white/10 border-b p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-blue-100">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-base">{title}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
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
    <div className="grid gap-2">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
      {description ? (
        <span className="text-muted-foreground text-xs">{description}</span>
      ) : null}
    </div>
  );
}

function ToggleRow({
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
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="mt-1 text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right">{value}</dd>
    </div>
  );
}

function StatusLine({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <StatusBadge label={status} />
    </div>
  );
}
