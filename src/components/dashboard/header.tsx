"use client";

import { Plus, TrendingUp, TrendingDown } from "lucide-react";

export function Header() {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6"
      style={{
        background: "var(--ll-bg-base)",
        borderBottom: "1px solid hsl(var(--ll-border))",
      }}
    >
      {/* Month summary — populated by page-level data in P1 */}
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 sm:flex">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-income))" }} />
          <span className="ll-mono text-xs" style={{ color: "hsl(var(--ll-income))" }}>
            $0.00
          </span>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <TrendingDown className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-expense))" }} />
          <span className="ll-mono text-xs" style={{ color: "hsl(var(--ll-expense))" }}>
            $0.00
          </span>
        </div>
      </div>

      {/* Primary action */}
      <button
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-150 active:scale-[0.97]"
        style={{ background: "hsl(var(--ll-accent))" }}
        onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--ll-accent-hover))")}
        onMouseLeave={e => (e.currentTarget.style.background = "hsl(var(--ll-accent))")}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add Transaction</span>
      </button>
    </header>
  );
}
