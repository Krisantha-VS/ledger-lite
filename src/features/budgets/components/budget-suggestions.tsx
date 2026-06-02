"use client";

import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { authFetch } from "@/shared/lib/auth-client";
import { formatCurrency } from "@/shared/lib/formatters";

interface Suggestion {
  categoryId:      string;
  suggestedAmount: number;
  avgSpend:        number;
  rationale:       string;
}

interface Props {
  onAccept: (categoryId: number, amount: number) => Promise<void>;
}

export function BudgetSuggestions({ onAccept }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [shown, setShown]             = useState(false);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());
  const [reason, setReason]           = useState<string | null>(null);
  const [accepting, setAccepting]     = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setShown(true);
    try {
      const res  = await authFetch("/api/v1/ai/suggest-budgets");
      const json = await res.json();
      if (!json.success) {
        setReason(json.error ?? "Could not load suggestions.");
        return;
      }
      if (json.data.reason) setReason(json.data.reason);
      setSuggestions(json.data.suggestions ?? []);
    } catch {
      setReason("Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const visible = suggestions.filter(s => !dismissed.has(s.categoryId));

  const handleAccept = async (s: Suggestion) => {
    setAccepting(s.categoryId);
    try {
      await onAccept(parseInt(s.categoryId, 10), s.suggestedAmount);
      setDismissed(prev => new Set(prev).add(s.categoryId));
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div>
      {!shown && (
        <button
          onClick={fetchSuggestions}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{ background: "hsl(var(--ll-accent) / 0.08)", color: "hsl(var(--ll-accent))", border: "1px solid hsl(var(--ll-accent) / 0.2)" }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Suggest budgets from my spending
        </button>
      )}

      {shown && loading && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2" style={{ borderColor: "hsl(var(--ll-accent) / 0.3)", borderTopColor: "hsl(var(--ll-accent))" }} />
          <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Analysing your spending…</span>
        </div>
      )}

      {shown && !loading && reason && visible.length === 0 && (
        <p className="text-xs py-1" style={{ color: "hsl(var(--ll-text-muted))" }}>{reason}</p>
      )}

      {shown && !loading && visible.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>Based on your last 3 months of spending:</p>
          {visible.map(s => (
            <div
              key={s.categoryId}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: "hsl(var(--ll-bg-elevated))", border: "1px solid hsl(var(--ll-border))" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span style={{ color: "hsl(var(--ll-text-secondary))" }}>avg {formatCurrency(s.avgSpend)}/mo</span>
                  <span style={{ color: "hsl(var(--ll-text-muted))" }}>→</span>
                  <span className="font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Budget: {formatCurrency(s.suggestedAmount)}</span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--ll-text-muted))" }}>{s.rationale}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleAccept(s)}
                  disabled={accepting === s.categoryId}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-50"
                  style={{ background: "hsl(var(--ll-income) / 0.12)", color: "hsl(var(--ll-income))" }}
                  aria-label="Accept suggestion"
                >
                  {accepting === s.categoryId
                    ? <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    : <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setDismissed(prev => new Set(prev).add(s.categoryId))}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                  style={{ color: "hsl(var(--ll-text-muted))" }}
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {visible.length > 0 && (
            <button
              onClick={async () => {
                for (const s of visible) await handleAccept(s);
              }}
              className="text-xs font-medium py-1"
              style={{ color: "hsl(var(--ll-accent))" }}
            >
              Accept all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
