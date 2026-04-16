"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROWS = [
  { date: "Apr 02", desc: "Netflix Subscription", category: "Entertainment", amount: "−£14.99", income: false },
  { date: "Apr 03", desc: "Tesco Groceries",      category: "Groceries",     amount: "−£67.40", income: false },
  { date: "Apr 04", desc: "Salary Credit",         category: "Income",        amount: "+£3,200.00", income: true },
  { date: "Apr 05", desc: "Amazon Prime",          category: "Shopping",      amount: "−£8.99",  income: false },
  { date: "Apr 06", desc: "Electricity Bill",      category: "Utilities",     amount: "−£84.20", income: false },
  { date: "Apr 07", desc: "Spotify",               category: "Entertainment", amount: "−£9.99",  income: false },
];

type Phase = "idle" | "scanning" | "rows" | "done";

export function AiTable() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("scanning"), 500);
    const t2 = setTimeout(() => setPhase("rows"), 1300);
    const rowTimers = ROWS.map((_, i) =>
      setTimeout(() => setVisibleRows(i + 1), 1500 + i * 220)
    );
    const t3 = setTimeout(() => setPhase("done"), 1500 + ROWS.length * 220 + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); rowTimers.forEach(clearTimeout); };
  }, []);

  return (
    <div
      id="import"
      className="overflow-hidden rounded-lg"
      style={{ background: "var(--land-surface)", border: "1px solid var(--land-border)" }}
    >
      {/* Top indigo stripe */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, hsl(var(--ll-accent)) 0%, transparent 60%)" }} />

      {/* Scanning */}
      <AnimatePresence>
        {phase === "scanning" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 border-b px-4 py-3"
            style={{ borderColor: "var(--land-border)" }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "hsl(var(--ll-accent))" }} />
            <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>
              Analyzing document structure...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <AnimatePresence>
        {(phase === "rows" || phase === "done") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Headers */}
            <div
              className="grid border-b px-4 py-2.5"
              style={{ gridTemplateColumns: "72px 1fr 110px 88px", borderColor: "var(--land-border)" }}
            >
              {["DATE", "DESCRIPTION", "CATEGORY", "AMOUNT"].map((h) => (
                <span key={h} className="font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--land-dim)" }}>
                  {h}
                </span>
              ))}
            </div>

            {ROWS.slice(0, visibleRows).map((row, i) => (
              <motion.div
                key={row.date + row.desc}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="grid items-center border-b px-4 py-3"
                style={{
                  gridTemplateColumns: "72px 1fr 110px 88px",
                  borderColor: "var(--land-border)",
                  background: i % 2 === 0 ? "var(--land-row-alt)" : "transparent",
                }}
              >
                <span className="font-mono text-[10px]" style={{ color: "var(--land-muted)" }}>{row.date}</span>
                <span className="truncate pr-2 text-[12px] font-medium" style={{ color: "var(--land-text)" }}>{row.desc}</span>
                <span
                  className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: row.income ? "rgba(34,197,94,0.1)" : "hsl(var(--ll-accent) / 0.1)",
                    color: row.income ? "var(--land-green-fg)" : "var(--land-indigo-fg)",
                  }}
                >
                  {row.category}
                </span>
                <span
                  className="text-right font-mono text-[11px]"
                  style={{ color: row.income ? "var(--land-green-fg)" : "var(--land-text)" }}
                >
                  {row.amount}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI badge */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-3"
          >
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ background: "hsl(var(--ll-accent) / 0.1)", color: "hsl(var(--ll-accent))" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(var(--ll-accent))" }} />
              AI Parsed · 0.3s
            </span>
            <span className="text-[11px]" style={{ color: "var(--land-dim)" }}>6 transactions · 1 file</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
