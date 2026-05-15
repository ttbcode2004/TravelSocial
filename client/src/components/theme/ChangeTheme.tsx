import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../stores/theme.store";

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

export default function ChangeTheme() {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    const order: (typeof theme)[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
  };

  const ThemeIcon = THEME_ICONS[theme];
  return (
    <button className="btn-icon flex-1 justify-center" onClick={cycleTheme}>
      <ThemeIcon size={18} />
    </button>
  );
}
