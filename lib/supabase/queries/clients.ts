"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type ClientProfile = Tables<"profiles">;

export async function listClients() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function banClient(profileId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: true })
    .eq("id", profileId);

  if (error) throw error;
}

export async function unbanClient(profileId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: false })
    .eq("id", profileId);

  if (error) throw error;
}

export async function updateClientRole(profileId: string, role: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) throw error;
}

export async function transformClientToLead(profileId: string) {
  const supabase = createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id")
    .eq("id", profileId)
    .single();

  if (fetchError) throw fetchError;

  const { error: leadError } = await supabase.from("leads").insert({
    name: profile.full_name ?? "Sem nome",
    email: profile.id,
    organization_id: profile.organization_id,
    source: "client_conversion",
  });

  if (leadError) throw leadError;

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (deleteError) throw deleteError;
}