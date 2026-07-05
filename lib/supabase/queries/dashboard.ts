"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

const DASHBOARD_TIMELINE_LIMIT = 8;

export type DashboardMetric = {
  description: string;
  glow: "blue" | "green" | "purple";
  title: string;
  trend?: string;
  value: string;
};

export type DashboardPeriod = "today" | "7d" | "30d" | "month";

export type DashboardAttendanceBreakdown = {
  color: string;
  label: string;
  value: number;
};

export type DashboardAiPerformanceItem = {
  delta?: string | null;
  label: string;
  tone: "green" | "red";
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
  attendance: {
    breakdown: DashboardAttendanceBreakdown[];
    total: number;
  };
  aiPerformance: {
    items: DashboardAiPerformanceItem[];
  };
};

type DashboardRpcResponse = DashboardOverview & {
  generatedAt?: string;
  period?: DashboardPeriod;
};

function isDashboardOverview(value: unknown): value is DashboardOverview {
  if (!value || typeof value !== "object") return false;

  const overview = value as Partial<DashboardOverview>;

  return (
    Array.isArray(overview.metrics) &&
    Array.isArray(overview.funnel) &&
    Array.isArray(overview.events) &&
    Boolean(overview.attendance) &&
    Boolean(overview.aiPerformance)
  );
}

export async function getDashboardOverview(
  period: DashboardPeriod = "today",
): Promise<DashboardOverview> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_dashboard_overview", {
    p_period: period,
  });

  if (error) {
    throw error;
  }

  const overview = data as DashboardRpcResponse | null;

  if (!isDashboardOverview(overview)) {
    throw new Error("Resposta inválida do Supabase para a dashboard.");
  }

  return overview;
}

export function subscribeDashboardOverview(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel("dashboard:overview")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales_sessions" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "support_sessions" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "checkout_events" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales_confirmations" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "campaign_tracking_events" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "campaign_metrics_daily" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ai_agent_usage" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "evaluations" },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeDashboardTimeline(
  onChange: (event: Tables<"notifications">) => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel("dashboard:timeline:notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        onChange(payload.new as Tables<"notifications">);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function mergeDashboardTimelineEvent(
  overview: DashboardOverview | undefined,
  event: Tables<"notifications">,
): DashboardOverview | undefined {
  if (!overview) return overview;

  const events = [
    event,
    ...overview.events.filter((item) => item.id !== event.id),
  ]
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    )
    .slice(0, DASHBOARD_TIMELINE_LIMIT);

  return { ...overview, events };
}
