"use client";

import { createClient } from "@/lib/supabase/client";

export async function listNotifications() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error) throw error;
  return data;
}

export function subscribeNotifications(onChange: () => void) {
  const supabase = createClient();
  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
