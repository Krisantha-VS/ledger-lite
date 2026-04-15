import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "./theme-toggle";

export function LandingNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "var(--land-nav-bg)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--land-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            <BrandMark className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold" style={{ color: "var(--land-text)" }}>
              LedgerLite
            </span>
            <span
              className="text-[9px] font-medium uppercase tracking-[0.15em]"
              style={{ color: "var(--land-dim)" }}
            >
              Personal Finance
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Nav links — hidden on mobile */}
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm transition-colors"
              style={{ color: "var(--land-muted)" }}
            >
              Features
            </a>
            <a
              href="#import"
              className="text-sm transition-colors"
              style={{ color: "var(--land-muted)" }}
            >
              AI Import
            </a>
          </nav>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Sign in */}
          <Link
            href="/login"
            className="hidden rounded px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-85 md:inline-flex"
            style={{ background: "hsl(var(--ll-accent))" }}
          >
            Sign in
          </Link>

          {/* Mobile sign in */}
          <Link
            href="/login"
            className="text-sm font-medium md:hidden"
            style={{ color: "hsl(var(--ll-accent))" }}
          >
            Sign in →
          </Link>
        </div>
      </div>
    </header>
  );
}
