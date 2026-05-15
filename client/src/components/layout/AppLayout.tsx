import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useAppStore } from "../../stores/app.store";
import { cn } from "../../utils";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";
import AppNavbar from "../navbar/AppNavbar";
import SearchUtils from "../search/Search";
import ChangeTheme from "../theme/ChangeTheme";

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const closeSidebar = useAppStore((s) => s.closeSidebar);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed md:static z-50 top-0 left-0 h-full w-64 flex-shrink-0 flex flex-col border-r border-border bg-bg-subtle transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <span className="text-lg font-semibold text-fg">
            Travel<span className="text-primary">Social</span>
          </span>

          {/* Close mobile */}
          <button
            className="md:hidden btn-icon"
            onClick={closeSidebar}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-border">
          <SearchUtils />
        </div>

        <AppNavbar />

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-1 mt-auto">
          {user && (
            <NavLink
              to={`/profile/${user.username}`}
              onClick={closeSidebar}
              className={({ isActive }) =>
                cn("nav-item", isActive && "active")
              }
            >
              <Avatar src={user.avatarUrl} name={user.username} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.username}
                </p>

                <p className="text-xs text-fg-subtle truncate">
                  {user.email}
                </p>
              </div>
            </NavLink>
          )}

          <div className="flex gap-1">
            <ChangeTheme />

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
        {/* Mobile header */}
        <div className="md:hidden h-16 flex items-center px-4 border-b border-border bg-bg">
          <button
            className="btn-icon"
            onClick={toggleSidebar}
          >
            <Menu size={22} />
          </button>

          <span className="ml-3 font-semibold">
            Travel<span className="text-primary">Social</span>
          </span>

          <div className="px-3 py-3 border-b border-border w-full">
            <SearchUtils />
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}