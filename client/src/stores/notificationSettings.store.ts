// stores/notification-settings.store.ts
import { create } from "zustand";
import { api } from "../lib/api";
import toast from "react-hot-toast";

interface NotificationSetting {
  type: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
}

interface NotificationSettingsStore {
  settings: NotificationSetting[];
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: (type: string, field: "inApp" | "push" | "email", value: boolean) => Promise<void>;
}

export const useNotificationSettingsStore = create<NotificationSettingsStore>((set, get) => ({
  settings: [],
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/notifications/settings");
      set({ settings: res.data.data || [] });
    } catch {
      set({ settings: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSetting: async (type, field, value) => {
    try {
      await api.patch("/notifications/settings", {
        settings: [{ type, [field]: value }],
      });

      set((state) => ({
        settings: state.settings.map((s) =>
          s.type === type ? { ...s, [field]: value } : s
        ),
      }));

      toast.success("Đã cập nhật cài đặt");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Cập nhật thất bại");
    }
  },
}));