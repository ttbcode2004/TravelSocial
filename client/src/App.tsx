
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import { useThemeStore } from "./stores/theme.store";
import { useNotificationStore } from "./stores/notification.store";
import { useConversationStore } from "./stores/conversation.store";
import { usePresenceStore } from "./stores/presence.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function SocketInit() {
  const user = useAuthStore((s) => s.user);
  const initNotif = useNotificationStore((s) => s.initSocketListeners);
  const initConv = useConversationStore((s) => s.initSocketListeners);
  const initPresence = usePresenceStore((s) => s.initSocketListeners);
  const fetchUnread = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchConvUnread = useConversationStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    if (!user) return;
    const offNotif = initNotif();
    const offConv = initConv();
    const offPresence = initPresence();
    fetchUnread();
    fetchConvUnread();
    return () => { offNotif(); offConv(); offPresence(); };
  }, [user]);

  return null;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useThemeStore(); // subscribe to init theme on mount

  useEffect(() => { initialize(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <SocketInit />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--bg-elevated))",
            color: "hsl(var(--fg))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}