import { useEffect} from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import { useThemeStore } from "./stores/theme.store";
import SocketInit from "./components/socket/SocketInit";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  useThemeStore((s) => s.resolvedTheme); // subscribe to init theme on mount

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* <Navbar /> */}
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
