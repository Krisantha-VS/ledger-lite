"use client";

import { motion } from "framer-motion";

const FEATURES = [
  { num: "01", name: "AI Import",      desc: "Drag any bank statement — PDF, CSV, XLSX, OFX. Parsed in under a second, categorised automatically. No template required.", id: "import" },
  { num: "02", name: "Budgets",        desc: "Set spending limits per category. See exactly where you are overspending before the month ends." },
  { num: "03", name: "Subscriptions",  desc: "Every recurring charge surfaced in one view. Cancel the ones you forgot you had." },
  { num: "04", name: "Analytics",      desc: "Income, expenses, and trends — charts that show signal, not noise. No dashboard bloat." },
];

export function Features() {
  return (
    <section id="features" className="border-t" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>02</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— WHAT IT DOES</span>
        </div>
        <div className="mb-10 h-px w-72" style={{ background: "var(--land-rule)" }} />

        <h2 className="mb-16 text-3xl font-bold leading-tight tracking-tight lg:text-5xl" style={{ color: "var(--land-text)" }}>
          Every tool you need.
          <br />
          Nothing you don&apos;t.
        </h2>

        <div style={{ borderTop: "1px solid var(--land-border)" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.num}
              id={f.id}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="grid items-start gap-6 border-b py-6 lg:grid-cols-[48px_180px_1fr_32px] lg:items-center lg:gap-8"
              style={{ borderColor: "var(--land-border)" }}
            >
              <span className="font-mono text-[11px]" style={{ color: "hsl(var(--ll-accent))", opacity: 0.5 }}>{f.num}</span>
              <span className="text-base font-semibold lg:text-lg" style={{ color: "var(--land-text)" }}>{f.name}</span>
              <span className="text-sm leading-relaxed" style={{ color: "var(--land-muted)" }}>{f.desc}</span>
              <span className="hidden lg:block text-sm" style={{ color: "hsl(var(--ll-accent))", opacity: 0.35 }}>→</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
