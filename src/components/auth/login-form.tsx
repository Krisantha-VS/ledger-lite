"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/ui/brand-mark";

export function LoginForm() {
  const [hovered, setHovered] = useState(false);
  const [href, setHref] = useState("/api/auth/login-start");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHref(`/api/auth/login-start${window.location.search}`);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {/* Background glow — fades in */}
      <motion.div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--ll-accent) / 0.08)", filter: "blur(120px)" }}
        />
      </motion.div>

      {/* Card — fades up on mount */}
      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ll-glass p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            {/* Icon — single breath pulse on mount */}
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: "hsl(var(--ll-accent) / 0.15)",
                outline: "1px solid hsl(var(--ll-accent) / 0.3)",
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: [0.85, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.6, times: [0, 0.6, 1], ease: "easeOut", delay: 0.2 }}
            >
              <BrandMark className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
            >
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(var(--ll-text-primary))" }}>
                LedgerLite
              </h1>
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                Your finances, clearly.
              </p>
            </motion.div>
          </div>

          {/* Button — shimmer on hover */}
          <motion.a
            href={href}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg py-2.5 text-sm font-medium text-white active:scale-[0.98]"
            style={{ background: "hsl(var(--ll-accent))" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
          >
            {/* Shimmer streak */}
            <motion.span
              className="pointer-events-none absolute inset-y-0 w-16 -skew-x-12"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
              initial={{ left: "-4rem" }}
              animate={hovered ? { left: "110%" } : { left: "-4rem" }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            />
            Continue with AuthSaas
          </motion.a>

          <motion.div
            className="mt-5 flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <Lock className="h-3 w-3" style={{ color: "hsl(var(--ll-text-muted))" }} />
            <span className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
              TLS encrypted · Secured by AuthSaas
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
