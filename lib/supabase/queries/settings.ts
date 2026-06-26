"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type OrganizationSettings = Tables<"organization_settings">;

export async function getOrganizationSettings(organizationId?: string) {
  const supabase = createClient();
  let query = supabase.from("organization_settings").select("*");

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data as OrganizationSettings | null;
}

export async function saveOrganizationSettings(
  input: TablesUpdate<"organization_settings"> & { organization_id: string },
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .upsert(input, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as OrganizationSettings;
}
