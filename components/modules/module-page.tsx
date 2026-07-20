"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle2,
  ChevronsUpDown,
  Edit3,
  ExternalLink,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { TeamGroupsPanel } from "@/components/modules/team-groups-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import {
  type ModuleRow,
  ResponsiveDataView,
} from "@/components/shared/responsive-data-view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  archiveCampaign,
  createCampaign,
  generateUniqueCampaignSlug,
  getCampaignConfiguration,
  updateCampaign,
} from "@/lib/supabase/queries/campaigns";
import { generateProductAIPrompt } from "@/lib/supabase/queries/hardness";
import {
  type KnowledgeBaseRow,
  listKnowledgeBases,
} from "@/lib/supabase/queries/knowledge-bases";
import {
  confirmCheckoutSale,
  deleteCheckoutEvent,
  deleteLead,
} from "@/lib/supabase/queries/leads";
import { listModuleRecords } from "@/lib/supabase/queries/modules";
import {
  archiveProduct,
  createProduct,
  generateUniqueProductCode,
  getProductAIConfiguration,
  listProductQualifications,
  listProducts,
  type ProductQualificationRow,
  saveProductAIConfiguration,
  updateProduct,
} from "@/lib/supabase/queries/products";
import { queryKeys } from "@/lib/supabase/query-keys";
import { uploadFileToBucket } from "@/lib/supabase/storage/upload-file";
import { getClientAppOrigin } from "@/lib/url/get-app-origin";
import {
  buildProductAttendanceLink,
  buildStorefrontLink,
} from "@/lib/url/public-links";
import type {
  ModuleConfig,
  ModuleKey,
  WizardField,
  WizardFormState,
  WizardStep,
} from "@/types/modules";

const productFieldHelp: Record<string, string> = {
  category: "Escolha o grupo comercial do produto. Exemplo: Eletrônicos.",
  "checkout-url":
    "Cole o link externo de checkout que o atendente poderá enviar ao cliente quando necessário.",
  "commission-margin":
    "Informe quanto a operação ganha por venda. Exemplo: 25,00.",
  difficulty:
    "Indique a dificuldade de venda para orientar a operação: fácil, médio ou difícil.",
  "discount-preview":
    "Resumo automático do preço original, preço com desconto e porcentagem removida.",
  "discount-type":
    "Ative para informar o preço final com desconto no card público.",
  "discount-value":
    "Informe o preço com desconto. O sistema calcula a porcentagem retirada a partir do preço fixo.",
  image:
    "Use imagem quadrada 1:1, recomendada 1200x1200 px, JPG/PNG/WebP até 2 MB.",
  images:
    "Use imagens quadradas 1:1, recomendadas em 1200x1200 px. A primeira imagem será a capa do produto.",
  name: "Nome comercial do produto. Exemplo: Mini Projetor YG300.",
  "public-benefits":
    "Liste os principais benefícios que o cliente deve perceber rapidamente.",
  "public-cta":
    "Texto de chamada para ação. Exemplo: Quero falar com um especialista.",
  "public-description":
    "Descrição pública mais completa para reforçar o valor do produto.",
  "public-headline":
    "Frase principal de venda. Exemplo: Atendimento rápido para finalizar sua compra.",
  price: "Preço de referência. Use apenas números. Exemplo: 199.90.",
  "sales-ai-enabled":
    "Ative para permitir IA automática/copiloto em atendimentos de venda deste produto.",
  "sales-display-name":
    "Nome que identifica a IA de venda. Exemplo: Especialista Kynovra.",
  "sales-initial-message":
    "Primeira mensagem da IA quando ela assumir o atendimento.",
  "sales-knowledge-base-ids":
    "Bases que a IA de venda e o copiloto usarão para criar respostas comerciais.",
  "sales-rules":
    "Regras de venda. Exemplo: não prometer desconto sem confirmação.",
  "sales-tone": "Tom da IA de venda. Exemplo: consultivo, direto e humano.",
  "short-description":
    "Resumo curto para listagens e cards. Exemplo: Projetor portátil para filmes e apresentações.",
  "show-price-publicly":
    "Ative se o preço pode aparecer antes do atendimento. Desative para revelar no chat.",
  "store-highlight":
    "Marque como destaque para colocar o produto na seção Produtos em destaque da loja.",
  status:
    "Define se o produto pode ser atendido. Ativo libera o link público; Pausa/Arquivado bloqueiam operação.",
  "stock-control-enabled":
    "Ative para controlar quantidade disponível e alertas de estoque mínimo.",
  "stock-minimum":
    "Quantidade mínima para alerta operacional. Exemplo: 5 unidades.",
  "stock-quantity": "Quantidade atual disponível para venda. Exemplo: 30.",
  "support-ai-enabled":
    "Ative para permitir IA automática/copiloto em suporte pós-venda usando as informações do produto.",
  "support-knowledge-base-ids":
    "Bases que a IA de suporte usará para resolver dúvidas, problemas e pós-venda.",
  warranty: "Informe a garantia comercial. Exemplo: 7 dias de garantia.",
};

function addProductFieldHelp(steps: WizardStep[]) {
  return steps.map((step) => ({
    ...step,
    fields: step.fields.map((field) => ({
      ...field,
      helperText: field.helperText ?? productFieldHelp[field.id],
    })),
  }));
}

const campaignFieldHelp: Record<string, string> = {
  banner:
    "Banner usado no slide principal da loja. Use proporção 12:5, recomendado 1920x800 px, JPG/PNG/WebP até 2 MB. O arquivo será enviado ao bucket campaign-banners.",
  description:
    "Resumo comercial da campanha para orientar a seção da loja, tracking e operação interna.",
  "ends-at":
    "Informe a data final somente quando a campanha tiver encerramento planejado.",
  headline:
    "Frase principal da campanha. Exemplo: Oferta especial para lançamentos do mês.",
  name: "Nome interno/comercial da campanha. O slug é gerado automaticamente a partir deste nome.",
  "product-ids":
    "Selecione os produtos reais do Supabase que aparecem nesta seção da loja.",
  "schedule-mode":
    "Escolha se a campanha fica contínua ou se possui uma data de encerramento.",
  "section-banner":
    "Banner usado dentro da seção da campanha na loja. Use proporção 2458x640 px, JPG/PNG/WebP até 2 MB.",
  "starts-at":
    "Data em que a campanha começa a operar ou aparecer na loja pública.",
  status:
    "Define a publicação operacional da campanha: rascunho, ativa, pausada, finalizada ou arquivada.",
};

function addCampaignFieldHelp(steps: WizardStep[]) {
  return steps.map((step) => ({
    ...step,
    fields: step.fields.map((field) => ({
      ...field,
      helperText: field.helperText ?? campaignFieldHelp[field.id],
    })),
  }));
}

const moduleConfigs: Record<ModuleKey, ModuleConfig> = {
  audit: {
    columns: ["Nome", "Ação", "Entidade", "Status", "Criado em"],
    createLabel: "Exportar auditoria",
    emptyText: "A auditoria será criada por RPCs, triggers e Edge Functions.",
    emptyTitle: "Nenhum log de auditoria registrado",
    key: "audit",
    subtitle: "Acompanhe eventos críticos e histórico operacional.",
    title: "Auditoria e Histórico",
  },
  campaigns: {
    columns: ["Nome", "Status", "Data de início", "Data final"],
    createLabel: "Nova Campanha",
    emptyText:
      "Crie campanhas para organizar seções da loja, produtos e tracking comercial.",
    emptyTitle: "Nenhuma campanha cadastrada ainda",
    key: "campaigns",
    subtitle: "Gerencie campanhas como seções da loja pública única.",
    title: "Campanhas",
  },
  inventory: {
    columns: ["Nome", "Produto", "Quantidade", "Tipo", "Criado em"],
    createLabel: "Ajustar estoque",
    emptyText: "Movimentações de estoque aparecerão aqui em tempo real.",
    emptyTitle: "Nenhuma movimentação de estoque",
    key: "inventory",
    subtitle: "Controle disponibilidade, alertas e movimentações.",
    title: "Estoque e Disponibilidade",
  },
  leads: {
    columns: ["Nome", "E-mail", "Origem", "Status", "Criado em"],
    createLabel: "Novo lead",
    emptyText: "Leads serão criados por links públicos, campanhas e salas.",
    emptyTitle: "Nenhum lead registrado ainda",
    key: "leads",
    subtitle: "Visualize leads, origem, produtos e registros comerciais.",
    title: "Leads e Registros",
  },
  products: {
    columns: [
      "Nome",
      "Status",
      "Categoria",
      "Preço",
      "Código",
      "Link de atendimento",
    ],
    createLabel: "Novo Produto",
    emptyText:
      "Crie seu primeiro produto e comece a montar links de atendimento, campanhas e suporte.",
    emptyTitle: "Nenhum produto cadastrado ainda",
    key: "products",
    subtitle: "Gerencie produtos, preços, estoque e links públicos.",
    title: "Produtos",
  },
  quality: {
    columns: ["Nome", "Status", "Criado em"],
    createLabel: "Exportar relatório",
    emptyText: "Avaliações e relatórios aparecerão após atendimentos reais.",
    emptyTitle: "Nenhum relatório de qualidade",
    key: "quality",
    subtitle: "Acompanhe qualidade, avaliações e pontos de melhoria.",
    title: "Relatórios de Qualidade",
  },
  settings: {
    columns: ["Nome", "Status", "Criado em"],
    createLabel: "Nova Configuração",
    emptyText: "As configurações da organização serão carregadas do Supabase.",
    emptyTitle: "Nenhuma configuração registrada",
    key: "settings",
    subtitle: "Configure regras da operação, mensagens e experiência pública.",
    title: "Configurações Gerais",
  },
  team: {
    columns: ["Nome", "Cargo", "Status", "Criado em"],
    createLabel: "Convidar membro",
    emptyText: "Convide membros e conecte grupos/permissões do Supabase.",
    emptyTitle: "Nenhum membro encontrado",
    key: "team",
    subtitle: "Gerencie membros, cargos, grupos e permissões.",
    title: "Equipe e Permissões",
  },
};

