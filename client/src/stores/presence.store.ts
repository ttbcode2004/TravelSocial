import { create } from "zustand";
import { onSocket } from "../lib/socket";

interface PresenceStore {
  onlineUsers: Set<string>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  isOnline: (userId: string) => boolean;
  initSocketListeners: () => () => void;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Set(),

  setOnline: (userId) =>
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })),

  setOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  isOnline: (userId) => get().onlineUsers.has(userId),

  initSocketListeners: () => {
    const offOnline = onSocket<{ userId: string }>("presence:online", ({ userId }) => {
      get().setOnline(userId);
    });

    const offOffline = onSocket<{ userId: string }>("presence:offline", ({ userId }) => {
      get().setOffline(userId);
    });

    return () => { offOnline(); offOffline(); };
  },
}));