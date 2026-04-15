"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const LIGHT = [
  { src: "/screenshots/light-dashboard.png",    label: "Dashboard",    desc: "KPIs, cash flow & projections" },
  { src: "/screenshots/light-transactions.png", label: "Transactions", desc: "Full transaction history & search" },
  { src: "/screenshots/light-goals.png",        label: "Goals",        desc: "Savings targets with progress" },
  { src: "/screenshots/light-accounts.png",     label: "Accounts",     desc: "All accounts with balances" },
  { src: "/screenshots/light-settings.png",     label: "Settings",     desc: "Currency, locale & preferences" },
];

const DARK = [
  { src: "/screenshots/dark-dashboard.png",    label: "Dashboard",    desc: "KPIs, cash flow & projections" },
  { src: "/screenshots/dark-transactions.png", label: "Transactions", desc: "Full transaction history & search" },
  { src: "/screenshots/dark-categories.png",   label: "Categories",   desc: "Income & expense categories" },
  { src: "/screenshots/dark-goals.png",        label: "Goals",        desc: "Savings targets with progress" },
  { src: "/screenshots/dark-accounts.png",     label: "Accounts",     desc: "All accounts with balances" },
];

// 5-phone fan: sizes + rotations peak at centre
const SIZES     = [144, 158, 176, 158, 144];
const ROTATIONS = ["-6deg", "-3deg", "0deg", "3deg", "6deg"];
const Y_OFFSETS = [24, 12, 0, 12, 24]; // raise centre phone

export function Screenshots() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const screens = mode === "light" ? LIGHT : DARK;

  return (
    <section className="border-t overflow-hidden" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold" style={{ color: "hsl(var(--ll-accent))" }}>03</span>
              <span className="font-mono text-[11px]" style={{ color: "var(--land-muted)" }}>— IN USE</span>
            </div>
            <div className="mb-6 h-px w-72" style={{ background: "var(--land-rule)" }} />
            <h2 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl" style={{ color: "var(--land-text)" }}>
              Clean on every screen.
              <br />
              <span style={{ color: "var(--land-muted)" }}>Light or dark.</span>
            </h2>
          </div>

          {/* Mode toggle */}
          <div
            className="flex self-start items-center gap-1 rounded-lg p-1 lg:self-auto"
            style={{ background: "var(--land-card)", border: "1px solid var(--land-border)" }}
          >
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold capitalize transition-all"
                style={{
                  background: mode === m ? "hsl(var(--ll-accent))" : "transparent",
                  color:      mode === m ? "#ffffff" : "var(--land-muted)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* ── 5-phone fan (desktop) ── */}
        <div className="hidden lg:flex items-end justify-center gap-2" style={{ minHeight: "460px" }}>
          <AnimatePresence mode="wait">
            {screens.map((screen, i) => (
              <motion.div
                key={mode + screen.src}
                initial={{ opacity: 0, y: 32, scale: 0.93 }}
                animate={{ opacity: 1, y: Y_OFFSETS[i], scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.38, delay: i * 0.06 }}
                className="flex flex-col items-center gap-3 shrink-0"
                style={{ transform: `rotate(${ROTATIONS[i]})` }}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    borderRadius: "20px",
                    width: `${SIZES[i]}px`,
                    border: "1px solid var(--land-border)",
                    boxShadow: "var(--land-shadow)",
                  }}
                >
                  <Image
                    src={screen.src}
                    alt={screen.label}
                    width={375}
                    height={812}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    priority={i <= 1}
                  />
                </div>
                <div
                  className="text-center"
                  style={{ transform: `rotate(calc(-1 * ${ROTATIONS[i]}))` }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: "var(--land-text)" }}>{screen.label}</div>
                  <div className="mt-0.5 text-[9px]" style={{ color: "var(--land-dim)", maxWidth: "110px" }}>{screen.desc}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Mobile: horizontal scroll strip ── */}
        <div className="flex lg:hidden gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            {screens.map((screen, i) => (
              <motion.div
                key={mode + screen.src + "-mob"}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    borderRadius: "18px",
                    width: "140px",
                    border: "1px solid var(--land-border)",
                    boxShadow: "var(--land-shadow)",
                  }}
                >
                  <Image
                    src={screen.src}
                    alt={screen.label}
                    width={375}
                    height={812}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
                <div className="text-[10px] font-semibold" style={{ color: "var(--land-text)" }}>{screen.label}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Screen count strip */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-px flex-1" style={{ background: "var(--land-rule)", maxWidth: "180px" }} />
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--land-dim)" }}>
            {mode} mode · {screens.length} screens
          </span>
          <div className="h-px flex-1" style={{ background: "var(--land-rule)", maxWidth: "180px" }} />
        </div>

      </div>
    </section>
  );
}
