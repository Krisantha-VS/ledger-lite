import Link from "next/link";

export function CTA() {
  return (
    <section className="border-t" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>04</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— START NOW</span>
        </div>
        <div className="mb-10 h-px w-72" style={{ background: "var(--land-rule)" }} />

        <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight lg:text-5xl" style={{ color: "var(--land-text)" }}>
          Import your first statement.
          <br />
          It takes thirty seconds.
        </h2>
        <p className="mb-8 text-sm" style={{ color: "var(--land-muted)" }}>
          Free to start. No credit card required.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          Import a statement →
        </Link>

        <p className="mt-6 text-sm" style={{ color: "var(--land-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="transition-colors hover:opacity-80" style={{ color: "hsl(var(--ll-accent))" }}>
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
