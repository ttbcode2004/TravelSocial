import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuthStore } from "../stores/auth.store";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import {Spinner} from "../components/ui/Avatar";

// Lazy load pages
const LoginPage          = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage       = lazy(() => import("../pages/auth/RegisterPage"));
const FeedPage           = lazy(() => import("../pages/feed/FeedPage"));
const ProfilePage        = lazy(() => import("../pages/profile/ProfilePage"));
const ChatPage           = lazy(() => import("../pages/chat/ChatPage"));
const MapPage            = lazy(() => import("../pages/map/MapPage"));
const PlansPage          = lazy(() => import("../pages/plans/PlansPage"));
const PlanDetailPage     = lazy(() => import("../pages/plans/PlanDetailPage"));
const NotificationsPage  = lazy(() => import("../pages/notifications/NotificationsPage"));
const FriendsPage        = lazy(() => import("../pages/friends/FriendsPage"));

// ─── Auth guard ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="w-8 h-8 text-primary" />
    </div>
  );
}

function RequireAuth() {
  const { user, isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireGuest() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ─── Router ───────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ─── Guest routes ──────────────────────────────────────────
  {
    element: <RequireGuest />,

    children: [
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuthLayout />
          </Suspense>
        ),

        children: [
          {
            path: "/login",
            element: <LoginPage />,
          },

          {
            path: "/register",
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },

  // ─── Protected app routes ─────────────────────────────────
  {
    element: <RequireAuth />,

    children: [
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AppLayout />
          </Suspense>
        ),

        children: [
          {
            index: true,
            element: <Navigate to="/feed" replace />,
          },

          {
            path: "/feed",
            element: <FeedPage />,
          },

          {
            path: "/profile/:username",
            element: <ProfilePage />,
          },

          {
            path: "/chat",
            element: <ChatPage />,
          },

          {
            path: "/chat/:conversationId",
            element: <ChatPage />,
          },

          {
            path: "/map",
            element: <MapPage />,
          },

          {
            path: "/plans",
            element: <PlansPage />,
          },

          {
            path: "/plans/:planId",
            element: <PlanDetailPage />,
          },

          {
            path: "/friends",
            element: <FriendsPage />,
          },

          {
            path: "/notifications",
            element: <NotificationsPage />,
          },
        ],
      },
    ],
  },

  // ─── 404 ──────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/feed" replace />,
  },
]);