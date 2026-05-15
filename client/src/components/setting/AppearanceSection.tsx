// components/settings/AppearanceSection.tsx
import { useThemeStore } from "../../stores/theme.store";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "../../utils";

const THEMES = [
  { id: "light" as const, icon: Sun, label: "Sáng" },
  { id: "dark" as const, icon: Moon, label: "Tối" },
  { id: "system" as const, icon: Monitor, label: "Hệ thống" },
];

export default function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-4">Chế độ giao diện</h3>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                theme === id
                  ? "border-primary bg-primary-subtle/50"
                  : "border-border hover:border-border-strong hover:bg-bg-muted"
              )}
            >
              <Icon size={28} className={theme === id ? "text-primary" : "text-fg-muted"} />
              <span className={cn("font-medium", theme === id ? "text-primary" : "text-fg-muted")}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-fg-subtle mt-4">
          Hiện đang dùng: <strong>{resolvedTheme === "dark" ? "Chế độ tối" : "Chế độ sáng"}</strong>
        </p>
      </div>
    </div>
  );
}