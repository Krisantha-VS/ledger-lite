"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet, LayoutDashboard, ArrowUpDown, PiggyBank,
  Target, BarChart3, Settings, Tag, Upload, ChevronRight
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV = [
  { href: "/v2",           label: "Overview",     icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowUpDown },
  { href: "/accounts",     label: "Accounts",     icon: Wallet },
  { href: "/budgets",      label: "Budgets",      icon: PiggyBank },
  { href: "/goals",        label: "Goals",        icon: Target },
  { href: "/reports",      label: "Analysis",     icon: BarChart3 },
];

const SECONDARY_NAV = [
  { href: "/categories",   label: "Categories",   icon: Tag },
  { href: "/import",       label: "Data Import",  icon: Upload },
  { href: "/settings",     label: "Preferences",  icon: Settings },
];

export function SidebarV2() {
  const path = usePathname();

  return (
    <aside
      className="flex h-full w-64 flex-col border-r bg-[hsl(var(--v2-surface))] px-4 py-6"
      style={{ borderColor: "hsl(var(--v2-border))" }}
    >
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--v2-accent))] text-white shadow-sm">
          <Wallet className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">
            LedgerLite
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--v2-text-muted))]">
            Enterprise
          </span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="space-y-1">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">
          Main Menu
        </p>
        {NAV.map((item) => (
          <NavItem key={item.href} item={item} active={path === item.href} />
        ))}
      </div>

      {/* Secondary Nav */}
      <div className="mt-8 space-y-1">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">
          System
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavItem key={item.href} item={item} active={path === item.href} />
        ))}
      </div>

      {/* Profile / Bottom */}
      <div className="mt-auto border-t pt-4" style={{ borderColor: "hsl(var(--v2-border))" }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-[hsl(var(--v2-accent)/0.1)] flex items-center justify-center text-[hsl(var(--v2-accent))] text-xs font-bold">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-xs font-semibold text-[hsl(var(--v2-text-primary))]">John Doe</span>
            <span className="truncate text-[10px] text-[hsl(var(--v2-text-muted))]">Premium Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, active }: { item: typeof NAV[0]; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "v2-sidebar-item group flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium",
        active
          ? "bg-[hsl(var(--v2-accent)/0.08)] text-[hsl(var(--v2-accent))]"
          : "text-[hsl(var(--v2-text-muted))] hover:text-[hsl(var(--v2-text-primary))]"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--v2-accent))]" : "text-[hsl(var(--v2-text-muted))] group-hover:text-[hsl(var(--v2-text-primary))]")} />
      {item.label}
      {active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
    </Link>
  );
}
