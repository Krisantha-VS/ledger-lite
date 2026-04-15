"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROWS = [
  { date: "Apr 02", desc: "Netflix Subscription", category: "Entertainment", amount: "−£14.99", income: false },
  { date: "Apr 03", desc: "Tesco Groceries", category: "Groceries", amount: "−£67.40", income: false },
  { date: "Apr 04", desc: "Salary Credit", category: "Income", amount: "+£3,200.00", income: true },
  { date: "Apr 05", desc: "Amazon Prime", category: "Shopping", amount: "−£8.99", income: false },
  { date: "Apr 06", desc: "Electricity Bill", category: "Utilities", amount: "−£84.20", income: false },
  { date: "Apr 07", desc: "Spotify", category: "Entertainment", amount: "−£9.99", income: false },
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
    const t3 = setTimeout(
      () => setPhase("done"),
      1500 + ROWS.length * 220 + 400
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      rowTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      id="import"
    >
      {/* Top indigo accent stripe */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, #6366F1 0%, transparent 60%)" }}
      />

      {/* Scanning state */}
      <AnimatePresence>
        {phase === "scanning" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 border-b px-4 py-3"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#6366F1" }}
            />
            <span className="font-mono text-[11px]" style={{ color: "#71717A" }}>
              Analyzing document structure...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <AnimatePresence>
        {(phase === "rows" || phase === "done") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Column headers */}
            <div
              className="grid border-b px-4 py-2.5"
              style={{
                gridTemplateColumns: "72px 1fr 110px 88px",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {["DATE", "DESCRIPTION", "CATEGORY", "AMOUNT"].map((h) => (
                <span
                  key={h}
                  className="font-mono text-[9px] uppercase tracking-[0.12em]"
                  style={{ color: "#4B4B5A" }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {ROWS.slice(0, visibleRows).map((row, i) => (
              <motion.div
                key={row.date + row.desc}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="grid items-center border-b px-4 py-3"
                style={{
                  gridTemplateColumns: "72px 1fr 110px 88px",
                  borderColor: "rgba(255,255,255,0.04)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                }}
              >
                <span className="font-mono text-[10px]" style={{ color: "#71717A" }}>
                  {row.date}
                </span>
                <span className="truncate pr-2 text-[12px] font-medium text-white">
                  {row.desc}
                </span>
                <span
                  className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: row.income ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)",
                    color: row.income ? "#4ade80" : "#818cf8",
                  }}
                >
                  {row.category}
                </span>
                <span
                  className="text-right font-mono text-[11px]"
                  style={{ color: row.income ? "#4ade80" : "#e5e7eb" }}
                >
                  {row.amount}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Parsed badge */}
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-4 py-3"
          >
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#6366F1" }}
              />
              AI Parsed · 0.3s
            </span>
            <span className="text-[11px]" style={{ color: "#4B4B5A" }}>
              6 transactions · 1 file
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
