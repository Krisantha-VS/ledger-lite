"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const SCREENS = [
  {
    src: "/screenshots/light-dashboard.png",
    label: "Dashboard",
    desc: "KPIs, cash flow & recent transactions at a glance",
    rotate: "-3deg",
    delay: 0,
  },
  {
    src: "/screenshots/light-goals.png",
    label: "Goals",
    desc: "Track savings targets with progress bars",
    rotate: "0deg",
    delay: 0.1,
  },
  {
    src: "/screenshots/light-settings.png",
    label: "Settings",
    desc: "Currency, locale, theme — fully customisable",
    rotate: "3deg",
    delay: 0.2,
  },
];

export function Screenshots() {
  return (
    <section
      className="border-t overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {/* Section tag */}
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold" style={{ color: "#6366F1" }}>
            03
          </span>
          <span className="font-mono text-[11px]" style={{ color: "#71717A" }}>
            — IN USE
          </span>
        </div>
        <div
          className="mb-8 h-px w-72"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        <div className="mb-12 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl">
            Clean on every screen.
            <br />
            <span style={{ color: "#71717A" }}>Light or dark.</span>
          </h2>
          <p className="text-sm lg:text-right" style={{ color: "#71717A", maxWidth: "320px" }}>
            Designed for everyday use — not just the demo.
            Fast, readable, and works on any device.
          </p>
        </div>

        {/* Screenshot row */}
        <div className="flex items-end justify-center gap-4 lg:gap-8">
          {SCREENS.map((screen, i) => (
            <motion.div
              key={screen.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: screen.delay }}
              className="flex flex-col items-center gap-3"
              style={{ transform: `rotate(${screen.rotate})` }}
            >
              {/* Phone frame */}
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: "20px",
                  boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  width: i === 1 ? "200px" : "172px",
                }}
              >
                <Image
                  src={screen.src}
                  alt={screen.label + " screenshot"}
                  width={375}
                  height={812}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  priority={i === 0}
                />
              </div>

              {/* Label */}
              <div className="text-center" style={{ transform: `rotate(calc(-1 * ${screen.rotate}))` }}>
                <div className="text-xs font-semibold text-white">{screen.label}</div>
                <div
                  className="mt-0.5 text-[10px] leading-snug"
                  style={{ color: "#4B4B5A", maxWidth: "140px" }}
                >
                  {screen.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Light/dark callout */}
        <div className="mt-14 flex items-center justify-center gap-3">
          <div
            className="h-px flex-1"
            style={{ background: "rgba(255,255,255,0.05)", maxWidth: "200px" }}
          />
          <span className="text-xs" style={{ color: "#4B4B5A" }}>
            Showing light mode · dark mode coming next
          </span>
          <div
            className="h-px flex-1"
            style={{ background: "rgba(255,255,255,0.05)", maxWidth: "200px" }}
          />
        </div>
      </div>
    </section>
  );
}
