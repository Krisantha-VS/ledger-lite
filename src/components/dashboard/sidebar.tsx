"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Wallet, LayoutDashboard, ArrowUpDown, PiggyBank,
  Target, BarChart3, ChevronRight, Settings, Tag, Upload, Repeat2, Sparkles, Zap,
} from "lucide-react"
import { BrandMark } from "@/components/ui/brand-mark"
import { cn } from "@/shared/lib/utils"
import { useBilling, startCheckout } from "@/shared/hooks/useBilling"

const NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowUpDown },
  { href: "/import",       label: "Import",       icon: Upload },
  { href: "/accounts",     label: "Accounts",     icon: Wallet },
  { href: "/budgets",      label: "Budgets",      icon: PiggyBank },
  { href: "/subscriptions",label: "Subscriptions",icon: Repeat2 },
  { href: "/categories",   label: "Categories",   icon: Tag },
  { href: "/goals",        label: "Goals",        icon: Target },
  { href: "/reports",      label: "Reports",      icon: BarChart3 },
  { href: "/settings",     label: "Settings",     icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  const { data: billing } = useBilling()
  const isFree = !billing || billing.plan === "free"

  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--ll-bg-surface)] border-r border-[hsl(var(--ll-border))]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-[hsl(var(--ll-border))]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "hsl(var(--ll-accent) / 0.15)" }}>
          <BrandMark className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-accent))" }} />
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
          LedgerLite
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active ? "text-[hsl(var(--ll-accent))]" : "hover:text-[hsl(var(--ll-text-primary))]",
              )}
              style={{
                background:  active ? "hsl(var(--ll-accent) / 0.12)" : undefined,
                borderLeft:  active ? "3px solid hsl(var(--ll-accent))" : "3px solid transparent",
                paddingLeft: "9px",
                color: active ? undefined : "hsl(var(--ll-text-secondary))",
              }}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="ml-auto h-3 w-3" style={{ color: "hsl(var(--ll-accent) / 0.6)" }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--ll-border))] p-3">
        {isFree ? (
          <div className="rounded-xl p-3 space-y-2.5"
            style={{ background: "hsl(var(--ll-accent) / 0.08)", border: "1px solid hsl(var(--ll-accent) / 0.2)" }}>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-accent))" }} />
              <span className="text-xs font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
                Upgrade to Lite
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
              Unlimited transactions, 3 accounts, AI import
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => startCheckout("lite", "monthly")}
                className="rounded-lg py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "hsl(var(--ll-accent))" }}>
                $9/mo
              </button>
              <button onClick={() => startCheckout("lite", "annual")}
                className="rounded-lg py-1.5 text-[11px] font-medium transition-colors"
                style={{ color: "hsl(var(--ll-accent))", border: "1px solid hsl(var(--ll-accent) / 0.4)" }}>
                $7/mo <span style={{ color: "hsl(142 71% 45%)" }}>·save</span>
              </button>
            </div>
            <Link href="/settings/billing"
              className="flex items-center justify-center gap-1 text-[10px] transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--ll-text-muted))" }}>
              <Zap className="h-3 w-3" /> See all plans
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(var(--ll-income))" }} />
            <span className="text-xs capitalize" style={{ color: "hsl(var(--ll-text-muted))" }}>
              {billing.plan} plan
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
