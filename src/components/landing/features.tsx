"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    num: "01",
    name: "Any Bank, Anywhere",
    desc: "Works with every bank on earth. Upload a PDF, CSV, or XLSX statement — no Plaid connection, no credentials, no country restrictions. If your bank exports a file, LedgerLite reads it.",
    id: "import",
  },
  {
    num: "02",
    name: "AI Categorization",
    desc: "Every transaction is categorized the moment you upload. Merchants, subscriptions, transfers — the AI handles it automatically. No rules to write, no templates to configure.",
  },
  {
    num: "03",
    name: "Budgets & Goals",
    desc: "Set monthly spending limits per category and track savings targets with progress bars. See where you are before the month ends, not after.",
  },
  {
    num: "04",
    name: "Zero Sync Required",
    desc: "No bank connection to break. No re-authentication prompts. No third-party seeing your credentials. Drop a file, see your finances — that's the entire workflow.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>02</span>
          <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— WHY IT'S DIFFERENT</span>
        </div>
        <div className="mb-10 h-px w-72" style={{ background: "var(--land-rule)" }} />

        <h2 className="mb-16 text-3xl font-bold leading-tight tracking-tight lg:text-5xl" style={{ color: "var(--land-text)" }}>
          <span style={{ color: "var(--land-text)" }}>Works with every bank on earth.</span>
          <br />
          <span style={{ color: "var(--land-muted)" }}>No sync. No credentials. No limits.</span>
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
