"use client";

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { applyTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function select(value: ThemePreference) {
    setTheme(value);
    if (value === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    }
    applyTheme(value);
  }

  return (
    <div className="flex bg-surface-1 rounded-full p-1 gap-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-medium transition-colors ${
              active ? "bg-accent-bg text-accent-text" : "text-text-muted"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
