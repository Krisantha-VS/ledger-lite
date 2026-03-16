"use client";

import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  open, onClose, onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
  variant = "danger",
}: Props) {
  const color = variant === "danger"
    ? "hsl(var(--ll-expense))"
    : "hsl(var(--ll-warning))";

  const bgColor = variant === "danger"
    ? "hsl(var(--ll-expense) / 0.1)"
    : "hsl(var(--ll-warning) / 0.1)";

  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: bgColor }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
            {title}
          </p>
          <p className="mt-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            {description}
          </p>
        </div>
        <div className="flex w-full gap-2">
          <button
            onClick={onClose}
            className="ll-focus-ring flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--ll-bg-elevated)",
              color: "hsl(var(--ll-text-secondary))",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="ll-focus-ring flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: color }}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
