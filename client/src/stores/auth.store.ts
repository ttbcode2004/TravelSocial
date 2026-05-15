import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import type { User } from "../types";
interface AuthResponse {
  success: boolean;
  user: User;
}
interface MessageResponse {
  success?: boolean;
  message: string;
}
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  // ─── Actions ───────────────

  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    message?: string;
  }>;

  register: (username: string, email: string, password: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  verifyEmail: (token: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  resendVerification: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  forgotPassword: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  resetPassword: (token: string, password: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  changePassword: (currentPassword: string, newPassword: string) => Promise<{
    success: boolean;
    message: string;
  }>;

  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),

      // Hàm chạy khi app start.
      initialize: async () => {
        if (get().isInitialized) {
          return;
        }

        try {
          set({ isLoading: true });

          const res = await api.get<{ user: User }>("/auth/me");

          set({user: res.data.user });

          connectSocket();
        } catch {
          set({ user: null });
        } finally {
          set({
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });

          const res = await api.post<AuthResponse>("/auth/login", {
            email,
            password,
          });

          set({ user: res.data.user});

          connectSocket();

          return {
            success: true,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Đăng nhập thất bại",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        try {
          set({ isLoading: true });

          const res = await api.post<MessageResponse>("/auth/register", {
            username,
            email,
            password,
          });

          return {
            success: true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Đăng ký thất bại",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (token) => {
        try {
          const res = await api.get<MessageResponse>(
            `/auth/verify-email?token=${token}`,
          );

          return {
            success: true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Xác nhận email thất bại",
          };
        }
      },

      resendVerification: async (email) => {
        try {
          const res = await api.post<MessageResponse>(
            "/auth/resend-verification",
            { email },
          );

          return {
            success: true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Không thể gửi lại email",
          };
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ isLoading: true });
          const res = await api.post<MessageResponse>("/auth/forgot-password", {
            email,
          });
          return {
            success: res.data.success ?? true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Có lỗi xảy ra",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, password) => {
        try {
          set({ isLoading: true });
          const res = await api.post<MessageResponse>("/auth/reset-password", {
            token,
            password,
          });

          return {
            success: true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message:
              err?.response?.data?.message ?? "Đặt lại mật khẩu thất bại",
          };
        } finally {
          set({ isLoading: false });
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          const res = await api.post<MessageResponse>("/auth/change-password", {
            currentPassword,
            newPassword,
          });

          return {
            success: true,
            message: res.data.message,
          };
        } catch (err: any) {
          return {
            success: false,
            message: err?.response?.data?.message ?? "Đổi mật khẩu thất bại",
          };
        }
      },

      refresh: async () => {
        try {
          const res = await api.post<AuthResponse>("/auth/refresh");

          set({
            user: res.data.user,
          });

          return true;
        } catch {
          set({user: null });

          return false;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // ignore
        } finally {
          disconnectSocket();

          set({
            user: null,
            isInitialized: true,
          });
        }
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user? {
                ...state.user,
                ...data,
              }
            : null,
        })),

      reset: () => {
        disconnectSocket();

        set({
          user: null,
          isLoading: false,
          isInitialized: false,
        });
      },
    }),
    {
      name: "auth-store",

      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

export const useUser = () => useAuthStore((s) => s.user);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
