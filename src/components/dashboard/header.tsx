"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, TrendingUp, TrendingDown } from "lucide-react";
import { clearTokens } from "@/shared/lib/auth-client";
import { useDashboardSummary } from "@/features/summary/hooks/useSummary";
import { formatCurrency } from "@/shared/lib/formatters";

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { summary } = useDashboardSummary();

  const logout = () => {
    clearTokens();
    router.replace("/login");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6"
      style={{
        background: "var(--ll-bg-base)",
        borderBottom: "1px solid hsl(var(--ll-border))",
      }}
    >
      {/* Month summary */}
      <div className="flex items-center gap-4">
        {summary && (
          <>
            <div className="hidden items-center gap-1.5 sm:flex">
              <TrendingUp className="h-3.5 w-3.5 ll-income" />
              <span className="ll-mono text-xs ll-income">
                {formatCurrency(summary.monthIncome)}
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <TrendingDown className="h-3.5 w-3.5 ll-expense" />
              <span className="ll-mono text-xs ll-expense">
                {formatCurrency(summary.monthExpenses)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="ll-focus-ring rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "hsl(var(--ll-text-muted))" }}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 hidden dark:block" />
          <Moon className="h-4 w-4 block dark:hidden" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="ll-focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-rose-500/10"
          style={{ color: "hsl(var(--ll-text-muted))" }}
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
