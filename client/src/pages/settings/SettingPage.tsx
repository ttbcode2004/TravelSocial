// pages/SettingsPage.tsx
import { useState } from "react";
import { User, Lock, Bell, Palette, Eye, Shield, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { cn } from "../../utils";
import ProfileSection from "../../components/setting/ProfileSection";
import PasswordSection from "../../components/setting/PasswordSection";
import NotificationsSection from "../../components/setting/NotificationsSection";
import AppearanceSection from "../../components/setting/AppearanceSection";
import PrivacySection from "../../components/setting/PrivacySection";
import DangerSection from "../../components/setting/DangerSection";

type Section = "profile" | "password" | "notifications" | "appearance" | "privacy" | "danger";

const SECTIONS = [
  { id: "profile" as Section, icon: User, label: "Hồ sơ cá nhân" },
  { id: "password" as Section, icon: Lock, label: "Mật khẩu" },
  { id: "notifications" as Section, icon: Bell, label: "Thông báo" },
  { id: "appearance" as Section, icon: Palette, label: "Giao diện" },
  { id: "privacy" as Section, icon: Eye, label: "Quyền riêng tư" },
  { id: "danger" as Section, icon: Shield, label: "Tài khoản & Bảo mật" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile");

  const renderContent = () => {
    switch (activeSection) {
      case "profile": return <ProfileSection />;
      case "password": return <PasswordSection />;
      case "notifications": return <NotificationsSection />;
      case "appearance": return <AppearanceSection />;
      case "privacy": return <PrivacySection />;
      case "danger": return <DangerSection />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Cài đặt</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all",
                  activeSection === id
                    ? "bg-primary-subtle text-primary font-medium"
                    : "hover:bg-bg-muted text-fg-muted hover:text-fg"
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
                <ChevronRight size={16} className="ml-auto opacity-40" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 card p-8">
          <h2 className="text-xl font-semibold mb-6">
            {SECTIONS.find((s) => s.id === activeSection)?.label}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}