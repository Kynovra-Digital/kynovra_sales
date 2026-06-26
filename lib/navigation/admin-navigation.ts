import {
  Bell,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  Gauge,
  History,
  Megaphone,
  MessageCircleMore,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

export const adminNavigationGroups = [
  {
    label: "Operação",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: Gauge,
        permission: "dashboard.view",
      },
      {
        label: "Atendimentos de Venda",
        href: "/sales",
        icon: MessageCircleMore,
        permission: "sales.view",
      },
      {
        label: "Suporte Pós-Venda",
        href: "/post-sales-support",
        icon: ShieldCheck,
        permission: "support.view",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        label: "Produtos",
        href: "/products",
        icon: Package,
        permission: "products.view",
      },
      {
        label: "Base de Conhecimentos",
        href: "/knowledge-base",
        icon: BookOpenText,
        permission: "knowledge.view",
      },
      {
        label: "Campanhas",
        href: "/campaigns",
        icon: Megaphone,
        permission: "campaigns.view",
      },
      {
        label: "Leads e Registros",
        href: "/leads",
        icon: Store,
        permission: "leads.view",
      },
      {
        label: "Estoque e Disponibilidade",
        href: "/inventory",
        icon: Boxes,
        permission: "inventory.view",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        label: "Relatórios de Qualidade",
        href: "/quality",
        icon: ClipboardCheck,
        permission: "quality.view",
      },
      {
        label: "Equipe e Permissões",
        href: "/team",
        icon: Users,
        permission: "team.view",
      },
      {
        label: "Auditoria e Histórico",
        href: "/audit",
        icon: History,
        permission: "audit.view",
      },
      {
        label: "Configurações Gerais",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
    ],
  },
] as const;

export const adminCommandItems = adminNavigationGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    group: group.label,
  })),
);

export const quickActions = [
  {
    label: "Novo produto",
    href: "/products",
    icon: Package,
    permission: "products.view",
  },
  {
    label: "Nova campanha",
    href: "/campaigns",
    icon: Megaphone,
    permission: "campaigns.view",
  },
  {
    label: "Abrir atendimento",
    href: "/sales",
    icon: MessageCircleMore,
    permission: "sales.view",
  },
  {
    label: "Abrir painel de notificações",
    action: "notifications",
    icon: Bell,
  },
  {
    label: "Revisar IA",
    href: "/settings#ia",
    icon: Settings,
    permission: "settings.view",
  },
] as const;
