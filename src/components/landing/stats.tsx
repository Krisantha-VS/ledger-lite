"use client";

import { motion } from "framer-motion";

const STATS = [
  { value: "10,000+", label: "statements parsed" },
  { value: "0.4s",    label: "average parse time" },
  { value: "12",      label: "supported formats"  },
  { value: "99.9%",   label: "uptime"             },
];

export function Stats() {
  return (
    <section className="border-t border-b" style={{ borderColor: "var(--land-border)" }}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              className={i > 0 ? "border-l pl-8" : ""}
              style={i > 0 ? { borderColor: "var(--land-border)" } : undefined}
            >
              <div className="text-3xl font-bold lg:text-4xl" style={{ color: "var(--land-text)" }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--land-muted)" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
