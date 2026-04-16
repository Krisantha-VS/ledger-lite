"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";
import { Settings, Download, Trash2, CreditCard, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { authFetch } from "@/shared/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "LKR", label: "LKR — Sri Lankan Rupee" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "INR", label: "INR — Indian Rupee" },
];

const LOCALES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "si-LK", label: "Sinhala (Sri Lanka)" },
  { code: "de-DE", label: "German" },
  { code: "fr-FR", label: "French" },
  { code: "ja-JP", label: "Japanese" },
];

const schema = z.object({
  currency: z.string().length(3),
  locale:   z.string().max(10),
  theme:    z.enum(["light", "dark", "system"]),
});
type FormData = z.infer<typeof schema>;

export function SettingsView() {
  const { settings, loading, updateSettings, isSaving } = useSettings();
  const { setTheme } = useTheme();
  const qc = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [billing, setBilling] = useState<{ plan: string, isTrial: boolean, trialEndsAt: string } | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", locale: "en-US", theme: "system" },
  });

  useEffect(() => {
    if (settings) reset({ currency: settings.currency, locale: settings.locale, theme: settings.theme });

    authFetch("/api/v1/billing")
      .then(res => res.json())
      .then(json => {
        if (json.success) setBilling(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingBilling(false));
  }, [settings, reset]);

  const onSubmit = async (data: FormData) => {
    await updateSettings(data);
    setTheme(data.theme); // sync next-themes immediately
    reset(data);
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      const res  = await authFetch("/api/v1/user", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Delete failed");
      // Invalidate all cached data
      await qc.invalidateQueries();
      toast.success("All data deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete data");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const exportCSV = async () => {
    const res  = await authFetch("/api/v1/transactions/export");
    if (!res.ok) { return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ledgerlite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Settings</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Preferences and data export</p>
        </div>
      </div>

      {/* Billing */}
      <div className="ll-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
          <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Subscription</h2>
        </div>

        {loadingBilling ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize" style={{ color: "hsl(var(--ll-text-primary))" }}>
                {billing?.plan} Plan
                {billing?.isTrial && (
                  <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "hsl(var(--ll-accent) / 0.15)", color: "hsl(var(--ll-accent))" }}>
                    Trial
                  </span>
                )}
              </p>
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                {billing?.isTrial
                  ? `Trial ends on ${new Date(billing.trialEndsAt).toLocaleDateString()}`
                  : billing?.plan === "free" ? "Limited features" : "Full access active"}
              </p>
            </div>
            {billing?.plan === "free" && (
              <a
                href="/#pricing"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "hsl(var(--ll-accent))" }}
              >
                <Sparkles className="h-3 w-3" />
                Upgrade
              </a>
            )}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="ll-card p-5">
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Preferences</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                Currency
              </label>
              <select className="ll-input" {...register("currency")}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                Number format / Locale
              </label>
              <select className="ll-input" {...register("locale")}>
                {LOCALES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                Theme
              </label>
              <select className="ll-input" {...register("theme")}>
                <option value="system">System default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              {isSaving ? "Saving…" : "Save preferences"}
            </button>
          </form>
        )}
      </div>

      {/* Data export */}
      <div className="ll-card p-5">
        <h2 className="mb-1 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Export data</h2>
        <p className="mb-4 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Download all your transactions as a CSV file.
        </p>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: "hsl(var(--ll-bg-base))", color: "hsl(var(--ll-text-primary))", border: "1px solid hsl(var(--ll-border))" }}
        >
          <Download className="h-4 w-4" />
          Export transactions (.csv)
        </button>
      </div>

      {/* Danger zone */}
      <div className="ll-card p-5" style={{ borderColor: "hsl(var(--ll-expense) / 0.3)" }}>
        <h2 className="mb-1 text-sm font-semibold text-[hsl(var(--ll-expense))]">Danger zone</h2>
        <p className="mb-4 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Deletes all transactions, accounts, budgets, and goals.
          Your login credentials are not affected.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
          style={{
            background: "hsl(var(--ll-expense) / 0.1)",
            color: "hsl(var(--ll-expense))",
            border: "1px solid hsl(var(--ll-expense) / 0.3)",
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete all data
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAllData}
        title="Delete all financial data?"
        description="This will permanently delete all your transactions, accounts, budgets, and goals. This action cannot be undone."
        confirmLabel="Delete all data"
        loading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
