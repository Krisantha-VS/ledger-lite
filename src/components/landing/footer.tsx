import { BrandMark } from "@/components/ui/brand-mark";

export function LandingFooter() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: "rgba(99,102,241,0.15)" }}
            >
              <BrandMark className="h-2.5 w-2.5" style={{ color: "#6366F1" }} />
            </div>
            <span className="text-sm font-medium" style={{ color: "#71717A" }}>
              LedgerLite
            </span>
            <span className="text-xs" style={{ color: "#2D2D3A" }}>
              © 2025 All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs transition-colors hover:text-white"
              style={{ color: "#4B4B5A" }}
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs transition-colors hover:text-white"
              style={{ color: "#4B4B5A" }}
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs transition-colors hover:text-white"
              style={{ color: "#4B4B5A" }}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
