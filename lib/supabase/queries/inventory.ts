"use client";

import { createClient } from "@/lib/supabase/client";

export async function listInventoryMovements() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}
