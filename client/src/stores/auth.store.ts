import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import type { User } from "../types";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),

      initialize: async () => {
        if (get().isInitialized) return;
        set({ isLoading: true });
        try {
          const res = await api.get<{ success: boolean; user: User }>("/auth/me");
          set({ user: res.data.user });
          connectSocket();
        } catch {
          set({ user: null });
        } finally {
          set({ isLoading: false, isInitialized: true });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post<{ success: boolean; user: User }>("/auth/login", {
            email,
            password,
          });
          set({ user: res.data.user });
          connectSocket();
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        const res = await api.post<{ success: boolean; message: string }>("/auth/register", {
          username,
          email,
          password,
        });
        return { message: res.data.message };
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          set({ user: null, isInitialized: false });
          disconnectSocket();
        }
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Convenience selector
export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user);