"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { FunnelVisual } from "@/components/dashboard/funnel-visual";
import { RealtimeTimeline } from "@/components/dashboard/realtime-timeline";
import { PageHeader } from "@/components/layout/page-header";
import { OnboardingTutorialModal } from "@/components/onboarding/onboarding-tutorial-modal";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { listClients } from "@/lib/supabase/queries/clients";
import {
  type DashboardOverview,
  type DashboardPeriod,
  getDashboardOverview,
  mergeDashboardTimelineEvent,
  subscribeDashboardOverview,
  subscribeDashboardTimeline,
} from "@/lib/supabase/queries/dashboard";
import { cn } from "@/lib/utils";

const dashboardPeriods: Array<{ label: string; value: DashboardPeriod }> = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Este mês", value: "month" },
];

const periodButtonLabel: Record<DashboardPeriod, string> = {
  "30d": "Últimos 30 dias",
  "7d": "Últimos 7 dias",
  month: "Mês atual",
  today: new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date()),
};

const emptyDashboardOverview: DashboardOverview = {
  aiPerformance: {
    items: [
      { delta: null, label: "Chamadas IA", tone: "green", value: "0" },
      { delta: null, label: "Taxa de acerto", tone: "green", value: "0%" },
      { delta: null, label: "Latência média", tone: "green", value: "0ms" },
      { delta: null, label: "Respostas ruins", tone: "green", value: "0" },
    ],
  },
  attendance: {
    breakdown: [
      { color: "bg-primary", label: "Humanos", value: 0 },
      { color: "bg-kynovra-tech-purple", label: "IA Automática", value: 0 },
      { color: "bg-kynovra-digital-green", label: "Aguardando", value: 0 },
    ],
    total: 0,
  },
  events: [],
  funnel: [
    { caption: "acessos", icon: "Eye", label: "Vitrine", value: "0" },
    { caption: "visualizações", icon: "Box", label: "Produto", value: "0" },
    { caption: "acessos", icon: "FileText", label: "Pré-venda", value: "0" },
    { caption: "leads", icon: "UsersRound", label: "Sala", value: "0" },
    { caption: "envios", icon: "Send", label: "Checkout enviado", value: "0" },
    { caption: "cliques", icon: "Eye", label: "Checkout acessado", value: "0" },
    {
      caption: "vendas",
      icon: "ShoppingCart",
      label: "Venda confirmada",
      value: "0",
    },
  ],
  metrics: [
    {
      description: "Confirmadas no Supabase",
      glow: "blue",
      title: "Vendas Confirmadas",
      value: "0",
    },
    {
      description: "Receita confirmada",
      glow: "purple",
      title: "Receita Estimada",
      value: "R$ 0,00",
    },
    {
      description: "Total de contas cadastradas",
      glow: "blue",
      title: "Clientes Cadastrados",
      value: "0",
    },
    {
      description: "Alta intenção",
      glow: "purple",
      title: "Checkouts Acessados",
      value: "0",
    },
    {
      description: "Sessões em progresso",
      glow: "green",
      title: "Atendimentos Ativos",
      value: "0",
    },
    {
      description: "Chamados em progresso",
      glow: "purple",
      title: "Suportes Ativos",
      value: "0",
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
      value: "0%",
    },
  ],
};

