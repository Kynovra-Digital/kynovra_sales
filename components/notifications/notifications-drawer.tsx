"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from "@/lib/supabase/queries/notifications";
import { queryKeys } from "@/lib/supabase/query-keys";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationsDrawer() {
  const queryClient = useQueryClient();
  const isOpen = useNotificationStore((state) => state.isOpen);
  const setOpen = useNotificationStore((state) => state.setOpen);
  const { data: notifications = [], isLoading } = useQuery({
    queryFn: listNotifications,
    queryKey: queryKeys.notifications.list,
  });

  useEffect(
    () =>
      subscribeNotifications(() => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list,
        });
      }),
    [queryClient],
  );

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Falha ao marcar notificação.",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list,
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao marcar todas notificações.",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list,
      });
    },
  });

  function handleReadAll() {
    void markAllMutation.mutate();
  }

  function handleMarkRead(notificationId: string) {
    void markReadMutation.mutate(notificationId);
  }

  return (
    <Sheet onOpenChange={setOpen} open={isOpen}>
      <SheetContent className="premium-scrollbar w-full overflow-y-auto sm:max-w-md lg:max-w-lg">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
          <SheetDescription>
            Eventos reais de vendas, suporte, IA, estoque e sistema.
          </SheetDescription>
        </SheetHeader>
        <div className="px-3 pb-3 sm:px-4">
          <Button
            disabled={markAllMutation.isPending || notifications.length === 0}
            onClick={handleReadAll}
            size="sm"
            variant="outline"
          >
            {markAllMutation.isPending
              ? "Marcando..."
              : "Marcar todas como lidas"}
          </Button>
        </div>
        <div className="flex flex-col gap-3 px-3 pb-6 sm:px-4">
          {isLoading ? (
            <div className="glass-card rounded-lg p-3 text-muted-foreground text-sm">
              Carregando notificações...
            </div>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <div className="glass-card rounded-lg p-3" key={notification.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                      {notification.body ?? "Evento registrado no Supabase."}
                    </p>
                  </div>
                  <StatusBadge
                    label={notification.read_at ? "Lida" : "Requer revisão"}
                  />
                </div>
                <Button
                  className="mt-3 gap-2"
                  disabled={
                    markReadMutation.isPending || Boolean(notification.read_at)
                  }
                  onClick={() => handleMarkRead(notification.id)}
                  size="sm"
                  variant="outline"
                >
                  <ExternalLink data-icon="inline-start" />
                  {markReadMutation.isPending &&
                  markReadMutation.variables === notification.id
                    ? "Marcando..."
                    : "Marcar como lida"}
                </Button>
              </div>
            ))
          ) : (
            <div className="glass-card rounded-lg p-3 text-muted-foreground text-sm">
              Nenhuma notificação por enquanto.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
