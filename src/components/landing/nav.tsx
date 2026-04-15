import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";

export function LandingNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "#6366F1" }}
          >
            <BrandMark className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-white">LedgerLite</span>
            <span
              className="text-[9px] font-medium uppercase tracking-[0.15em]"
              style={{ color: "#4B4B5A" }}
            >
              Personal Finance
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm transition-colors hover:text-white"
            style={{ color: "#71717A" }}
          >
            Features
          </a>
          <a
            href="#import"
            className="text-sm transition-colors hover:text-white"
            style={{ color: "#71717A" }}
          >
            AI Import
          </a>
          <Link
            href="/login"
            className="rounded px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
            style={{ background: "#6366F1" }}
          >
            Sign in
          </Link>
        </nav>

        {/* Mobile sign in */}
        <Link
          href="/login"
          className="text-sm font-medium md:hidden"
          style={{ color: "#6366F1" }}
        >
          Sign in →
        </Link>
      </div>
    </header>
  );
}
