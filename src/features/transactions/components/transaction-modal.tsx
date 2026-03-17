"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";

const schema = z.object({
  type:         z.enum(["expense", "income", "transfer"]),
  accountId:    z.number().int().positive("Account is required"),
  categoryId:   z.number().int().positive("Category is required"),
  amount:       z.number().positive("Amount must be greater than 0"),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  note:         z.string().max(300).optional(),
  transferToId: z.number().int().positive().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: FormData) => Promise<void>;
}

export function TransactionModal({ open, onClose, onSave }: Props) {
  const { accounts }   = useAccounts();
  const { categories } = useCategories();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const type      = watch("type");
  const accountId = watch("accountId");

  const filteredCats = categories.filter(c =>
    type === "income"  ? c.type !== "expense" :
    type === "expense" ? c.type !== "income"  : true
  );

  useEffect(() => {
    if (!open) return;
    reset({
      type:       "expense",
      accountId:  accounts[0]?.id,
      categoryId: categories.find(c => c.type !== "income")?.id,
      amount:     undefined,
      date:       new Date().toISOString().slice(0, 10),
      note:       "",
    });
  }, [open, accounts, categories, reset]);

  const onSubmit = async (data: FormData) => {
    await onSave(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Transaction" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

        {/* Type tabs */}
        <fieldset>
          <legend className="sr-only">Transaction type</legend>
          <div className="flex rounded-lg p-0.5" style={{ background: "hsl(var(--ll-bg-base))" }}>
            {(["expense", "income", "transfer"] as const).map(t => (
              <label key={t} className="flex-1">
                <input type="radio" value={t} className="sr-only" {...register("type")} />
                <span
                  className="block cursor-pointer rounded-md py-1.5 text-center text-xs font-medium capitalize transition-all"
                  style={{
                    background: type === t ? "hsl(var(--ll-bg-surface))" : "transparent",
                    color: type === t ? "hsl(var(--ll-text-primary))" : "hsl(var(--ll-text-muted))",
                  }}
                >
                  {t}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Account</label>
          <select className="ll-input" aria-label="Account" {...register("accountId", { valueAsNumber: true })}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {errors.accountId && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.accountId.message}</p>}
        </div>

        {type === "transfer" && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Transfer to</label>
            <select className="ll-input" aria-label="Transfer to account" {...register("transferToId", { valueAsNumber: true })}>
              <option value="">Select account…</option>
              {accounts.filter(a => a.id !== Number(accountId)).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Category</label>
          <select className="ll-input" aria-label="Category" {...register("categoryId", { valueAsNumber: true })}>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          {errors.categoryId && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Amount</label>
          <input className="ll-input ll-mono" type="number" step="0.01" min="0.01" placeholder="0.00" aria-label="Amount" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Date</label>
          <input className="ll-input" type="date" aria-label="Date" {...register("date")} />
          {errors.date && <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-expense))" }}>{errors.date.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>Note</label>
          <input className="ll-input" placeholder="Optional note" aria-label="Note" {...register("note")} />
        </div>

        <button
          type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "hsl(var(--ll-accent))" }}
        >
          {isSubmitting ? "Saving…" : "Add Transaction"}
        </button>
      </form>
    </Modal>
  );
}
