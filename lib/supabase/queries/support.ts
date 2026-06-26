"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type SupportSessionRow = Tables<"support_sessions">;
export type SupportMessageRow = Tables<"support_messages">;

export type SupportTicketView = SupportSessionRow & {
  product?: Tables<"products"> | null;
};

export async function listWaitingSupportTickets() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("support_sessions")
    .select("*")
    .or(
      "and(status.eq.waiting,accepted_by.is.null),and(status.eq.in_progress,accepted_by.eq.ai,handled_by_type.eq.ai)",
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return hydrateSupportTickets(data ?? []);
}

export async function listMySupportTickets(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("support_sessions")
    .select("*")
    .eq("accepted_by", userId)
    .in("status", ["accepted", "in_progress"])
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return hydrateSupportTickets(data ?? []);
}

export async function listSupportMessages(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function acceptSupportTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_support_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data as { message?: string; session_id?: string; success?: boolean };
}

export async function takeOverAISupportTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("take_over_ai_support_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data as { message?: string; session_id?: string; success?: boolean };
}

export async function openSupportTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("open_support_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function closeSupportTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("close_support_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function transferSupportTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("transfer_support_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function sendSupportMessage(sessionId: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("send_support_message", {
    p_content: content,
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export function subscribeSupportQueue(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel("support-sessions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "support_sessions" },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeSupportMessages(
  sessionId: string,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`support-messages:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `session_id=eq.${sessionId}`,
        schema: "public",
        table: "support_messages",
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function hydrateSupportTickets(
  sessions: SupportSessionRow[],
): Promise<SupportTicketView[]> {
  if (sessions.length === 0) {
    return [];
  }

  const supabase = createClient();
  const productIds = sessions
    .map((session) => session.product_id)
    .filter(Boolean) as string[];

  const { data: products } = productIds.length
    ? await supabase.from("products").select("*").in("id", productIds)
    : { data: [] };

  return sessions.map((session) => ({
    ...session,
    product:
      products?.find((product) => product.id === session.product_id) ?? null,
  }));
}
