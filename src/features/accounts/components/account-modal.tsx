"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import type { Account } from "@/shared/types";

const ACCOUNT_TYPES = ["checking", "savings", "cash", "credit", "investment"] as const;
const COLOURS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#a855f7", "#ef4444"];

const schema = z.object({
  name:            z.string().min(1, "Name is required").max(100),
  type:            z.enum(ACCOUNT_TYPES),
  startingBalance: z.number(),
  colour:          z.string().length(7),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: FormData) => Promise<void>;
  initial?: Account | null;
}

export function AccountModal({ open, onClose, onSave, initial }: Props) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "checking", startingBalance: 0, colour: COLOURS[0] },
  });

  const colour = watch("colour");

  useEffect(() => {
    if (open) {
      reset(initial
        ? { name: initial.name, type: initial.type as FormData["type"], startingBalance: Number(initial.startingBalance), colour: initial.colour }
        : { name: "", type: "checking", startingBalance: 0, colour: COLOURS[0] }
      );
    }
  }, [open, initial, reset]);

  const onSubmit = async (data: FormData) => {
    await onSave(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Account" : "New Account"} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
            Account name
          </label>
          <input className="ll-input" placeholder="e.g. Main Checking" aria-label="Account name" {...register("name")} />
          {errors.name && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
            Account type
          </label>
          <select className="ll-input" aria-label="Account type" {...register("type")}>
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
            Starting balance
          </label>
          <input
            className="ll-input ll-mono" placeholder="0.00" type="number" step="0.01"
            aria-label="Starting balance" {...register("startingBalance", { valueAsNumber: true })}
          />
          {errors.startingBalance && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.startingBalance.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
            Colour
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOURS.map(c => (
              <button
                key={c} type="button" aria-label={`Select colour ${c}`}
                onClick={() => setValue("colour", c)}
                className="h-6 w-6 rounded-full transition-all"
                style={{ background: c, outline: colour === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          {isSubmitting ? "Saving…" : initial ? "Update" : "Create Account"}
        </button>
      </form>
    </Modal>
  );
}
