"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Keyboard, Bell, Search, Settings } from "lucide-react";
import { clearTokens } from "@/shared/lib/auth-client";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";

export function HeaderV2() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const logout = () => {
    clearTokens();
    router.replace("/login");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b bg-[hsl(var(--v2-surface))] px-8"
      style={{ borderColor: "hsl(var(--v2-border))" }}
    >
      {/* Search Bar Placeholder */}
      <div className="flex flex-1 items-center max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--v2-text-muted))] group-focus-within:text-[hsl(var(--v2-accent))] transition-colors" />
          <input
            type="text"
            placeholder="Search transactions, accounts, or reports..."
            className="h-9 w-full rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-bg))] pl-9 pr-4 text-xs text-[hsl(var(--v2-text-primary))] outline-none focus:border-[hsl(var(--v2-accent)/0.5)] focus:ring-1 focus:ring-[hsl(var(--v2-accent)/0.2)] transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-focus-within:opacity-100 transition-opacity">
            <kbd className="rounded border bg-[hsl(var(--v2-surface))] px-1.5 py-0.5 text-[8px] font-bold text-[hsl(var(--v2-text-muted))]">⌘</kbd>
            <kbd className="rounded border bg-[hsl(var(--v2-surface))] px-1.5 py-0.5 text-[8px] font-bold text-[hsl(var(--v2-text-muted))]">K</kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-[hsl(var(--v2-surface))]" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setHelpOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-[hsl(var(--v2-border))]" />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] transition-colors"
        >
          <Sun className="h-4 w-4 hidden dark:block" />
          <Moon className="h-4 w-4 block dark:hidden" />
        </button>

        {/* Settings */}
        <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] text-[hsl(var(--v2-text-muted))] hover:bg-[hsl(var(--v2-bg))] transition-colors">
          <Settings className="h-4 w-4" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="ml-2 flex h-9 items-center gap-2 rounded-md bg-rose-500/10 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>

      <KeyboardShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
