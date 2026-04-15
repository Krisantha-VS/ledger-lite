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
          {/* Section tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold" style={{ color: "#6366F1" }}>
                01
              </span>
              <span className="font-mono text-[11px]" style={{ color: "#71717A" }}>
                — THE CASE FOR CLARITY
              </span>
            </div>
            <div
              className="mb-8 h-px"
              style={{ background: "rgba(255,255,255,0.07)", width: "100%" }}
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 font-bold leading-[1.05] tracking-tight text-white"
            style={{
              fontSize: "clamp(44px, 5vw, 72px)",
              borderLeft: "2px solid #6366F1",
              paddingLeft: "20px",
              marginLeft: "-22px",
            }}
          >
            Your finances,
            <br />
            cleared.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-base leading-relaxed lg:text-lg"
            style={{ color: "#71717A" }}
          >
            Drop a PDF. Get a spreadsheet.
            <br />
            No manual entry. No confusion.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "#6366F1" }}
            >
              Import a statement
              <span className="opacity-70">→</span>
            </Link>
            <span className="text-xs" style={{ color: "#4B4B5A" }}>
              Free to start · No card required
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
