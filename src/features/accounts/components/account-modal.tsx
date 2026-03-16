"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import type { Account } from "@/shared/types";

const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit", "investment"];
const COLOURS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#a855f7", "#ef4444"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; type: string; startingBalance: number; colour: string }) => Promise<void>;
  initial?: Account | null;
}

export function AccountModal({ open, onClose, onSave, initial }: Props) {
  const [name, setName]       = useState("");
  const [type, setType]       = useState("checking");
  const [balance, setBalance] = useState("");
  const [colour, setColour]   = useState(COLOURS[0]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setType(initial.type);
      setBalance(String(initial.startingBalance));
      setColour(initial.colour);
    } else {
      setName(""); setType("checking"); setBalance(""); setColour(COLOURS[0]);
    }
    setError("");
  }, [initial, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await onSave({ name, type, startingBalance: parseFloat(balance) || 0, colour });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Account" : "New Account"} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <input
          className="ll-input" placeholder="Account name" required
          value={name} onChange={e => setName(e.target.value)}
        />
        <select
          className="ll-input"
          value={type} onChange={e => setType(e.target.value)}
        >
          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input
          className="ll-input ll-mono" placeholder="Starting balance" type="number" step="0.01"
          value={balance} onChange={e => setBalance(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {COLOURS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColour(c)}
              className="h-6 w-6 rounded-full ring-offset-2 transition-all"
              style={{
                background: c,
                outline: colour === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
        {error && <p className="text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{error}</p>}
        <button
          type="submit" disabled={saving}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          {saving ? "Saving…" : initial ? "Update" : "Create Account"}
        </button>
      </form>
    </Modal>
  );
}
