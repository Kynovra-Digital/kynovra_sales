"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { listAuditLogs } from "@/lib/supabase/queries/audit";
import { listCampaigns } from "@/lib/supabase/queries/campaigns";
import { listInventoryMovements } from "@/lib/supabase/queries/inventory";
import { listProducts } from "@/lib/supabase/queries/products";
import { listTeamMembers } from "@/lib/supabase/queries/team";

export type ModuleRecord = Record<string, Json | undefined>;

export async function listModuleRecords(moduleKey: string) {
  switch (moduleKey) {
    case "products":
      return normalizeRows(await listProducts());
    case "campaigns":
      return normalizeRows(await listCampaigns());
    case "leads":
      return queryTable("leads");
    case "team":
      return normalizeRows(await listTeamMembers());
    case "audit":
      return normalizeRows(await listAuditLogs());
    case "inventory":
      return normalizeRows(await listInventoryMovements());
    case "settings":
      return queryTable("organization_settings");
    case "quality":
      return queryTable("evaluations");
    default:
      return [];
  }
}

async function queryTable(tableName: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(tableName as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return normalizeRows((data ?? []) as Array<Record<string, Json>>);
}

function normalizeRows(rows: Array<Record<string, Json>>) {
  return rows.map((row) => ({ ...row }));
}
