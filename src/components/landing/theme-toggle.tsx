"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { key: "light",  Icon: Sun,     label: "Light"  },
  { key: "dark",   Icon: Moon,    label: "Dark"   },
  { key: "system", Icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-[120px] rounded-lg" style={{ background: "var(--land-border)" }} />;

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{
        background: "var(--land-card)",
        border: "1px solid var(--land-border)",
      }}
    >
      {OPTIONS.map(({ key, Icon, label }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={label}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all"
            style={{
              background: active ? "hsl(var(--ll-accent))" : "transparent",
              color: active ? "#ffffff" : "var(--land-muted)",
            }}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
