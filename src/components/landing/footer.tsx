import { BrandMark } from "@/components/ui/brand-mark";

export function LandingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: "hsl(var(--ll-accent) / 0.12)" }}
            >
              <BrandMark className="h-2.5 w-2.5" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--land-muted)" }}>LedgerLite</span>
            <span className="text-xs" style={{ color: "var(--land-dim)" }}>© 2025 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((label) => (
              <a key={label} href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: "var(--land-dim)" }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
