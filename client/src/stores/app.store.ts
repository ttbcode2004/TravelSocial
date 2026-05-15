// src/stores/app.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  sidebarOpen: boolean;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,

      openSidebar: () => set({ sidebarOpen: true }),

      closeSidebar: () => set({ sidebarOpen: false }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);