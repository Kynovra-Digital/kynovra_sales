import { create } from "zustand";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  readAt?: string;
};

type NotificationState = {
  isOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  setOpen: (isOpen: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  isOpen: false,
  notifications: [],
  unreadCount: 0,
  setOpen: (isOpen) => set({ isOpen }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.readAt)
        .length,
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),
}));
