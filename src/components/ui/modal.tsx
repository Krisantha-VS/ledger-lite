"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        className={cn("ll-card w-full shadow-2xl", sizeMap[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "hsl(var(--ll-border))" }}>
          <h2 id="modal-title" className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "hsl(var(--ll-text-muted))" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
