"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { FunnelVisual } from "@/components/dashboard/funnel-visual";
import { RealtimeTimeline } from "@/components/dashboard/realtime-timeline";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getDashboardOverview } from "@/lib/supabase/queries/dashboard";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

const dashboardProfiles = [
  "Dono",
  "Gestão",
  "Supervisor",
  "Atendimento",
  "Suporte",
];

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
  const [profile, setProfile] = useState("Dono");
  const [period, setPeriod] = useState("Hoje");
  const { data, isLoading } = useQuery({
    queryFn: getDashboardOverview,
    queryKey: queryKeys.dashboard.overview,
  });
  const metrics = data?.metrics ?? [];

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid min-w-0 gap-6"
    >
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-wider pl-1"
                htmlFor="dashboard-profile"
              >
                Visualizar como
              </label>
              <Select onValueChange={setProfile} value={profile}>
                <SelectTrigger
                  className="h-9 w-[12rem] border-white/5 bg-white/[0.03] rounded-xl transition-all hover:bg-white/[0.06] hover:border-white/10"
                  id="dashboard-profile"
                >
                  <SelectValue placeholder="Cargo atual" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-white/10 rounded-xl">
                  <SelectGroup>
                    {dashboardProfiles.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="rounded-lg"
                      >
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        breadcrumbs={[{ label: "Início" }, { label: "Dashboard" }]}
        description="Monitoramento operacional em tempo real da sua plataforma"
        title="Dashboard Operacional"
      />

      <motion.div
        variants={itemVariants}
        className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-3 backdrop-blur-sm"
      >
        <div className="flex flex-wrap gap-2">
          {["Hoje", "7 dias", "30 dias", "Este mês"].map((item) => (
            <Button
              key={item}
              onClick={() => setPeriod(item)}
              size="sm"
              className={cn(
                "h-8 px-4 rounded-lg transition-all",
                period === item
                  ? "bg-primary text-white shadow-[0_0_15px_rgb(37_99_235_/_0.3)]"
                  : "bg-transparent border-white/5 text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
              variant={period === item ? "default" : "outline"}
            >
              {item}
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
            20 de Mai de 2025
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

      <motion.div
        variants={itemVariants}
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
        <FunnelVisual steps={data?.funnel ?? []} />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]"
      >
        <div className="min-w-0">
          <RealtimeTimeline events={data?.events ?? []} />
        </div>

        <aside className="grid min-w-0 gap-6 content-start">
          <div className="data-panel p-5 relative overflow-hidden group">
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
                    strokeDashoffset={364.4 * (1 - 0.7)}
                    strokeLinecap="round"
                    className="text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-white leading-none">
                    32
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                    Total
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ["Humanos", "18", "bg-primary", "56%"],
                  ["IA Automática", "12", "bg-kynovra-tech-purple", "38%"],
                  ["Copiloto", "2", "bg-kynovra-digital-green", "6%"],
                ].map(([label, value, color, percent]) => (
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
                ))}
              </div>
            </div>
          </div>

          <div className="data-panel p-5 relative overflow-hidden group">
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
              {[
                ["Mensagens enviadas", "1.248", "+16%", "green"],
                ["Taxa de acerto", "94,2%", "+3%", "green"],
                ["Tempo de resposta", "2,8s", "-0,4s", "red"],
                ["Respostas ruins", "12", "-4", "green"],
              ].map(([label, value, delta, tone]) => (
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
                    {delta}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="data-panel border-primary/20 bg-primary/5 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="size-24 -rotate-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary shadow-[0_0_20px_rgb(37_99_235_/_0.3)] text-white">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">
                    Onboarding
                  </h3>
                  <p className="text-blue-200/60 text-xs">
                    6 de 10 etapas concluídas
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-blue-200/40 mb-2">
                  <span>Progresso</span>
                  <span>60%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary via-blue-400 to-kynovra-tech-purple shadow-[0_0_15px_rgb(37_99_235_/_0.5)]"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  className="flex-1 h-9 rounded-xl font-bold text-xs"
                  variant="default"
                >
                  Continuar Setup
                </Button>
                <Button
                  className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                  variant="outline"
                >
                  Pular
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </motion.section>
  );
}
