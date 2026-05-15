import {
  Home,
  MessageCircle,
  Map,
  ClipboardList,
  Bell,
  Users,
  ArrowDown,
  ArrowRight,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNotificationStore } from "../../stores/notification.store";
import { useConversationStore } from "../../stores/conversation.store";
import { cn } from "../../utils";

const NAV = [
  { to: "/feed", icon: Home, label: "Bảng tin" },
  { to: "/chat", icon: MessageCircle, label: "Tin nhắn" },
  { to: "/friends", icon: Users, label: "Bạn bè" },
  { to: "/map", icon: Map, label: "Bản đồ" },
  { to: "/plans", icon: ClipboardList, label: "Kế hoạch" },
  { to: "/notifications", icon: Bell, label: "Thông báo" },
  { to: "/settings", icon: Settings, label: "Cài đặt" },
];

export default function AppNavbar() {
  const unreadNotif = useNotificationStore((s) => s.unreadCount);
  const unreadChat = useConversationStore((s) => s.unreadTotal);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn("nav-item", isActive && "active")}
        >
          <div className="relative">
            <Icon size={20} />
            {to === "/notifications" && unreadNotif > 0 && (
              <span className="notif-dot" />
            )}
            {to === "/chat" && unreadChat > 0 && <span className="notif-dot" />}
          </div>
          <span className="flex-1">{label}</span>
          <button>
            <ArrowRight size={14} />
          </button>
          {to === "/notifications" && unreadNotif > 0 && (
            <span className="badge-danger badge text-xs">
              {unreadNotif > 99 ? "99+" : unreadNotif}
            </span>
          )}
          {to === "/chat" && unreadChat > 0 && (
            <span className="badge-primary badge text-xs">
              {unreadChat > 99 ? "99+" : unreadChat}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
