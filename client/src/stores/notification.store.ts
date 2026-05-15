// stores/notification.store.ts
import { create } from "zustand";
import { api } from "../lib/api";
import { onSocket } from "../lib/socket";
import type { Notification } from "../types";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  nextCursor: string | null;

  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (n: Notification) => void;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  initSocketListeners: () => () => void; // trả về cleanup function
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  nextCursor: null,

  fetchNotifications: async (reset = false) => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const cursor = reset ? undefined : get().nextCursor;
      const res = await api.get("/notifications", { params: { cursor, limit: 20 } });
      const { items, nextCursor } = res.data;

      set((state) => ({
        notifications: reset ? items : [...state.notifications, ...items],
        nextCursor,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get("/notifications/unread");
      set({ unreadCount: res.data?.data?.total ?? 0 });
    } catch {
      set({ unreadCount: 0 });
    }
  },

  markAsRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await api.patch("/notifications/read-all");
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    }));
  },

  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearAll: async () => {
    await api.delete("/notifications");
    set({ notifications: [], unreadCount: 0, nextCursor: null });
  },

  // ====================== SOCKET ======================
  initSocketListeners: () => {
    const offNew = onSocket<Notification>("notification:new", (n) => {
      get().addNotification(n);
    });

    const offReadAll = onSocket("notification:read_all", () => {
      set({ unreadCount: 0 });
    });

    return () => {
      offNew();
      offReadAll();
    };
  },
}));