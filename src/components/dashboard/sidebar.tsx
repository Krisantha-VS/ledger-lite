"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet, LayoutDashboard, ArrowUpDown, PiggyBank,
  Target, BarChart3, ChevronRight, Settings, Tag, Upload, Repeat2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowUpDown },
  { href: "/import",       label: "Import",       icon: Upload },
  { href: "/accounts",     label: "Accounts",     icon: Wallet },
  { href: "/budgets",       label: "Budgets",        icon: PiggyBank },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat2 },
  { href: "/categories",   label: "Categories",   icon: Tag },
  { href: "/goals",        label: "Goals",        icon: Target },
  { href: "/reports",      label: "Reports",      icon: BarChart3 },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="flex h-full w-64 flex-col bg-[var(--ll-bg-surface)] border-r border-[hsl(var(--ll-border))]"
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center gap-2.5 px-5 border-b border-[hsl(var(--ll-border))]"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "hsl(var(--ll-accent) / 0.15)" }}
        >
          <Wallet className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-accent))" }} />
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
          LedgerLite
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "text-[hsl(var(--ll-accent))]"
                  : "hover:text-[hsl(var(--ll-text-primary))]",
              )}
              style={{
                background:  active ? "hsl(var(--ll-accent) / 0.12)" : undefined,
                borderLeft:  active ? "3px solid hsl(var(--ll-accent))" : "3px solid transparent",
                paddingLeft: "9px",
                color: active ? undefined : "hsl(var(--ll-text-secondary))",
              }}
            >
              <Icon className={cn("h-4 w-4 shrink-0")} />
              {label}
              {active && (
                <ChevronRight
                  className="ml-auto h-3 w-3"
                  style={{ color: "hsl(var(--ll-accent) / 0.6)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: version badge */}
      <div className="p-4 border-t border-[hsl(var(--ll-border))]">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "hsl(var(--ll-income))" }}
          />
          <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            LedgerLite v0.1
          </span>
        </div>
      </div>
    </aside>
  );
}