function dashboardOverviewQueryKey(period: DashboardPeriod) {
  return ["dashboard", "overview", period] as const;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const { data, error, isError, isLoading } = useQuery({
    queryFn: () => getDashboardOverview(period),
    queryKey: dashboardOverviewQueryKey(period),
  });
  const overview = data ?? emptyDashboardOverview;
  const metrics = [...overview.metrics];
  const { data: clients = [] } = useQuery({
    queryFn: listClients,
    queryKey: ["clients", "count"],
  });
  metrics[2] = { ...metrics[2], value: String(clients.length) };
  const attendanceTotal = overview.attendance.total;
  const attendanceBreakdown = overview.attendance.breakdown;
  const aiPerformanceItems = overview.aiPerformance.items;

  useEffect(() => {
    return subscribeDashboardTimeline((event) => {
      queryClient.setQueryData<DashboardOverview>(
        dashboardOverviewQueryKey(period),
        (overview) => mergeDashboardTimelineEvent(overview, event),
      );
    });
  }, [period, queryClient]);

  useEffect(() => {
    return subscribeDashboardOverview(() => {
      void queryClient.invalidateQueries({
        queryKey: dashboardOverviewQueryKey(period),
      });
    });
  }, [period, queryClient]);

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid min-h-full min-w-0 content-start gap-6"
    >
      <OnboardingTutorialModal />
      <PageHeader
        breadcrumbs={[{ label: "Início" }, { label: "Dashboard" }]}
        description="Monitoramento operacional em tempo real da sua plataforma"
        title="Dashboard Operacional"
      />

      <motion.div
        variants={itemVariants}
        className="flex min-w-0 flex-col gap-4 rounded-3xl border border-white/5 bg-white/[0.012] p-3 backdrop-blur-sm md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-wrap gap-2">
          {dashboardPeriods.map((item) => (
            <Button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              size="sm"
              className={cn(
                "h-8 px-4 rounded-lg transition-all",
                period === item.value
                  ? "bg-primary text-white shadow-[0_0_15px_rgb(37_99_235_/_0.3)]"
                  : "bg-transparent border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
              variant={period === item.value ? "default" : "outline"}
            >
              {item.label}
            </Button>
          ))}
          <Separator
            orientation="vertical"
            className="h-8 bg-white/5 mx-1 hidden sm:block"
          />
          <Button
            className="h-8 gap-2 border-white/5 bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white rounded-lg"
            size="sm"
            variant="outline"
          >
            <CalendarDays className="size-3.5" />
            {periodButtonLabel[period]}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-kynovra-digital-green/20 bg-kynovra-digital-green/5 px-3 py-1.5 ring-1 ring-kynovra-digital-green/10">
            <div className="relative">
              <span className="block size-1.5 rounded-full bg-kynovra-digital-green" />
              <span className="absolute inset-0 animate-ping rounded-full bg-kynovra-digital-green opacity-40" />
            </div>
            <p className="font-bold text-kynovra-digital-green text-[11px] uppercase tracking-wider">
              Sistema Operacional
            </p>
          </div>
        </div>
      </motion.div>

      {isError ? (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-red-100 text-sm"
        >
          Não foi possível carregar os dados reais da dashboard agora. Verifique
          a conexão com o Supabase e se a RPC{" "}
          <strong>get_dashboard_overview</strong>
          foi aplicada. Detalhe: {error?.message ?? "erro desconhecido"}
        </motion.div>
      ) : null}

      <motion.div
        variants={itemVariants}
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {isLoading
          ? ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map(
              (metricKey) => (
                <MetricCard
                  description="Conectando ao banco..."
                  glow={
                    metricKey.endsWith("2") || metricKey.endsWith("4")
                      ? "purple"
                      : "blue"
                  }
                  key={`metric-skeleton-${metricKey}`}
                  title="Sincronizando"
                  value="..."
                />
              ),
            )
          : metrics.map((metric) => (
              <MetricCard
                description={metric.description}
                glow={metric.glow}
                key={metric.title}
                title={metric.title}
                trend={metric.trend}
                value={metric.value}
              />
            ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <FunnelVisual steps={overview.funnel} />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_336px] 2xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="min-w-0">
          <RealtimeTimeline events={overview.events} />
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <div className="data-panel group relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-white tracking-tight">
                  Atendimentos
                </h2>
                <p className="text-muted-foreground/60 text-xs mt-0.5">
                  Sessões ativas no momento
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg"
              >
                Ver todos
              </Button>
            </div>

            <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="relative flex size-32 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
                <svg
                  className="absolute inset-0 size-full -rotate-90"
                  aria-labelledby="attendance-chart-title"
                  role="img"
                >
                  <title id="attendance-chart-title">
                    Gráfico de atendimentos ativos
                  </title>
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/5"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={364.4}
                    strokeDashoffset={
                      364.4 *
                      (1 - Math.min(Math.max(attendanceTotal, 0), 100) / 100)
                    }
                    strokeLinecap="round"
                    className="text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white leading-none">
                    {attendanceTotal}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                    Total
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {attendanceBreakdown.map(({ color, label, value }) => {
                  const percent = attendanceTotal
                    ? `${Math.round((value / attendanceTotal) * 100)}%`
                    : "0%";

                  return (
                    <div className="group/item" key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("size-2 rounded-full", color)} />
                          <span className="text-muted-foreground/80 text-xs font-semibold">
                            {label}
                          </span>
                        </div>
                        <span className="text-white text-xs font-bold">
                          {value}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: percent }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={cn("h-full rounded-full", color)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="data-panel group relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-kynovra-tech-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-white tracking-tight">
                  IA Performance
                </h2>
                <p className="text-muted-foreground/60 text-xs mt-0.5">
                  Métricas de inteligência
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg"
              >
                Relatório
              </Button>
            </div>

            <div className="mt-6 space-y-1">
              {aiPerformanceItems.map(({ delta, label, tone, value }) => (
                <div
                  className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
                  key={label}
                >
                  <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <TrendingUp className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="font-bold text-white text-sm mt-0.5">
                      {value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border px-2 py-1 font-bold text-[10px]",
                      tone === "red"
                        ? "border-destructive/20 bg-destructive/10 text-red-400"
                        : "border-kynovra-digital-green/20 bg-kynovra-digital-green/10 text-kynovra-digital-green",
                    )}
                  >
                    {delta ?? "Supabase"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </motion.div>
    </motion.section>
  );
}
