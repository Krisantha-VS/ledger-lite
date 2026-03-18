"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, Wallet, Target, Settings, Tag } from "lucide-react";

const NAV = [
  { href: "/",             label: "Home",     icon: LayoutDashboard },
  { href: "/transactions", label: "Txns",     icon: ArrowRightLeft },
  { href: "/accounts",     label: "Accounts",    icon: Wallet },
  { href: "/categories",   label: "Categories", icon: Tag },
  { href: "/goals",        label: "Goals",      icon: Target },
  { href: "/settings",     label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden"
      style={{
        background: "hsl(var(--ll-bg-surface) / 0.95)",
        borderTop: "1px solid hsl(var(--ll-border))",
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3.5 transition-colors"
            style={{ color: active ? "hsl(var(--ll-accent))" : "hsl(var(--ll-text-muted))" }}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
