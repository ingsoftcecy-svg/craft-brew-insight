import { Moon, Sun, Laptop } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-md hover:bg-secondary text-foreground transition-colors"
      title={`Tema actual: ${theme}`}
    >
      {theme === "light" && <Sun className="h-5 w-5 text-primary" />}
      {theme === "dark" && <Moon className="h-5 w-5 text-primary" />}
      {theme === "system" && <Laptop className="h-5 w-5 text-foreground" />}
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
