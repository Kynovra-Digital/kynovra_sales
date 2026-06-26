"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type SalesSessionRow = Tables<"sales_sessions">;
export type SalesMessageRow = Tables<"sales_messages">;

export type SalesTicketView = SalesSessionRow & {
  lead?: Tables<"leads"> | null;
  product?: Tables<"products"> | null;
};

export async function listWaitingSalesTickets() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales_sessions")
    .select("*")
    .or(
      "and(status.eq.waiting,accepted_by.is.null),and(status.eq.in_progress,accepted_by.eq.ai,handled_by_type.eq.ai)",
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return hydrateSalesTickets(data ?? []);
}

export async function listMySalesTickets(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales_sessions")
    .select("*")
    .eq("accepted_by", userId)
    .in("status", ["accepted", "in_progress"])
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return hydrateSalesTickets(data ?? []);
}

export async function listSalesMessages(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function acceptSalesTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_sales_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data as { message?: string; session_id?: string; success?: boolean };
}

export async function takeOverAISalesTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("take_over_ai_sales_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data as { message?: string; session_id?: string; success?: boolean };
}

export async function openSalesTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("open_sales_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function closeSalesTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("close_sales_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function transferSalesTicket(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("transfer_sales_ticket", {
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export async function sendSalesMessage(sessionId: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("send_sales_message", {
    p_content: content,
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}

export function subscribeSalesQueue(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel("sales-sessions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sales_sessions" },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeSalesMessages(
  sessionId: string,
  onChange: () => void,
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`sales-messages:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `session_id=eq.${sessionId}`,
        schema: "public",
        table: "sales_messages",
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

async function hydrateSalesTickets(
  sessions: SalesSessionRow[],
): Promise<SalesTicketView[]> {
  if (sessions.length === 0) {
    return [];
  }

  const supabase = createClient();
  const leadIds = sessions.map((session) => session.lead_id).filter(Boolean);
  const productIds = sessions.map((session) => session.product_id);

  const [{ data: leads }, { data: products }] = await Promise.all([
    leadIds.length
      ? supabase
          .from("leads")
          .select("*")
          .in("id", leadIds as string[])
      : Promise.resolve({ data: [] }),
    productIds.length
      ? supabase.from("products").select("*").in("id", productIds)
      : Promise.resolve({ data: [] }),
  ]);

  return sessions.map((session) => ({
    ...session,
    lead: leads?.find((lead) => lead.id === session.lead_id) ?? null,
    product:
      products?.find((product) => product.id === session.product_id) ?? null,
  }));
}
