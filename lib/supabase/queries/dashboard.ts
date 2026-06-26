"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type DashboardMetric = {
  description: string;
  glow: "blue" | "green" | "purple";
  title: string;
  trend?: string;
  value: string;
};

export type DashboardOverview = {
  events: Tables<"notifications">[];
  funnel: Array<{
    caption: string;
    icon: string;
    label: string;
    value: string;
  }>;
  metrics: DashboardMetric[];
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const [
    salesSessions,
    supportSessions,
    checkoutEvents,
    confirmations,
    notifications,
  ] = await Promise.all([
    supabase.from("sales_sessions").select("status,created_at"),
    supabase.from("support_sessions").select("status,created_at"),
    supabase.from("checkout_events").select("event_type,created_at"),
    supabase.from("sales_confirmations").select("amount,created_at"),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  for (const result of [
    salesSessions,
    supportSessions,
    checkoutEvents,
    confirmations,
    notifications,
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  const sales = salesSessions.data ?? [];
  const support = supportSessions.data ?? [];
  const checkouts = checkoutEvents.data ?? [];
  const salesDone = confirmations.data ?? [];
  const checkoutSent = checkouts.filter(
    (event) => event.event_type === "checkout_sent",
  ).length;
  const checkoutAccessed = checkouts.filter(
    (event) => event.event_type === "checkout_accessed",
  ).length;
  const activeSales = sales.filter((item) => item.status === "in_progress");
  const activeSupport = support.filter((item) => item.status === "in_progress");
  const revenue = salesDone.reduce(
    (total, item) => total + Number(item.amount ?? 0),
    0,
  );

  return {
    events: notifications.data ?? [],
    funnel: [
      { caption: "acessos", icon: "Eye", label: "Vitrine", value: "0" },
      { caption: "visualizações", icon: "Box", label: "Produto", value: "0" },
      {
        caption: "acessos",
        icon: "FileText",
        label: "Pré-venda",
        value: "0",
      },
      {
        caption: "leads",
        icon: "UsersRound",
        label: "Sala",
        value: String(sales.length),
      },
      {
        caption: "envios",
        icon: "Send",
        label: "Checkout enviado",
        value: String(checkoutSent),
      },
      {
        caption: "cliques",
        icon: "Eye",
        label: "Checkout acessado",
        value: String(checkoutAccessed),
      },
      {
        caption: "vendas",
        icon: "ShoppingCart",
        label: "Venda confirmada",
        value: String(salesDone.length),
      },
    ],
    metrics: [
      {
        description: "Confirmadas no Supabase",
        glow: "blue",
        title: "Vendas Confirmadas",
        trend: "dados reais",
        value: String(salesDone.length),
      },
      {
        description: "Receita confirmada",
        glow: "purple",
        title: "Receita Estimada",
        trend: "Supabase",
        value: revenue.toLocaleString("pt-BR", {
          currency: "BRL",
          style: "currency",
        }),
      },
      {
        description: "Eventos registrados",
        glow: "blue",
        title: "Checkouts Enviados",
        value: String(checkoutSent),
      },
      {
        description: "Alta intenção",
        glow: "purple",
        title: "Checkouts Acessados",
        value: String(checkoutAccessed),
      },
      {
        description: "Sessões em progresso",
        glow: "green",
        title: "Atendimentos Ativos",
        value: String(activeSales.length),
      },
      {
        description: "Chamados em progresso",
        glow: "purple",
        title: "Suportes Ativos",
        value: String(activeSupport.length),
      },
      {
        description: "Avaliações registradas",
        glow: "purple",
        title: "Avaliação Média",
        value: "0,0",
      },
      {
        description: "Vendas / salas",
        glow: "blue",
        title: "Taxa de Conversão",
        value: sales.length
          ? `${Math.round((salesDone.length / sales.length) * 100)}%`
          : "0%",
      },
    ],
  };
}
