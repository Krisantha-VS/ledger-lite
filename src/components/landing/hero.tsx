"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AiTable } from "./ai-table";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ── Left ── */}
        <div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>01</span>
              <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— THE CASE FOR CLARITY</span>
            </div>
            <div className="mb-8 h-px" style={{ background: "var(--land-rule)" }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 font-bold leading-[1.05] tracking-tight"
            style={{
              fontSize: "clamp(44px, 5vw, 72px)",
              color: "var(--land-text)",
              borderLeft: "2px solid hsl(var(--ll-accent))",
              paddingLeft: "20px",
              marginLeft: "-22px",
            }}
          >
            Finally, a finance app
            <br />
            that works with your actual bank.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-base leading-relaxed lg:text-lg"
            style={{ color: "var(--land-muted)" }}
          >
            Upload any PDF, CSV, or Excel statement.
            <br />
            LedgerLite&apos;s AI categorizes every transaction automatically.
            <br />
            No credentials. No country restrictions. Just clarity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              Try free — any bank, anywhere <span className="opacity-70">→</span>
            </Link>
            <span className="text-xs" style={{ color: "var(--land-dim)" }}>
              Works with Wise · N26 · Chase · HDFC · and any bank worldwide
            </span>
          </motion.div>
        </div>

        {/* ── Right: AI Table ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <AiTable />
        </motion.div>
      </div>
    </section>
  );
}
