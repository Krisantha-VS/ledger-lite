import Link from "next/link";

export function CTA() {
  const hooks = ["Freelancer?", "Expat?", "Left Mint?"];

  return (
    <section className="border-t" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>05</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— GET STARTED</span>
        </div>
        <div className="mb-10 h-px w-72" style={{ background: "var(--land-rule)" }} />

        <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight lg:text-5xl" style={{ color: "var(--land-text)" }}>
          Your bank works with LedgerLite.
          <br />
          <span style={{ color: "var(--land-muted)" }}>Every bank. Anywhere in the world.</span>
        </h2>

        <div className="mb-6 hidden md:flex items-center gap-2">
          {hooks.map((hook) => (
            <div
              key={hook}
              style={{
                background: "var(--land-card)",
                border: "1px solid var(--land-border)",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "11px",
                color: "var(--land-muted)",
              }}
            >
              {hook}
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          Try free — upload any statement →
        </Link>

        <p className="mt-4 text-xs" style={{ color: "var(--land-dim)" }}>
          Free forever · No credit card · Works with any bank worldwide
        </p>
      </div>
    </section>
  );
}
