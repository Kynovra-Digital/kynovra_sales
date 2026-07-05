import {
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  Gauge,
  History,
  type LucideIcon,
  Megaphone,
  MessageCircleMore,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

export type PermissionOption = {
  description: string;
  icon?: LucideIcon;
  key: string;
  label: string;
};

export const visibleTabPermissions: PermissionOption[] = [
  {
    description: "Permite acessar a visão principal de métricas.",
    icon: Gauge,
    key: "dashboard.view",
    label: "Dashboard",
  },
  {
    description: "Permite ver a fila e os atendimentos comerciais.",
    icon: MessageCircleMore,
    key: "sales.view",
    label: "Atendimentos de Venda",
  },
  {
    description: "Permite ver a fila e as conversas de pós-venda.",
    icon: ShieldCheck,
    key: "support.view",
    label: "Suporte Pós-Venda",
  },
  {
    description: "Permite acessar a área de produtos.",
    icon: Package,
    key: "products.view",
    label: "Produtos",
  },
  {
    description: "Permite acessar as campanhas comerciais.",
    icon: Megaphone,
    key: "campaigns.view",
    label: "Campanhas",
  },
  {
    description: "Permite acessar os prompts Hardness dos agentes.",
    icon: BrainCircuit,
    key: "hardness.view",
    label: "Hardness",
  },
  {
    description: "Permite acessar leads, clientes e registros.",
    icon: Store,
    key: "leads.view",
    label: "Leads e Registros",
  },
  {
    description: "Permite acessar estoque e disponibilidade.",
    icon: Boxes,
    key: "inventory.view",
    label: "Estoque e Disponibilidade",
  },
  {
    description: "Permite acessar relatórios de qualidade.",
    icon: ClipboardCheck,
    key: "quality.view",
    label: "Relatórios de Qualidade",
  },
  {
    description: "Permite acessar equipe, grupos e permissões.",
    icon: Users,
    key: "team.view",
    label: "Equipe e Permissões",
  },
  {
    description: "Permite acessar auditoria e histórico.",
    icon: History,
    key: "audit.view",
    label: "Auditoria e Histórico",
  },
  {
    description: "Permite acessar configurações gerais.",
    icon: Settings,
    key: "settings.view",
    label: "Configurações Gerais",
  },
];

export const actionPermissions: PermissionOption[] = [
  {
    description: "Gerenciar equipe, grupos e permissões.",
    key: "team.manage",
    label: "Gerenciar equipe",
  },
  {
    description: "Alterar configurações gerais da organização.",
    key: "settings.manage",
    label: "Alterar configurações",
  },
  {
    description: "Alterar configuração global de IA.",
    key: "ai.settings.manage",
    label: "Configurar IA",
  },
  {
    description: "Criar, editar, arquivar e configurar produtos.",
    key: "products.manage",
    label: "Criar e editar produtos",
  },
  {
    description: "Criar, editar e arquivar campanhas.",
    key: "campaigns.manage",
    label: "Criar e editar campanhas",
  },
  {
    description: "Gerenciar bases de conhecimento.",
    key: "knowledge.manage",
    label: "Gerenciar base de conhecimento",
  },
  {
    description: "Aceitar tickets de atendimento de venda.",
    key: "sales.ticket.accept",
    label: "Aceitar atendimento de venda",
  },
  {
    description: "Abrir atendimentos de venda aceitos.",
    key: "sales.ticket.open",
    label: "Abrir atendimento de venda",
  },
  {
    description: "Transferir atendimentos de venda.",
    key: "sales.ticket.transfer",
    label: "Transferir atendimento de venda",
  },
  {
    description: "Encerrar atendimentos de venda.",
    key: "sales.ticket.close",
    label: "Encerrar atendimento de venda",
  },
  {
    description: "Aceitar tickets de suporte.",
    key: "support.ticket.accept",
    label: "Aceitar suporte",
  },
  {
    description: "Abrir suportes aceitos.",
    key: "support.ticket.open",
    label: "Abrir suporte",
  },
  {
    description: "Transferir suportes.",
    key: "support.ticket.transfer",
    label: "Transferir suporte",
  },
  {
    description: "Encerrar suportes.",
    key: "support.ticket.close",
    label: "Encerrar suporte",
  },
  {
    description: "Visualizar auditoria e histórico.",
    key: "audit.read",
    label: "Visualizar auditoria",
  },
  {
    description: "Visualizar notificações da topbar.",
    key: "notifications.read",
    label: "Visualizar notificações",
  },
];

export const permissionCatalog = [
  ...visibleTabPermissions,
  ...actionPermissions,
];

export function getPermissionLabel(permissionKey: string) {
  return (
    permissionCatalog.find((permission) => permission.key === permissionKey)
      ?.label ?? permissionKey
  );
}

export function canAccessPermission(
  permissions: string[],
  permissionKey?: string,
) {
  if (!permissionKey) return true;
  return permissions.includes("*") || permissions.includes(permissionKey);
}
