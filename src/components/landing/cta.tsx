import Link from "next/link";

export function CTA() {
  return (
    <section
      className="border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        {/* Section tag */}
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "#6366F1" }}>
            03
          </span>
          <span className="font-mono text-[11px]" style={{ color: "#71717A" }}>
            — START NOW
          </span>
        </div>
        <div
          className="mb-10 h-px w-72"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
          Import your first statement.
          <br />
          It takes thirty seconds.
        </h2>
        <p className="mb-8 text-sm" style={{ color: "#71717A" }}>
          Free to start. No credit card required.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "#6366F1" }}
        >
          Import a statement →
        </Link>

        <p className="mt-6 text-sm" style={{ color: "#71717A" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="transition-colors hover:text-white"
            style={{ color: "#6366F1" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
