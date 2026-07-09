"use client";

import { createClient } from "@/lib/supabase/client";

export async function confirmLeadSale(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("confirm_lead_sale", {
    p_lead_id: leadId,
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean; confirmation_id?: string; error?: string };
}

export async function createLead(input: {
  email: string;
  name: string;
  phone?: string | null;
  product_id?: string | null;
  source?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_lead", {
    p_email: input.email,
    p_name: input.name,
    p_phone: input.phone ?? undefined,
    p_product_id: input.product_id ?? undefined,
    p_source: input.source ?? "manual",
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean; lead_id?: string; error?: string };
}

export async function deleteLead(leadId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    throw error;
  }
}

export async function confirmCheckoutSale(eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("confirm_checkout_sale", {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean; confirmation_id?: string; error?: string };
}

export async function deleteCheckoutEvent(eventId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("checkout_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    throw error;
  }
}
