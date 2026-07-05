"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type AuditMember = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "id" | "role"
>;

export async function listAuditLogs() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function listAuditMembersByIds(actorIds: string[]) {
  const uniqueActorIds = Array.from(new Set(actorIds.filter(Boolean)));

  if (uniqueActorIds.length === 0) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", uniqueActorIds);

  if (error) throw error;
  return (data ?? []) as AuditMember[];
}
