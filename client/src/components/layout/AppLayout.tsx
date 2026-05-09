import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home, MessageCircle, Map, ClipboardList, Bell,
  Users, User, LogOut, Sun, Moon, Monitor, Search,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useNotificationStore } from "../../stores/notification.store";
import { useConversationStore } from "../../stores/conversation.store";
import { useThemeStore } from "../../stores/theme.store";
import { cn } from "../../utils";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

const NAV = [
  { to: "/feed",          icon: Home,          label: "Bảng tin" },
  { to: "/chat",          icon: MessageCircle, label: "Tin nhắn" },
  { to: "/friends",       icon: Users,         label: "Bạn bè" },
  { to: "/map",           icon: Map,           label: "Bản đồ" },
  { to: "/plans",         icon: ClipboardList, label: "Kế hoạch" },
  { to: "/notifications", icon: Bell,          label: "Thông báo" },
];

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadNotif = useNotificationStore((s) => s.unreadCount);
  const unreadChat  = useConversationStore((s) => s.unreadTotal);
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  const cycleTheme = () => {
    const order: typeof theme[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-bg-subtle">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <span className="text-lg font-semibold text-fg">
            Travel<span className="text-primary">Social</span>
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-border">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                       bg-bg-muted text-fg-subtle text-sm hover:bg-border
                       transition-colors duration-150"
            onClick={() => {/* TODO: open search modal */}}
          >
            <Search size={14} />
            <span>Tìm kiếm...</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn("nav-item", isActive && "active")
              }
            >
              <div className="relative">
                <Icon size={20} />
                {to === "/notifications" && unreadNotif > 0 && (
                  <span className="notif-dot" />
                )}
                {to === "/chat" && unreadChat > 0 && (
                  <span className="notif-dot" />
                )}
              </div>
              <span className="flex-1">{label}</span>
              {to === "/notifications" && unreadNotif > 0 && (
                <span className="badge-danger badge text-xs">{unreadNotif > 99 ? "99+" : unreadNotif}</span>
              )}
              {to === "/chat" && unreadChat > 0 && (
                <span className="badge-primary badge text-xs">{unreadChat > 99 ? "99+" : unreadChat}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-1">
          {/* My profile */}
          {user && (
            <NavLink
              to={`/profile/${user.username}`}
              className={({ isActive }) =>
                cn("nav-item", isActive && "active")
              }
            >
              <Avatar src={user.avatarUrl} name={user.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-fg-subtle truncate">{user.email}</p>
              </div>
            </NavLink>
          )}

          <div className="flex gap-1">
            {/* Theme toggle */}
            <button className="btn-icon flex-1 justify-center" onClick={cycleTheme}>
              <ThemeIcon size={18} />
            </button>
            {/* Logout */}
            <button
              className="btn-icon flex-1 justify-center hover:text-danger hover:bg-danger/10"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}