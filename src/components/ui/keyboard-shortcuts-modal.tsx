"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "N",   desc: "New transaction" },
  { key: "A",   desc: "New account" },
  { key: "H",   desc: "Go to dashboard" },
  { key: "T",   desc: "Go to transactions" },
  { key: "G",   desc: "Go to goals" },
  { key: "R",   desc: "Go to reports" },
  { key: "?",   desc: "Show this help" },
  { key: "Esc", desc: "Close modal / dialog" },
];

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="ll-card w-full max-w-sm overflow-hidden p-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "hsl(var(--ll-border))" }}>
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:bg-white/5"
            style={{ color: "hsl(var(--ll-text-muted))" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1 p-4">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm" style={{ color: "hsl(var(--ll-text-secondary))" }}>{s.desc}</span>
              <kbd
                className="ll-mono rounded px-2 py-0.5 text-xs"
                style={{
                  background: "hsl(var(--ll-bg-base))",
                  color: "hsl(var(--ll-text-primary))",
                  border: "1px solid hsl(var(--ll-border))",
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-t px-5 py-3" style={{ borderColor: "hsl(var(--ll-border))" }}>
          <p className="text-center text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Shortcuts are disabled when typing in inputs
          </p>
        </div>
      </div>
    </div>
  );
}