export function ModulePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = moduleConfigs[moduleKey];
  const {
    isLoading: isAuthLoading,
    organization,
    permissions,
    profile,
  } = useAuth();
  const queryClient = useQueryClient();
  const [origin, setOrigin] = useState("");
  const [selectedRow, setSelectedRow] = useState<ModuleRow | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState(0);
  const [formState, setFormState] = useState<WizardFormState>({});
  const [query, setQuery] = useState("");
  const { data: knowledgeBases = [] } = useQuery({
    enabled: moduleKey === "products",
    queryFn: () => listKnowledgeBases(),
    queryKey: ["knowledge-bases", "list"],
  });
  const { data: campaignProducts = [] } = useQuery({
    enabled: moduleKey === "campaigns",
    queryFn: () => listProducts(),
    queryKey: queryKeys.products.list,
  });
  const { data: productQualifications = [] } = useQuery({
    enabled: moduleKey === "products",
    queryFn: listProductQualifications,
    queryKey: queryKeys.products.qualification,
  });
  const wizardSteps = useMemo(
    () => getWizardSteps(moduleKey, knowledgeBases, campaignProducts),
    [campaignProducts, knowledgeBases, moduleKey],
  );
  const currentStep = wizardSteps[createStep] ?? wizardSteps[0];
  const isFirstStep = createStep === 0;
  const isLastStep = createStep === wizardSteps.length - 1;
  const canCreateRecords = ["campaigns", "products"].includes(moduleKey);
  const canManageTeam =
    permissions.includes("*") || permissions.includes("team.manage");
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const isOrganizationReady = Boolean(organizationId);
  const selectedProductQualification = useMemo(
    () =>
      moduleKey === "products" && selectedRow
        ? productQualifications.find(
            (item) => item.product.id === selectedRow.id,
          )
        : null,
    [moduleKey, productQualifications, selectedRow],
  );
  const createBaseDisabled =
    isAuthLoading || !isOrganizationReady || !canCreateRecords;
  const {
    data: rows = [],
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: () => listModuleRecords(moduleKey),
    queryKey: queryKeys.modules.record(moduleKey),
  });
  const {
    data: checkoutClicks = [],
    isFetching: isFetchingCheckoutClicks,
    refetch: refetchCheckoutClicks,
  } = useQuery({
    enabled: moduleKey === "leads",
    queryFn: () => listModuleRecords("checkout-clicks"),
    queryKey: queryKeys.checkoutEvents.clicks,
  });
  const normalizedRows = useMemo(
    () => rows.map((row) => normalizeRow(moduleKey, row)),
    [moduleKey, rows],
  );
  const filteredRows = useMemo(
    () =>
      normalizedRows.filter((row) =>
        row.name.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [normalizedRows, query],
  );
  const summaryCards = useMemo(
    () => buildSummaryCards(moduleKey, normalizedRows),
    [moduleKey, normalizedRows],
  );
  const normalizedCheckoutClicks = useMemo(
    () => checkoutClicks.map((row) => normalizeRow(moduleKey, row)),
    [moduleKey, checkoutClicks],
  );
  const filteredCheckoutClicks = useMemo(
    () =>
      normalizedCheckoutClicks.filter((row) =>
        row.name.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [normalizedCheckoutClicks, query],
  );

  useEffect(() => {
    setOrigin(getClientAppOrigin());
  }, []);

  async function copyPublicLink(
    link: string,
    successMessage = "Link copiado.",
  ) {
    await navigator.clipboard?.writeText(link);
    toast.success(successMessage);
  }

  function closeCreateDrawer() {
    setCreateOpen(false);
    setEditingCampaignId(null);
    setEditingProductId(null);
    setCreateStep(0);
    setFormState({});
  }

  function openCreateDrawer() {
    setEditingCampaignId(null);
    setEditingProductId(null);
    setCreateStep(0);
    setFormState(
      moduleKey === "products"
        ? {
            priority: "100",
            "sales-ai-enabled": true,
            "show-price-publicly": true,
            status: "active",
            "discount-type": "none",
            "discount-preview": "Sem desconto público configurado.",
            "store-highlight": "false",
            "support-ai-enabled": true,
          }
        : moduleKey === "campaigns"
          ? {
              status: "active",
              "schedule-mode": "continuous",
            }
          : {},
    );
    setCreateOpen(true);
  }

  async function openCampaignEditor(campaignId: string) {
    let configuration: Awaited<ReturnType<typeof getCampaignConfiguration>>;
    try {
      configuration = await getCampaignConfiguration(campaignId);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar a campanha.");
      return;
    }

    const campaign = configuration.campaign;

    setFormState({
      banner: undefined,
      description: campaign.description ?? "",
      "ends-at": toDateInputValue(campaign.ends_at),
      "existing-banner-url": campaign.banner_url ?? "",
      "existing-section-banner-url": campaign.section_banner_url ?? "",
      headline: campaign.headline ?? "",
      name: campaign.name,
      "product-ids": configuration.productIds.join(","),
      "schedule-mode": campaign.ends_at ? "limited" : "continuous",
      slug: campaign.slug,
      "starts-at": toDateInputValue(campaign.starts_at),
      status: campaign.status,
    });
    setEditingCampaignId(campaignId);
    setCreateStep(0);
    setSelectedRow(null);
    setCreateOpen(true);
  }

  async function openProductEditor(productId: string) {
    let configuration: Awaited<ReturnType<typeof getProductAIConfiguration>>;
    try {
      configuration = await getProductAIConfiguration(productId);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o Produto e suas IAs.");
      return;
    }
    const sales = configuration.agents.find(
      (agent) => agent.agent_type === "sales",
    );
    const support = configuration.agents.find(
      (agent) => agent.agent_type === "support",
    );
    const product = configuration.product;

    const productFormState = {
      category: product.category ?? "",
      "checkout-url": product.checkout_url ?? "",
      "commission-margin": product.commission_margin?.toString() ?? "",
      difficulty: product.difficulty ?? "",
      "discount-type": product.discount_type ?? "none",
      "discount-value": product.discount_value?.toString() ?? "",
      "existing-image-url": product.image_url ?? "",
      "existing-product-images": normalizeProductImageUrls(
        product.image_urls,
        product.image_url,
      ),
      name: product.name,
      price: product.price?.toString() ?? "",
      priority: product.priority.toString(),
      "product-type": product.product_type ?? "",
      "public-benefits": product.public_benefits ?? "",
      "public-cta": product.public_cta ?? "",
      "public-description": product.public_description ?? "",
      "public-headline": product.public_headline ?? "",
      "sales-ai-enabled": sales?.status === "active",
      "sales-display-name": sales?.display_name ?? "",
      "sales-initial-message": sales?.initial_message ?? "",
      "sales-knowledge-base-ids": configuration.salesKnowledgeBaseIds.join(","),
      "sales-rules": sales?.response_rules ?? "",
      "sales-tone": sales?.tone ?? "",
      slug: product.slug,
      "short-description": product.short_description ?? "",
      "show-price-publicly": product.show_price_publicly,
      status: product.status,
      "store-highlight": product.is_featured ? "true" : "false",
      "stock-control-enabled": product.stock_control_enabled,
      "stock-minimum": product.stock_minimum.toString(),
      "stock-quantity": product.stock_quantity.toString(),
      "support-ai-enabled": support?.status === "active",
      "support-info": product.support_info ?? "",
      "support-knowledge-base-ids":
        configuration.supportKnowledgeBaseIds.join(","),
      subcategory: product.subcategory ?? "",
      warranty: product.warranty ?? "",
    } satisfies WizardFormState;

    setFormState({
      ...productFormState,
      ...buildProductDiscountDerivedFields(productFormState),
    });
    setEditingProductId(productId);
    setCreateStep(0);
    setSelectedRow(null);
    setCreateOpen(true);
  }

  function updateFormField(
    id: string,
    value: boolean | File | File[] | string | string[],
  ) {
    setFormState((current) => ({
      ...current,
      [id]: value,
      ...(moduleKey === "campaigns" &&
      id === "name" &&
      typeof value === "string"
        ? { slug: slugify(value) }
        : {}),
      ...(moduleKey === "campaigns" &&
      id === "schedule-mode" &&
      value === "continuous"
        ? { "ends-at": "" }
        : {}),
      ...(moduleKey === "products"
        ? buildProductDiscountDerivedFields({ ...current, [id]: value })
        : {}),
    }));
  }

  function currentStepIsValid() {
    return currentStep.fields.every((field) => {
      if (!field.required) return true;
      const value = formState[field.id];
      if (typeof value === "string") return value.trim().length > 0;
      return Boolean(value);
    });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return createModuleRecord(
        moduleKey,
        formState,
        organizationId,
        editingCampaignId,
        editingProductId,
      );
    },
    onError: (error) => {
      console.error(error);
      if (
        error instanceof Error &&
        error.message === "Organização não carregada."
      ) {
        toast.error("Aguarde o carregamento da organização antes de salvar.");
        return;
      }

      toast.error(
        `Não foi possível salvar ${config.title.toLowerCase()}. Verifique os dados e tente novamente.`,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.modules.record(moduleKey),
      });

      if (moduleKey === "products") {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.products.list,
        });
      }

      if (moduleKey === "campaigns") {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.campaigns.list,
        });
      }

      toast.success(
        `${config.createLabel.replace(/^Nov[oa] /, "")} salvo com sucesso.`,
      );
      closeCreateDrawer();
    },
  });
  const archiveMutation = useMutation({
    mutationFn: async (row: ModuleRow) => {
      if (moduleKey === "products") {
        return archiveProduct(row.id);
      }

      if (moduleKey === "campaigns") {
        return archiveCampaign(row.id);
      }

      if (moduleKey === "leads") {
        return deleteLead(row.id);
      }

      throw new Error("Exclusão não configurada para este módulo.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível excluir o registro.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.modules.record(moduleKey),
      });
      toast.success("Registro excluído.");
      setSelectedRow(null);
    },
  });
  const productHighlightMutation = useMutation({
    mutationFn: async (input: { isFeatured: boolean; productId: string }) =>
      updateProduct(input.productId, { is_featured: input.isFeatured }),
    onError: (error) => {
      const message = resolveMutationErrorMessage(error);
      toast.error(
        message
          ? `Não foi possível atualizar o destaque do produto: ${message}`
          : "Não foi possível atualizar o destaque do produto. Verifique se a migration de destaque foi aplicada.",
      );
    },
    onSuccess: async (product) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.modules.record(moduleKey),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.list }),
      ]);
      setSelectedRow((current) =>
        current?.id === product.id
          ? {
              ...current,
              Destaque: product.is_featured
                ? "Produto em destaque"
                : "Não destaque",
            }
          : current,
      );
      toast.success(
        product.is_featured
          ? "Produto marcado como destaque."
          : "Produto removido dos destaques.",
      );
    },
  });
  const confirmCheckoutSaleMutation = useMutation({
    mutationFn: async (eventId: string) => confirmCheckoutSale(eventId),
    onError: (error) => {
      const message = resolveMutationErrorMessage(error);
      toast.error(
        message
          ? `Não foi possível confirmar a venda: ${message}`
          : "Não foi possível confirmar a venda.",
      );
    },
    onSuccess: async (response) => {
      if (!response?.success) {
        toast.error(
          response?.error
            ? `Não foi possível confirmar a venda: ${response.error}`
            : "Não foi possível confirmar a venda.",
        );
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.checkoutEvents.clicks,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.modules.record("products"),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview("today"),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview("7d"),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview("30d"),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview("month"),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.list }),
      ]);
      toast.success("Venda confirmada e registro removido da lista.");
    },
  });
  const deleteCheckoutEventMutation = useMutation({
    mutationFn: async (eventId: string) => deleteCheckoutEvent(eventId),
    onError: (error) => {
      const message = resolveMutationErrorMessage(error);
      toast.error(
        message
          ? `Não foi possível excluir o registro: ${message}`
          : "Não foi possível excluir o registro.",
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.checkoutEvents.clicks,
      });
      toast.success("Registro excluído.");
      setSelectedRow(null);
    },
  });
  const createDisabled = createBaseDisabled || createMutation.isPending;

  function renderCrudActions(row: ModuleRow) {
    if (moduleKey === "leads") {
      return (
        <Button
          className="gap-1"
          disabled={archiveMutation.isPending}
          onClick={() => archiveMutation.mutate(row)}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      );
    }

    if (!["campaigns", "products"].includes(moduleKey)) return null;

    return (
      <>
        <Button
          className="gap-1"
          onClick={() =>
            moduleKey === "products"
              ? void openProductEditor(row.id)
              : void openCampaignEditor(row.id)
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Edit3 className="size-3.5" />
          Editar
        </Button>
        <Button
          className="gap-1"
          disabled={archiveMutation.isPending}
          onClick={() => archiveMutation.mutate(row)}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      </>
    );
  }

  function renderCheckoutClickActions(row: ModuleRow) {
    return (
      <>
        <Button
          className="gap-1"
          disabled={confirmCheckoutSaleMutation.isPending}
          onClick={() => confirmCheckoutSaleMutation.mutate(row.id)}
          size="sm"
          type="button"
        >
          <CheckCircle2 className="size-3.5" />
          Compra realizada
        </Button>
        <Button
          className="gap-1"
          disabled={deleteCheckoutEventMutation.isPending}
          onClick={() => deleteCheckoutEventMutation.mutate(row.id)}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 className="size-3.5" />
          Excluir
        </Button>
      </>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            {moduleKey !== "leads" && (
              <Button
                className="gap-2"
                disabled={createDisabled}
                onClick={() => {
                  if (!canCreateRecords) {
                    toast.info(
                      "Este módulo ainda depende de uma mutation Supabase dedicada.",
                    );
                    return;
                  }

                  if (!isOrganizationReady) {
                    toast.error(
                      "Aguarde o carregamento da organização antes de criar registros.",
                    );
                    return;
                  }

                  openCreateDrawer();
                }}
                size="sm"
              >
                <Plus data-icon="inline-start" />
                {config.createLabel}
              </Button>
            )}
            <Button
              className="gap-2"
              disabled={isFetching || isFetchingCheckoutClicks}
              onClick={() => {
                queryClient.removeQueries({
                  queryKey: queryKeys.modules.record(moduleKey),
                });
                refetch();
                if (moduleKey === "leads") {
                  queryClient.removeQueries({
                    queryKey: queryKeys.checkoutEvents.clicks,
                  });
                  refetchCheckoutClicks();
                }
              }}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={
                  isFetching || isFetchingCheckoutClicks ? "animate-spin" : ""
                }
                data-icon="inline-start"
              />
              Atualizar
            </Button>
            <Button className="gap-2" size="sm" variant="outline">
              <SlidersHorizontal data-icon="inline-start" />
              Filtros
            </Button>
          </div>
        }
        breadcrumbs={[{ label: "Admin" }, { label: config.title }]}
        description={config.subtitle}
        title={config.title}
      />

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card, index) => (
          <MetricCard
            description={card.description}
            glow={index % 2 === 0 ? "blue" : "purple"}
            key={card.title}
            title={card.title}
            value={card.value}
          />
        ))}
      </div>

      {moduleKey === "team" ? (
        <Tabs className="min-w-0" defaultValue="members">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="teams">Equipe</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-3" value="members">
            <div className="data-panel overflow-hidden">
              <RecordsPanelContent
                config={config}
                createBaseDisabled={createBaseDisabled}
                createDisabled={createDisabled}
                filteredRows={filteredRows}
                isError={isError}
                isLoading={isLoading}
                isOrganizationReady={isOrganizationReady}
                moduleKey={moduleKey}
                onOpenCreate={openCreateDrawer}
                onOpenRow={setSelectedRow}
                query={query}
                renderCrudActions={renderCrudActions}
                setQuery={setQuery}
              />
            </div>
          </TabsContent>
          <TabsContent className="mt-3" value="teams">
            <TeamGroupsPanel
              canManageTeam={canManageTeam}
              organizationId={organizationId}
            />
          </TabsContent>
        </Tabs>
      ) : moduleKey === "leads" ? (
        <Tabs className="min-w-0" defaultValue="remarketing">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="remarketing">
              Leads para remarketing
            </TabsTrigger>
            <TabsTrigger value="checkout-clicks">
              Registros de checkout
            </TabsTrigger>
          </TabsList>
          <TabsContent className="mt-3" value="remarketing">
            <div className="data-panel overflow-hidden">
              <RecordsPanelContent
                config={config}
                createBaseDisabled={createBaseDisabled}
                createDisabled={createDisabled}
                filteredRows={filteredRows}
                isError={isError}
                isLoading={isLoading}
                isOrganizationReady={isOrganizationReady}
                moduleKey={moduleKey}
                onOpenCreate={openCreateDrawer}
                onOpenRow={setSelectedRow}
                query={query}
                renderCrudActions={renderCrudActions}
                setQuery={setQuery}
              />
            </div>
          </TabsContent>
          <TabsContent className="mt-3" value="checkout-clicks">
            <div className="data-panel overflow-hidden">
              <RecordsPanelContent
                config={{
                  ...config,
                  columns: ["Produto", "Evento", "Preço", "Criado em"],
                  createLabel: "Novo registro",
                }}
                createBaseDisabled={createBaseDisabled}
                createDisabled={createDisabled}
                filteredRows={filteredCheckoutClicks}
                isError={isError}
                isLoading={isLoading}
                isOrganizationReady={isOrganizationReady}
                moduleKey={moduleKey}
                onOpenCreate={openCreateDrawer}
                onOpenRow={setSelectedRow}
                query={query}
                renderCrudActions={renderCheckoutClickActions}
                setQuery={setQuery}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="data-panel overflow-hidden">
          <RecordsPanelContent
            config={config}
            createBaseDisabled={createBaseDisabled}
            createDisabled={createDisabled}
            filteredRows={filteredRows}
            isError={isError}
            isLoading={isLoading}
            isOrganizationReady={isOrganizationReady}
            moduleKey={moduleKey}
            onOpenCreate={openCreateDrawer}
            onOpenRow={setSelectedRow}
            query={query}
            renderCrudActions={renderCrudActions}
            setQuery={setQuery}
          />
        </div>
      )}

      <Sheet
        onOpenChange={(open) => !open && setSelectedRow(null)}
        open={Boolean(selectedRow)}
      >
        <SheetContent className="grid w-screen max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-xl xl:max-w-2xl">
          <SheetHeader className="border-white/10 border-b px-5 py-4">
            <SheetTitle>{selectedRow?.name}</SheetTitle>
            <SheetDescription>
              Dados reais carregados do Supabase para {config.title}.
            </SheetDescription>
          </SheetHeader>
          <div className="premium-scrollbar min-h-0 overflow-y-auto p-5">
            <div className="grid gap-3">
              {selectedRow
                ? Object.entries(selectedRow).map(([key, value]) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2"
                      key={key}
                    >
                      <p className="text-muted-foreground text-xs">{key}</p>
                      <p className="mt-1 break-words text-sm">
                        {String(value ?? "--")}
                      </p>
                    </div>
                  ))
                : null}
            </div>
            {moduleKey === "products" && selectedRow?.Código ? (
              <>
                <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-4">
                  <p className="font-medium text-sm">
                    Link público de atendimento
                  </p>
                  <p className="mt-2 break-all font-mono text-blue-100 text-xs">
                    {buildProductAttendanceLink(
                      origin,
                      String(selectedRow.Código),
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      disabled={archiveMutation.isPending}
                      onClick={() => archiveMutation.mutate(selectedRow)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </Button>
                    <Button
                      onClick={() =>
                        copyPublicLink(
                          buildProductAttendanceLink(
                            origin,
                            String(selectedRow.Código),
                          ),
                        )
                      }
                      size="sm"
                    >
                      Copiar link
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={buildProductAttendanceLink(
                          origin,
                          String(selectedRow.Código),
                        )}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink data-icon="inline-start" />
                        Abrir
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-kynovra-tech-purple/25 bg-kynovra-tech-purple/10 p-4">
                  <p className="font-medium text-sm">Destaque da loja</p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    Controle se este produto aparece na seção Produtos em
                    destaque da loja pública.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">
                      {String(selectedRow.Destaque ?? "Não destaque")}
                    </span>
                    <Button
                      disabled={productHighlightMutation.isPending}
                      onClick={() =>
                        productHighlightMutation.mutate({
                          isFeatured:
                            selectedRow.Destaque !== "Produto em destaque",
                          productId: selectedRow.id,
                        })
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Star className="size-3.5" />
                      {selectedRow.Destaque === "Produto em destaque"
                        ? "Remover destaque"
                        : "Produto em destaque"}
                    </Button>
                  </div>
                </div>
                <ProductCommentsPanel
                  qualification={selectedProductQualification}
                />
              </>
            ) : null}
            {moduleKey === "campaigns" && selectedRow ? (
              <div className="mt-4 rounded-xl border border-kynovra-tech-purple/25 bg-kynovra-tech-purple/10 p-4">
                <p className="font-medium text-sm">Seção da loja pública</p>
                <p className="mt-2 text-muted-foreground text-xs">
                  Campanhas ativas aparecem como seções no link único da loja.
                </p>
                <p className="mt-3 break-all font-mono text-blue-100 text-xs">
                  {buildStorefrontLink(origin)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => void openCampaignEditor(selectedRow.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit3 className="size-3.5" />
                    Editar campanha
                  </Button>
                  <Button
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate(selectedRow)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Excluir
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildStorefrontLink(origin)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink data-icon="inline-start" />
                      Abrir loja
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet onOpenChange={setCreateOpen} open={isCreateOpen}>
        <SheetContent className="grid w-screen max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl xl:max-w-2xl">
          <SheetHeader className="border-white/10 border-b px-5 py-4">
            <SheetTitle>
              {editingCampaignId
                ? "Editar Campanha"
                : editingProductId
                  ? "Editar Produto"
                  : config.createLabel}
            </SheetTitle>
            <SheetDescription>
              Etapa {createStep + 1} de {wizardSteps.length}:{" "}
              {currentStep.title}
            </SheetDescription>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-kynovra-tech-purple"
                style={{
                  width: `${((createStep + 1) / wizardSteps.length) * 100}%`,
                }}
              />
            </div>
          </SheetHeader>
          <div className="premium-scrollbar min-h-0 overflow-y-auto p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-sm">{currentStep.title}</h3>
              {currentStep.description ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  {currentStep.description}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4">
              {currentStep.fields.map((field) => (
                <WizardFieldControl
                  field={field}
                  key={field.id}
                  onChange={updateFormField}
                  formState={formState}
                  value={formState[field.id]}
                />
              ))}
            </div>
          </div>
          <SheetFooter className="flex-row justify-between border-white/10 border-t p-4">
            <Button onClick={closeCreateDrawer} type="button" variant="outline">
              Cancelar
            </Button>
            <div className="flex gap-2">
              {!isFirstStep ? (
                <Button
                  onClick={() => setCreateStep((step) => Math.max(step - 1, 0))}
                  type="button"
                  variant="outline"
                >
                  Voltar
                </Button>
              ) : null}
              <Button
                onClick={() => {
                  if (!currentStepIsValid()) {
                    toast.error("Preencha os campos obrigatórios desta etapa.");
                    return;
                  }

                  if (isLastStep) {
                    if (!isOrganizationReady) {
                      toast.error(
                        "Aguarde o carregamento da organização antes de salvar.",
                      );
                      return;
                    }

                    createMutation.mutate();
                    return;
                  }
                  setCreateStep((step) =>
                    Math.min(step + 1, wizardSteps.length - 1),
                  );
                }}
                disabled={createMutation.isPending || !isOrganizationReady}
                type="button"
              >
                {isLastStep
                  ? createMutation.isPending
                    ? "Salvando..."
                    : "Concluir"
                  : "Próximo"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RecordsPanelContent({
  config,
  createDisabled,
  filteredRows,
  isError,
  isLoading,
  isOrganizationReady,
  moduleKey,
  onOpenCreate,
  onOpenRow,
  query,
  renderCrudActions,
  setQuery,
}: {
  config: ModuleConfig;
  createBaseDisabled: boolean;
  createDisabled: boolean;
  filteredRows: ModuleRow[];
  isError: boolean;
  isLoading: boolean;
  isOrganizationReady: boolean;
  moduleKey: ModuleKey;
  onOpenCreate: () => void;
  onOpenRow: (row: ModuleRow) => void;
  query: string;
  renderCrudActions: (row: ModuleRow) => ReactNode;
  setQuery: (value: string) => void;
}) {
  const canCreateRecords = ["campaigns", "products"].includes(moduleKey);

  function handleCreateClick() {
    if (!canCreateRecords) {
      toast.info(
        "Este módulo ainda depende de uma mutation Supabase dedicada.",
      );
      return;
    }

    if (!isOrganizationReady) {
      toast.error(
        "Aguarde o carregamento da organização antes de criar registros.",
      );
      return;
    }

    onOpenCreate();
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-white/10 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-base">Lista operacional</h2>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            Dados carregados do Supabase. Ações críticas devem chamar RPC ou
            Edge Functions.
          </p>
        </div>
        <div className="flex flex-1 flex-wrap items-end gap-2 xl:max-w-xl">
          <div className="min-w-0 flex-1 space-y-2">
            <label
              className="text-muted-foreground text-xs font-medium"
              htmlFor={`${moduleKey}-search`}
            >
              Buscar registros
            </label>
            <div className="premium-input flex h-9 min-w-0 items-center gap-2 rounded-lg border px-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                id={`${moduleKey}-search`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, status ou identificador..."
                value={query}
              />
            </div>
          </div>
          <Button className="gap-2" size="sm" variant="outline">
            <BarChart3 data-icon="inline-start" />
            Resumo
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="p-4 text-muted-foreground text-sm">
          Carregando dados do Supabase...
        </div>
      ) : isError ? (
        <div className="p-4 text-destructive text-sm">
          Não foi possível carregar este módulo. Verifique sessão, RLS e conexão
          Supabase.
        </div>
      ) : filteredRows.length ? (
        <ResponsiveDataView
          columns={config.columns}
          onOpen={onOpenRow}
          renderActions={renderCrudActions}
          rows={filteredRows}
        />
      ) : (
        <div className="p-4">
          <EmptyState
            action={
              canCreateRecords ? (
                <Button disabled={createDisabled} onClick={handleCreateClick}>
                  {config.createLabel}
                </Button>
              ) : null
            }
            description={config.emptyText}
            title={config.emptyTitle}
          />
        </div>
      )}
    </>
  );
}

function WizardFieldControl({
  field,
  formState,
  onChange,
  value,
}: {
  field: WizardField;
  formState: WizardFormState;
  onChange: (
    id: string,
    value: boolean | File | File[] | string | string[],
  ) => void;
  value: boolean | File | File[] | string | string[] | undefined;
}) {
  const disabled = field.disabledWhen?.(formState) ?? false;
  const hidden = field.hiddenWhen?.(formState) ?? false;
  const helpText = field.helperText;

  if (hidden) return null;

  if (field.options && field.selection) {
    return (
      <OptionPicker
        disabled={disabled}
        field={field}
        onChange={(nextValue) => onChange(field.id, nextValue)}
        value={typeof value === "string" ? value : ""}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label
          className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium"
          htmlFor={field.id}
        >
          {field.label}
          <FieldHelpIcon text={helpText} />
        </label>
        <Textarea
          className="min-h-32 resize-y"
          disabled={disabled}
          id={field.id}
          onChange={(event) => onChange(field.id, event.target.value)}
          placeholder={
            field.readOnly
              ? "Somente leitura"
              : (field.placeholder ?? field.label)
          }
          readOnly={field.readOnly}
          value={typeof value === "string" ? value : ""}
        />
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label
        className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm"
        htmlFor={field.id}
      >
        <Checkbox
          checked={Boolean(value)}
          id={field.id}
          onCheckedChange={(checked) => onChange(field.id, checked === true)}
        />
        <span>
          <span className="flex items-center gap-1.5 font-medium">
            {field.label}
            <FieldHelpIcon text={helpText} />
          </span>
        </span>
      </label>
    );
  }

  if (field.type === "file") {
    return (
      <div className="space-y-2">
        <label
          className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium"
          htmlFor={field.id}
        >
          {field.label}
          <FieldHelpIcon text={helpText} />
        </label>
        <Input
          accept="image/*"
          disabled={disabled}
          id={field.id}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(field.id, file);
          }}
          type="file"
        />
        <ImageUploadPreview
          existingUrl={getExistingPreviewUrl(field, formState)}
          file={value instanceof File ? value : null}
          ratio={field.previewRatio ?? "4:3"}
        />
      </div>
    );
  }

  if (field.type === "multi-image") {
    const files = Array.isArray(value)
      ? value.filter((item): item is File => item instanceof File)
      : [];
    const existingImages = getExistingProductImages(formState);

    return (
      <ProductGalleryInput
        disabled={disabled}
        existingImages={existingImages}
        field={field}
        files={files}
        onExistingImagesChange={(nextImages) =>
          onChange("existing-product-images", nextImages)
        }
        onChange={(nextFiles) => onChange(field.id, nextFiles)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <label
        className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium"
        htmlFor={field.id}
      >
        {field.label}
        <FieldHelpIcon text={helpText} />
      </label>
      <Input
        disabled={disabled}
        id={field.id}
        onChange={(event) => onChange(field.id, event.target.value)}
        placeholder={field.readOnly ? "Somente leitura" : field.label}
        readOnly={field.readOnly}
        type={
          field.type === "date" || field.type === "number" ? field.type : "text"
        }
        value={typeof value === "string" ? value : ""}
      />
    </div>
  );
}

function FieldHelpIcon({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    placement: "bottom" | "top";
    top: number;
  }>({ left: 0, placement: "top", top: 0 });

  if (!text) return null;

  function showHelp(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const shouldOpenBelow = rect.top < 120;

    setPosition({
      left: rect.left + rect.width / 2,
      placement: shouldOpenBelow ? "bottom" : "top",
      top: shouldOpenBelow ? rect.bottom + 8 : rect.top - 8,
    });
    setOpen(true);
  }

  const tooltip =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            className="pointer-events-none fixed z-[99999] w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 p-3 text-left text-xs font-normal leading-relaxed text-slate-100 opacity-100 shadow-2xl shadow-black/40 backdrop-blur-md"
            style={{
              left: position.left,
              top: position.top,
              transform:
                position.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
            }}
          >
            {text}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-label="Mostrar ajuda do campo"
        className="inline-flex size-4 cursor-help items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/15 text-[10px] font-black text-blue-100 transition hover:border-blue-300/70 hover:bg-blue-500/25"
        onBlur={() => setOpen(false)}
        onClick={(event) => event.preventDefault()}
        onFocus={(event) => showHelp(event.currentTarget)}
        onMouseDown={(event) => event.preventDefault()}
        onPointerEnter={(event) => showHelp(event.currentTarget)}
        onPointerLeave={() => setOpen(false)}
        type="button"
      >
        !
      </button>
      {tooltip}
    </>
  );
}

function ImageUploadPreview({
  existingUrl,
  file,
  ratio = "4:3",
}: {
  existingUrl?: string;
  file: File | null;
  ratio?: "12:5" | "2458:640" | "4:3";
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const imageUrl = previewUrl || existingUrl || "";
  const isBanner = ratio === "12:5" || ratio === "2458:640";
  const isSectionBanner = ratio === "2458:640";

  if (!imageUrl) {
    return (
      <div className="flex min-h-28 items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-3 text-muted-foreground text-xs">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]">
          <ImageIcon className="size-5" />
        </span>
        <div>
          <p className="font-medium text-foreground">
            {isBanner ? "Preview do banner" : "Preview da imagem"}
          </p>
          <p className="mt-1">
            {isBanner
              ? isSectionBanner
                ? "Selecione um banner para visualizar o formato 2458x640 usado na seção da campanha."
                : "Selecione um banner para visualizar o recorte 12:5 usado no slider da loja."
              : "Selecione uma imagem para visualizar como ela ficará no produto."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="mb-2 text-muted-foreground text-xs font-medium">
        {previewUrl
          ? isBanner
            ? "Preview do banner selecionado"
            : "Preview da imagem selecionada"
          : isBanner
            ? "Banner atual"
            : "Imagem atual"}
      </p>
      <div
        className={`relative overflow-hidden rounded-lg border border-white/10 bg-black/20 ${isSectionBanner ? "aspect-[1229/320]" : isBanner ? "aspect-[12/5]" : "aspect-[4/3]"}`}
      >
        <Image
          alt={
            isBanner ? "Preview do banner da campanha" : "Preview do produto"
          }
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 520px"
          src={imageUrl}
          unoptimized
        />
      </div>
      <p className="mt-2 text-muted-foreground text-xs">
        {isBanner
          ? isSectionBanner
            ? "Prévia em proporção 2458x640, igual ao banner da seção da campanha na loja."
            : "Prévia em proporção 12:5, igual ao recorte recomendado para o slider de campanhas da loja."
          : "Prévia em proporção 1:1, igual ao recorte usado nos cards do produto."}
      </p>
    </div>
  );
}

function ProductCommentsPanel({
  qualification,
}: {
  qualification: ProductQualificationRow | null | undefined;
}) {
  const comments = qualification?.comments ?? [];

  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm text-white">
            Comentários dos clientes
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            Avaliações reais vinculadas aos atendimentos deste produto.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-blue-100 text-xs">
          <Star className="size-3.5 fill-current" />
          {qualification?.averageRating
            ? qualification.averageRating.toFixed(1)
            : "Sem nota"}
          <span className="text-muted-foreground">
            · {qualification?.reviewCount ?? 0} avaliação
            {(qualification?.reviewCount ?? 0) === 1 ? "" : "ões"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col divide-y divide-white/10">
        {comments.length ? (
          comments.map((comment) => (
            <article className="min-w-0 py-4 first:pt-0" key={comment.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <RatingStars rating={comment.rating ?? 0} />
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-muted-foreground text-xs">
                  {comment.sessionType === "support" ? "Suporte" : "Venda"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatProductCommentDate(comment.createdAt)}
                </span>
              </div>
              <p className="break-words font-medium text-sm text-white leading-6">
                {comment.comment}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-4 text-muted-foreground text-sm">
            Este produto ainda não possui comentário textual. As notas
            aparecerão aqui quando clientes avaliarem o atendimento.
          </div>
        )}
      </div>
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;

        return (
          <Star
            className={`size-3.5 ${star <= Math.round(rating) ? "fill-current" : "fill-transparent"}`}
            key={`product-comment-star-${star}`}
          />
        );
      })}
    </span>
  );
}

function formatProductCommentDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function ProductGalleryInput({
  disabled,
  existingImages,
  field,
  files,
  onExistingImagesChange,
  onChange,
}: {
  disabled?: boolean;
  existingImages: string[];
  field: WizardField;
  files: File[];
  onExistingImagesChange: (images: string[]) => void;
  onChange: (files: File[]) => void;
}) {
  const maxFiles = field.maxFiles ?? 5;
  const allImages = [
    ...files.map((file, index) => ({
      file,
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      kind: "file" as const,
      sourceIndex: index,
    })),
    ...existingImages
      .slice(0, Math.max(maxFiles - files.length, 0))
      .map((imageUrl) => ({
        id: imageUrl,
        imageUrl,
        kind: "existing" as const,
        sourceIndex: -1,
      })),
  ].slice(0, maxFiles);
  const thumbnails = Array.from({ length: maxFiles }, (_, index) => ({
    image: allImages[index] ?? null,
    slot: index,
  }));

  function addFiles(fileList: FileList | null) {
    if (!fileList || disabled) return;
    const incomingFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    const nextFiles = [...files, ...incomingFiles].slice(0, maxFiles);

    if (files.length + incomingFiles.length > maxFiles) {
      toast.warning(`Você pode selecionar no máximo ${maxFiles} imagens.`);
    }

    onChange(nextFiles);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  }

  function removeExistingImage(imageUrl: string) {
    onExistingImagesChange(existingImages.filter((url) => url !== imageUrl));
  }

  function removeGalleryImage(image: (typeof allImages)[number]) {
    if (image.kind === "file") {
      removeFile(image.sourceIndex);
      return;
    }

    if (image.imageUrl) {
      removeExistingImage(image.imageUrl);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label
          className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium"
          htmlFor={field.id}
        >
          {field.label}
          <FieldHelpIcon text={field.helperText} />
        </label>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-muted-foreground text-[11px]">
          {files.length || existingImages.length
            ? Math.min(files.length || existingImages.length, maxFiles)
            : 0}
          /{maxFiles} imagens
        </span>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Selecione até {maxFiles} imagens quadradas 1:1. A primeira será usada
        como capa nos cards públicos da loja.
      </p>
      <input
        accept="image/*"
        className="sr-only"
        disabled={disabled || files.length >= maxFiles}
        id={field.id}
        multiple
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
        type="file"
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div className="mx-auto grid max-w-[360px] grid-cols-4 gap-2.5">
          {thumbnails.map((thumbnail) =>
            thumbnail.image ? (
              <div
                className="relative aspect-square overflow-hidden rounded-md border border-white/15 bg-black/20"
                key={thumbnail.image.id}
              >
                <ProductGalleryImage
                  image={thumbnail.image}
                  priority={thumbnail.slot === 0}
                />
                <button
                  aria-label={`Remover imagem ${thumbnail.slot + 1}`}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-500"
                  onClick={() => removeGalleryImage(thumbnail.image)}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                className="flex aspect-square cursor-pointer items-center justify-center rounded-md border border-white/15 bg-white/[0.025] text-slate-500 transition hover:border-blue-400/50 hover:text-blue-300"
                htmlFor={field.id}
                key={`empty-image-slot-${thumbnail.slot + 1}`}
              >
                <Plus className="size-5 stroke-[1.5]" />
              </label>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGalleryImage({
  image,
  priority = false,
}: {
  image: {
    file?: File;
    imageUrl?: string;
    kind: "existing" | "file";
    sourceIndex: number;
  };
  priority?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!image.file) {
      setPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(image.file);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [image.file]);

  const source = previewUrl || image.imageUrl || "";

  if (!source) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <ImageIcon className="size-6" />
      </div>
    );
  }

  return (
    <Image
      alt="Imagem do produto"
      className="object-cover"
      fill
      priority={priority}
      sizes={priority ? "(max-width: 768px) 90vw, 360px" : "96px"}
      src={source}
      unoptimized
    />
  );
}

function OptionPicker({
  disabled,
  field,
  onChange,
  value,
}: {
  disabled?: boolean;
  field: WizardField;
  onChange: (value: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedValues = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedOptions =
    field.options?.filter((option) => selectedValues.includes(option.value)) ??
    [];
  const multiple = field.selection === "multiple";

  function selectOption(optionValue: string) {
    if (!multiple) {
      onChange(optionValue);
      setOpen(false);
      return;
    }
    const next = selectedValues.includes(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];
    onChange(next.join(","));
  }

  return (
    <div className="grid gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
        {field.label}
        <FieldHelpIcon text={field.helperText} />
      </span>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className="h-auto min-h-10 justify-between whitespace-normal text-left"
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <span className="line-clamp-2">
              {selectedOptions.length
                ? selectedOptions.map((option) => option.label).join(", ")
                : `Selecionar ${field.label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(92vw,520px)] p-0">
          <Command>
            <CommandInput
              placeholder={`Buscar ${field.label.toLowerCase()}...`}
            />
            <CommandList>
              <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
              <CommandGroup>
                {(field.options ?? []).map((option) => (
                  <CommandItem
                    data-checked={selectedValues.includes(option.value)}
                    key={option.value}
                    onSelect={() => selectOption(option.value)}
                    value={`${option.label} ${option.description ?? ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.description ? (
                        <span className="block truncate text-muted-foreground text-xs">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {multiple && selectedValues.length ? (
              <div className="border-white/10 border-t p-2">
                <Button
                  className="w-full"
                  onClick={() => onChange("")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Limpar seleção
                </Button>
              </div>
            ) : null}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

async function createModuleRecord(
  moduleKey: ModuleKey,
  formState: WizardFormState,
  organizationId: string,
  editingCampaignId: string | null,
  editingProductId: string | null,
) {
  if (moduleKey === "products") {
    const name = stringValue(formState.name);
    const productCode =
      editingProductId && stringValue(formState.slug)
        ? stringValue(formState.slug)
        : await generateUniqueProductCode({
            excludeProductId: editingProductId,
            organizationId,
          });
    const imageFiles = Array.isArray(formState.images)
      ? formState.images.filter((item): item is File => item instanceof File)
      : [];
    const existingImageUrls = getExistingProductImages(formState);
    const uploadedImages = imageFiles.length
      ? await Promise.all(
          imageFiles.slice(0, 5).map((file, index) =>
            uploadFileToBucket({
              bucket: "product-images",
              file,
              fileNamePrefix: `${productCode}-${index + 1}`,
              folder: organizationId,
            }),
          ),
        )
      : [];
    const productImageUrls = normalizeProductImageUrls(
      uploadedImages.length
        ? uploadedImages.map((uploadedImage) => uploadedImage.publicUrl)
        : existingImageUrls,
      nullableString(formState["existing-image-url"]),
    );

    const productValues = {
      category: nullableString(formState.category),
      checkout_url: nullableString(formState["checkout-url"]),
      commission_margin: nullableNumber(formState["commission-margin"]),
      difficulty: nullableString(formState.difficulty),
      discount_type: stringValue(formState["discount-type"]) || "none",
      discount_value:
        stringValue(formState["discount-type"]) === "none"
          ? null
          : nullableNumber(formState["discount-value"]),
      image_url: productImageUrls[0] ?? null,
      image_urls: productImageUrls,
      is_featured: stringValue(formState["store-highlight"]) === "true",
      main_benefit: nullableString(formState["public-benefits"]),
      name,
      organization_id: organizationId,
      price: nullableNumber(formState.price),
      priority: nullableInteger(formState.priority) ?? 100,
      product_type: nullableString(formState["product-type"]),
      public_benefits: nullableString(formState["public-benefits"]),
      public_cta: nullableString(formState["public-cta"]),
      public_description: nullableString(formState["public-description"]),
      public_headline: nullableString(formState["public-headline"]),
      short_description: nullableString(formState["short-description"]),
      show_price_publicly: Boolean(formState["show-price-publicly"]),
      slug: productCode,
      stock_control_enabled: Boolean(formState["stock-control-enabled"]),
      stock_minimum: nullableInteger(formState["stock-minimum"]) ?? 0,
      stock_quantity: nullableInteger(formState["stock-quantity"]) ?? 0,
      status: stringValue(formState.status) || "active",
      subcategory: nullableString(formState.subcategory),
      support_info: nullableString(formState["support-info"]),
      warranty: nullableString(formState.warranty),
    };
    const product = editingProductId
      ? await updateProduct(editingProductId, productValues)
      : await createProduct(productValues);

    const parseTools = (value: WizardFormState[string]) =>
      stringValue(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const effectiveSalesTools = salesHarnessToolValues;
    const effectiveSupportTools = supportHarnessToolValues;
    const salesKnowledgeBaseIds = parseTools(
      formState["sales-knowledge-base-ids"],
    );
    const supportKnowledgeBaseIds = parseTools(
      formState["support-knowledge-base-ids"],
    );
    const knowledgeBaseIds = [
      ...new Set([...salesKnowledgeBaseIds, ...supportKnowledgeBaseIds]),
    ];
    const salesEnabled = Boolean(formState["sales-ai-enabled"]);
    const supportEnabled = Boolean(formState["support-ai-enabled"]);

    await saveProductAIConfiguration({
      knowledgeBaseIds,
      organizationId,
      productId: product.id,
      sales: {
        display_name: stringValue(formState["sales-display-name"]),
        enabled: salesEnabled,
        enabled_tools: effectiveSalesTools,
        fallback_message: "",
        initial_message: stringValue(formState["sales-initial-message"]),
        knowledge_base_ids: salesKnowledgeBaseIds,
        prompt: "",
        rules: stringValue(formState["sales-rules"]),
        tone: stringValue(formState["sales-tone"]),
        tool_permissions: Object.fromEntries(
          effectiveSalesTools.map((tool) => [tool, true]),
        ),
      },
      support: {
        display_name: "",
        enabled: supportEnabled,
        enabled_tools: effectiveSupportTools,
        fallback_message: "",
        initial_message: "",
        knowledge_base_ids: supportKnowledgeBaseIds,
        prompt: "",
        rules: "",
        tone: "",
        tool_permissions: Object.fromEntries(
          effectiveSupportTools.map((tool) => [tool, true]),
        ),
      },
    });

    const [generatedSalesPrompt, generatedSupportPrompt] = await Promise.all([
      salesEnabled
        ? generateProductAIPrompt({
            mode: "sales",
            organizationId,
            productId: product.id,
          })
        : Promise.resolve(""),
      supportEnabled
        ? generateProductAIPrompt({
            mode: "support",
            organizationId,
            productId: product.id,
          })
        : Promise.resolve(""),
    ]);

    if (salesEnabled || supportEnabled) {
      await saveProductAIConfiguration({
        knowledgeBaseIds,
        organizationId,
        productId: product.id,
        sales: {
          display_name: stringValue(formState["sales-display-name"]),
          enabled: salesEnabled,
          enabled_tools: effectiveSalesTools,
          fallback_message: "",
          initial_message: stringValue(formState["sales-initial-message"]),
          knowledge_base_ids: salesKnowledgeBaseIds,
          prompt: generatedSalesPrompt,
          rules: stringValue(formState["sales-rules"]),
          tone: stringValue(formState["sales-tone"]),
          tool_permissions: Object.fromEntries(
            effectiveSalesTools.map((tool) => [tool, true]),
          ),
        },
        support: {
          display_name: "",
          enabled: supportEnabled,
          enabled_tools: effectiveSupportTools,
          fallback_message: "",
          initial_message: "",
          knowledge_base_ids: supportKnowledgeBaseIds,
          prompt: generatedSupportPrompt,
          rules: "",
          tone: "",
          tool_permissions: Object.fromEntries(
            effectiveSupportTools.map((tool) => [tool, true]),
          ),
        },
      });
    }

    return product;
  }

  if (moduleKey === "campaigns") {
    const name = stringValue(formState.name);
    const slug = (await generateUniqueCampaignSlug({
      excludeCampaignId: editingCampaignId,
      name,
      organizationId,
    })) as string;
    const bannerFile =
      formState.banner instanceof File ? formState.banner : null;
    const uploaded = bannerFile
      ? await uploadFileToBucket({
          bucket: "campaign-banners",
          file: bannerFile,
          fileNamePrefix: slug,
          folder: organizationId,
        })
      : null;
    const sectionBannerFile =
      formState["section-banner"] instanceof File
        ? formState["section-banner"]
        : null;
    const uploadedSectionBanner = sectionBannerFile
      ? await uploadFileToBucket({
          bucket: "campaign-banners",
          file: sectionBannerFile,
          fileNamePrefix: `${slug}-section`,
          folder: organizationId,
        })
      : null;
    const productIds = stringValue(formState["product-ids"])
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const campaignValues = {
      banner_url:
        uploaded?.publicUrl ?? nullableString(formState["existing-banner-url"]),
      description: nullableString(formState.description),
      ends_at:
        stringValue(formState["schedule-mode"]) === "limited"
          ? nullableDate(formState["ends-at"])
          : null,
      headline: nullableString(formState.headline),
      name,
      organization_id: organizationId,
      section_banner_url:
        uploadedSectionBanner?.publicUrl ??
        nullableString(formState["existing-section-banner-url"]),
      slug,
      starts_at: nullableDate(formState["starts-at"]),
      status: stringValue(formState.status) || "active",
    };

    return editingCampaignId
      ? updateCampaign(editingCampaignId, campaignValues, productIds)
      : createCampaign(
          {
            ...campaignValues,
            banner_url: campaignValues.banner_url ?? null,
            section_banner_url: campaignValues.section_banner_url ?? null,
          },
          productIds,
        );
  }

  throw new Error(
    "Este módulo ainda não possui mutation Supabase configurada.",
  );
}

function stringValue(value: WizardFormState[string]) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: WizardFormState[string]) {
  const normalized = stringValue(value);
  return normalized.length > 0 ? normalized : null;
}

function nullableNumber(value: WizardFormState[string]) {
  const normalized = stringValue(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableInteger(value: WizardFormState[string]) {
  const parsed = nullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function resolveMutationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const possibleMessage = "message" in error ? error.message : null;
    if (typeof possibleMessage === "string" && possibleMessage.trim()) {
      return possibleMessage;
    }
  }

  return "";
}

function buildProductDiscountDerivedFields(formState: WizardFormState) {
  const price = nullableNumber(formState.price);
  const discountType = stringValue(formState["discount-type"]);
  const discountValue = nullableNumber(formState["discount-value"]);

  if (!price || discountType !== "final_price" || !discountValue) {
    return { "discount-preview": "Sem desconto público configurado." };
  }

  const finalPrice = Math.min(Math.max(discountValue, 0), price);
  const discountAmount = price - finalPrice;
  const percentOff = price > 0 ? (discountAmount / price) * 100 : 0;

  return {
    "discount-preview": `Preço total: ${formatCurrency(price)} · Com desconto: ${formatCurrency(finalPrice)} · Retirado: ${percentOff.toFixed(0)}%`,
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  });
}

function nullableDate(value: WizardFormState[string]) {
  const normalized = stringValue(value);
  return normalized ? new Date(`${normalized}T00:00:00`).toISOString() : null;
}

function getExistingPreviewUrl(field: WizardField, formState: WizardFormState) {
  const previewKey =
    field.id === "section-banner"
      ? "existing-section-banner-url"
      : field.id === "banner"
        ? "existing-banner-url"
        : "existing-image-url";
  const value = formState[previewKey];
  return typeof value === "string" ? value : "";
}

function getExistingProductImages(formState: WizardFormState) {
  const existingImages = formState["existing-product-images"];
  if (Array.isArray(existingImages)) {
    return existingImages.filter(
      (imageUrl): imageUrl is string => typeof imageUrl === "string",
    );
  }

  const fallbackImage = formState["existing-image-url"];
  return typeof fallbackImage === "string" && fallbackImage
    ? [fallbackImage]
    : [];
}

function normalizeProductImageUrls(
  imageUrls: string[] | null | undefined,
  fallbackImageUrl?: string | null,
) {
  return [
    ...new Set([...(imageUrls ?? []), fallbackImageUrl ?? ""].filter(Boolean)),
  ].slice(0, 5);
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toDateDisplay(value: unknown) {
  return typeof value === "string"
    ? new Date(value).toLocaleDateString("pt-BR")
    : "--";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeRow(
  moduleKey: ModuleKey,
  row: Record<string, unknown>,
): ModuleRow {
  const createdAt =
    typeof row.created_at === "string"
      ? new Date(row.created_at).toLocaleDateString("pt-BR")
      : "--";

  if (moduleKey === "products") {
    return {
      Categoria: row.category,
      "Criado em": createdAt,
      "Link de atendimento": row.slug,
      Nome: row.name,
      Destaque: row.is_featured ? "Produto em destaque" : "Não destaque",
      Preço:
        typeof row.price === "number"
          ? row.price.toLocaleString("pt-BR", {
              currency: "BRL",
              style: "currency",
            })
          : "--",
      Código: row.slug,
      Status: row.status,
      id: String(row.id),
      name: String(row.name ?? "Produto"),
      status: String(row.status ?? "Inativo"),
    };
  }

  if (moduleKey === "campaigns") {
    return {
      "Banner da seção": row.section_banner_url,
      "Banner do slide": row.banner_url,
      "Criado em": createdAt,
      "Data de início": toDateDisplay(row.starts_at),
      "Data final": toDateDisplay(row.ends_at),
      Descrição: row.description,
      Headline: row.headline,
      Nome: row.name ?? "Campanha",
      Slug: row.slug,
      Status: row.status,
      id: String(row.id),
      name: String(row.name ?? "Campanha"),
      status: String(row.status ?? "Rascunho"),
    };
  }

  if (row.event_type && row.product) {
    const product = row.product as Record<string, unknown> | null;
    const productName = product?.name ?? "Produto";
    const productPrice =
      typeof product?.price === "number"
        ? product.price.toLocaleString("pt-BR", {
            currency: "BRL",
            style: "currency",
          })
        : "--";
    return {
      "Criado em": createdAt,
      Evento: row.event_type,
      Preço: productPrice,
      Produto: productName,
      id: String(row.id),
      name: String(productName),
      status: String(row.event_type ?? "checkout"),
    };
  }

  return {
    Ação: row.action,
    Cargo: row.role,
    "Criado em": createdAt,
    "E-mail": row.email,
    Entidade: row.entity_type,
    Headline: row.headline,
    Nome:
      row.name ??
      row.full_name ??
      row.title ??
      row.action ??
      row.id ??
      "Registro",
    Origem: row.source,
    Produto: row.product_id,
    Quantidade: row.quantity,
    Slug: row.slug,
    Status: row.status ?? row.type ?? "Ativo",
    Tipo: row.movement_type ?? row.type,
    id: String(row.id),
    name: String(
      row.name ??
        row.full_name ??
        row.title ??
        row.action ??
        row.id ??
        "Registro",
    ),
    status: String(row.status ?? row.type ?? "Ativo"),
  };
}

function buildSummaryCards(moduleKey: ModuleKey, rows: ModuleRow[]) {
  const active = rows.filter((row) =>
    ["active", "Ativo", "Campanha ativa"].includes(String(row.status)),
  ).length;

  return [
    {
      description: "Registros no Supabase",
      title: moduleKey === "products" ? "Produtos" : "Registros",
      value: String(rows.length),
    },
    {
      description: "Status ativo",
      title: "Ativos",
      value: String(active),
    },
    {
      description: "Sincronizado por RLS",
      title: "Fonte",
      value: "Supabase",
    },
    {
      description: "Atualização em tempo real quando habilitada",
      title: "Realtime",
      value: "Pronto",
    },
  ];
}

const productCategories = [
  "Eletrônicos",
  "Casa e Cozinha",
  "Beleza",
  "Saúde",
  "Moda",
  "Acessórios",
  "Fitness",
  "Pets",
  "Infantil",
  "Automotivo",
  "Ferramentas",
  "Organização",
  "Decoração",
  "Games",
  "Informática",
  "Celulares",
  "Áudio",
  "Iluminação",
  "Relógios",
  "Viagem",
  "Papelaria",
  "Jardinagem",
  "Segurança",
  "Ecommerce",
  "Serviços Digitais",
  "Software",
  "Marketing Digital",
  "Outros",
].map((value) => ({ label: value, value }));

const productStatuses = [
  { label: "Ativo", value: "active" },
  { label: "Pausa", value: "paused" },
  { label: "Teste", value: "testing" },
  { label: "Arquivado", value: "archived" },
];

const campaignStatuses = [
  {
    description: "Ainda não aparece na operação pública.",
    label: "Rascunho",
    value: "draft",
  },
  {
    description: "Campanha ativa como seção da loja e tracking.",
    label: "Ativa",
    value: "active",
  },
  {
    description: "Pausada temporariamente sem arquivar.",
    label: "Pausada",
    value: "paused",
  },
  {
    description: "Encerrada após o período comercial.",
    label: "Finalizada",
    value: "finished",
  },
  {
    description: "Removida da operação ativa.",
    label: "Arquivada",
    value: "archived",
  },
];

const campaignScheduleModes = [
  {
    description:
      "Sem data final definida; encerre manualmente quando necessário.",
    label: "Campanha contínua",
    value: "continuous",
  },
  {
    description:
      "Exibe o campo de data final e salva o encerramento no Supabase.",
    label: "Campanha com fim",
    value: "limited",
  },
];

const productDifficulties = [
  { label: "Fácil", value: "facil" },
  { label: "Médio", value: "medio" },
  { label: "Difícil", value: "dificil" },
];

const productDiscountTypes = [
  { label: "Sem desconto", value: "none" },
  { label: "Ativar desconto", value: "final_price" },
];

const productHighlightOptions = [
  { label: "Não destacar", value: "false" },
  { label: "Destacar na loja", value: "true" },
];

const teamRoleOptions = [
  { label: "Owner / Fundador", value: "owner" },
  { label: "Superadmin", value: "superadmin" },
  { label: "Gestor / Admin", value: "admin" },
  { label: "Supervisor", value: "supervisor" },
  { label: "User", value: "user" },
  { label: "Colaborador", value: "collaborator" },
];

const salesHarnessToolValues = [
  "sales.suggest_reply",
  "sales.detect_objection",
  "sales.break_objection",
  "sales.classify_lead_temperature",
  "sales.summarize_session",
  "sales.generate_checkout_message",
  "sales.suggest_next_action",
  "sales.explain_product_benefits",
  "sales.compare_need_with_product",
  "sales.generate_transfer_note",
  "sales.generate_followup_message",
  "chat.rewrite_message",
  "chat.shorten_message",
  "chat.make_more_human",
  "chat.make_more_professional",
  "chat.make_more_persuasive",
  "chat.extract_customer_data",
  "chat.detect_intent",
  "chat.detect_risk",
  "chat.summarize_recent_messages",
  "product.get_context",
  "product.get_benefits",
  "product.get_price_info",
  "product.get_stock_status",
  "product.get_checkout_info",
  "product.search_knowledge_base",
  "product.generate_public_answer",
  "ops.generate_internal_note",
  "ops.generate_audit_summary",
  "ops.suggest_ticket_priority",
  "ops.detect_duplicate_ticket",
  "ops.prepare_transfer_context",
  "ops.prepare_human_handoff",
  "ai.check_agent_limits",
  "ai.register_bad_response",
];

const supportHarnessToolValues = [
  "support.suggest_reply",
  "support.identify_reason",
  "support.suggest_resolution",
  "support.summarize_session",
  "support.generate_continuity_note",
  "support.generate_escalation_note",
  "support.detect_frustration",
  "support.suggest_handoff",
  "support.explain_steps",
  "support.generate_closing_message",
  "chat.rewrite_message",
  "chat.shorten_message",
  "chat.make_more_human",
  "chat.make_more_professional",
  "chat.make_more_persuasive",
  "chat.extract_customer_data",
  "chat.detect_intent",
  "chat.detect_risk",
  "chat.summarize_recent_messages",
  "product.get_context",
  "product.get_benefits",
  "product.get_price_info",
  "product.get_stock_status",
  "product.search_knowledge_base",
  "product.generate_public_answer",
  "ops.generate_internal_note",
  "ops.generate_audit_summary",
  "ops.suggest_ticket_priority",
  "ops.detect_duplicate_ticket",
  "ops.prepare_transfer_context",
  "ops.prepare_human_handoff",
  "ai.check_agent_limits",
  "ai.register_bad_response",
];

function getWizardSteps(
  moduleKey: ModuleKey,
  knowledgeBases: KnowledgeBaseRow[] = [],
  campaignProducts: Array<{ id: string; name: string; status: string }> = [],
): WizardStep[] {
  if (moduleKey === "products") {
    return addProductFieldHelp([
      {
        fields: [
          { id: "name", label: "Nome", required: true },
          {
            helperText:
              "Envie até 4 imagens quadradas 1:1 para a galeria do produto. A primeira imagem será usada como capa nos cards públicos.",
            id: "images",
            label: "Imagens do produto",
            maxFiles: 4,
            type: "multi-image",
          },
          {
            id: "category",
            label: "Categoria",
            options: productCategories,
            selection: "single",
          },
          {
            id: "short-description",
            label: "Descrição curta",
            type: "textarea",
          },
          {
            id: "status",
            label: "Status",
            options: productStatuses,
            selection: "single",
          },
        ],
        id: "general",
        title: "Dados Gerais",
      },
      {
        fields: [
          { id: "price", label: "Preço fixo", type: "number" },
          {
            id: "discount-type",
            label: "Desconto",
            options: productDiscountTypes,
            selection: "single",
          },
          {
            hiddenWhen: (formState) => formState["discount-type"] === "none",
            id: "discount-value",
            label: "Preço com desconto",
            type: "number",
          },
          {
            id: "discount-preview",
            label: "Resumo do desconto",
            readOnly: true,
            type: "textarea",
          },
          {
            id: "store-highlight",
            label: "Destaque",
            options: productHighlightOptions,
            selection: "single",
          },
          { id: "checkout-url", label: "Link de checkout" },
          {
            id: "commission-margin",
            label: "Comissão por venda",
            helperText: "Quantidade que ganha ao vender este produto.",
            type: "number",
          },
          {
            id: "difficulty",
            label: "Dificuldade",
            options: productDifficulties,
            selection: "single",
          },
          {
            id: "show-price-publicly",
            label: "Mostrar preço publicamente",
            type: "checkbox",
          },
        ],
        id: "commercial",
        title: "Comercial",
      },
      {
        fields: [
          {
            id: "stock-control-enabled",
            label: "Controlar estoque",
            type: "checkbox",
          },
          {
            id: "stock-quantity",
            disabledWhen: (formState) => !formState["stock-control-enabled"],
            label: "Quantidade em estoque",
            type: "number",
          },
          {
            id: "stock-minimum",
            disabledWhen: (formState) => !formState["stock-control-enabled"],
            label: "Estoque mínimo",
            type: "number",
          },
        ],
        id: "inventory",
        title: "Estoque",
      },
      {
        fields: [
          { id: "public-headline", label: "Headline" },
          {
            id: "public-description",
            label: "Descrição pública",
            type: "textarea",
          },
          { id: "public-benefits", label: "Benefícios", type: "textarea" },
          { id: "warranty", label: "Garantia" },
          { id: "public-cta", label: "CTA" },
        ],
        id: "public-presale",
        title: "Pré-venda pública",
      },
      {
        fields: [
          {
            id: "sales-ai-enabled",
            label: "Ativar IA de venda",
            type: "checkbox",
          },
          {
            id: "sales-display-name",
            disabledWhen: (formState) => !formState["sales-ai-enabled"],
            label: "Nome exibido",
          },
          {
            id: "sales-tone",
            disabledWhen: (formState) => !formState["sales-ai-enabled"],
            label: "Tom",
          },
          {
            id: "sales-rules",
            disabledWhen: (formState) => !formState["sales-ai-enabled"],
            label: "Regras de venda",
            type: "textarea",
          },
          {
            id: "sales-initial-message",
            disabledWhen: (formState) => !formState["sales-ai-enabled"],
            label: "Mensagem inicial",
            type: "textarea",
          },
          {
            id: "sales-knowledge-base-ids",
            disabledWhen: (formState) => !formState["sales-ai-enabled"],
            label: "Base de dados da IA de venda",
            options: knowledgeBases.map((base) => ({
              description: `${base.category ?? "Sem categoria"} · ${base.status}`,
              label: base.title,
              value: base.id,
            })),
            selection: "multiple",
          },
          {
            id: "support-ai-enabled",
            label: "Ativar IA de suporte",
            type: "checkbox",
          },
          {
            id: "support-knowledge-base-ids",
            disabledWhen: (formState) => !formState["support-ai-enabled"],
            label: "Base de dados da IA de suporte",
            options: knowledgeBases.map((base) => ({
              description: `${base.category ?? "Sem categoria"} · ${base.status}`,
              label: base.title,
              value: base.id,
            })),
            selection: "multiple",
          },
        ],
        id: "ai",
        title: "IA",
      },
    ]);
  }

  if (moduleKey === "campaigns") {
    return addCampaignFieldHelp([
      {
        fields: [
          { id: "name", label: "Nome", required: true },
          { id: "headline", label: "Headline" },
          { id: "description", label: "Descrição curta", type: "textarea" },
        ],
        id: "general",
        title: "Dados Gerais",
      },
      {
        fields: [
          {
            id: "banner",
            label: "Banner do slide",
            previewRatio: "12:5",
            type: "file",
          },
          {
            id: "section-banner",
            label: "Banner da seção",
            previewRatio: "2458:640",
            type: "file",
          },
          {
            id: "status",
            label: "Status",
            options: campaignStatuses,
            selection: "single",
          },
          { id: "starts-at", label: "Início", type: "date" },
          {
            id: "schedule-mode",
            label: "Duração da campanha",
            options: campaignScheduleModes,
            selection: "single",
          },
          {
            hiddenWhen: (formState) => formState["schedule-mode"] !== "limited",
            id: "ends-at",
            label: "Fim",
            type: "date",
          },
          {
            id: "product-ids",
            label: "Produtos vinculados",
            options: campaignProducts.map((product) => ({
              description: product.status,
              label: product.name,
              value: product.id,
            })),
            selection: "multiple",
          },
        ],
        id: "publishing",
        title: "Loja e Produtos",
      },
      {
        fields: [
          {
            id: "review",
            label: "Revisão antes de salvar no Supabase",
            readOnly: true,
            type: "textarea",
          },
        ],
        id: "review",
        title: "Revisão",
      },
    ]);
  }

  if (moduleKey === "team") {
    return [
      {
        fields: [
          { id: "name", label: "Nome completo", required: true },
          { id: "email", label: "E-mail", required: true },
          {
            id: "role",
            label: "Classificação",
            options: teamRoleOptions,
            required: true,
            selection: "single",
          },
        ],
        id: "invite",
        title: "Dados do convite",
      },
      {
        fields: [
          { id: "group", label: "Grupo principal", required: true },
          { id: "additional-groups", label: "Grupos adicionais" },
          { id: "permissions", label: "Permissões base" },
        ],
        id: "access",
        title: "Acesso e grupos",
      },
      {
        fields: [
          {
            id: "send-email",
            label: "Enviar convite por e-mail",
            type: "checkbox",
          },
          { id: "message", label: "Mensagem opcional", type: "textarea" },
          { id: "expiration", label: "Expiração do convite" },
        ],
        id: "automation",
        title: "Configurações do convite",
      },
      {
        fields: [
          {
            id: "review",
            label: "Revisão do convite antes de chamar RPC",
            readOnly: true,
            type: "textarea",
          },
        ],
        id: "review",
        title: "Revisão",
      },
    ];
  }

  return [
    {
      fields: [
        { id: "name", label: "Nome", required: true },
        { id: "status", label: "Status" },
      ],
      id: "general",
      title: "Dados Gerais",
    },
    {
      fields: [
        { id: "details", label: "Detalhes", type: "textarea" },
        { id: "notes", label: "Observações operacionais", type: "textarea" },
      ],
      id: "details",
      title: "Detalhes",
    },
    {
      fields: [
        {
          id: "review",
          label: "Revisão antes de enviar para Supabase",
          readOnly: true,
          type: "textarea",
        },
      ],
      id: "review",
      title: "Revisão",
    },
  ];
}
