"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const LIGHT = [
  { src: "/screenshots/light-dashboard.png", label: "Dashboard",  desc: "KPIs, cash flow & recent transactions" },
  { src: "/screenshots/light-goals.png",     label: "Goals",      desc: "Track savings targets with progress" },
  { src: "/screenshots/light-settings.png",  label: "Settings",   desc: "Currency, locale & theme preferences" },
];

const DARK = [
  { src: "/screenshots/dark-dashboard.png",  label: "Dashboard",   desc: "KPIs, cash flow & recent transactions" },
  { src: "/screenshots/dark-categories.png", label: "Categories",  desc: "Income & expense categories organised" },
  { src: "/screenshots/dark-goals.png",      label: "Goals",       desc: "Track savings targets with progress" },
];

const ROTATIONS = ["-4deg", "0deg", "4deg"];

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

          {/* Light / Dark toggle */}
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
                  color: mode === m ? "#ffffff" : "var(--land-muted)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Screenshot fan */}
        <div className="relative flex items-end justify-center gap-3 lg:gap-6" style={{ minHeight: "420px" }}>
          <AnimatePresence mode="wait">
            {screens.map((screen, i) => (
              <motion.div
                key={mode + screen.src}
                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.97 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="flex flex-col items-center gap-3"
                style={{ transform: `rotate(${ROTATIONS[i]})` }}
              >
                <div
                  className="relative overflow-hidden"
                  style={{
                    borderRadius: "22px",
                    width: i === 1 ? "190px" : "164px",
                    boxShadow: "var(--land-shadow)",
                    border: "1px solid var(--land-border)",
                  }}
                >
                  <Image
                    src={screen.src}
                    alt={screen.label}
                    width={375}
                    height={812}
                    style={{ width: "100%", height: "auto", display: "block" }}
                    priority={i === 0}
                  />
                </div>
                <div className="text-center" style={{ transform: `rotate(calc(-1 * ${ROTATIONS[i]}))` }}>
                  <div className="text-xs font-semibold" style={{ color: "var(--land-text)" }}>{screen.label}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: "var(--land-dim)", maxWidth: "130px" }}>{screen.desc}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom rule */}
        <div className="mt-14 flex items-center justify-center gap-4">
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
