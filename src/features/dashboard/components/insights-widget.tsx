"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Trophy, ExternalLink } from "lucide-react";
import { authFetch } from "@/shared/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight } from "@/app/api/v1/ai/insights/route";

const TYPE_ICON = {
  saving:      TrendingDown,
  warning:     AlertTriangle,
  trend:       TrendingUp,
  achievement: Trophy,
};
const TYPE_COLOR = {
  saving:      "hsl(var(--ll-income))",
  warning:     "hsl(var(--ll-warning, 38 92% 50%))",
  trend:       "hsl(var(--ll-accent))",
  achievement: "hsl(var(--ll-income))",
};
const TYPE_BG = {
  saving:      "hsl(var(--ll-income) / 0.08)",
  warning:     "hsl(38 92% 50% / 0.08)",
  trend:       "hsl(var(--ll-accent) / 0.08)",
  achievement: "hsl(var(--ll-income) / 0.08)",
};

async function fetchInsights() {
  const res  = await authFetch("/api/v1/ai/insights");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as { insights: Insight[]; generatedAt: string; reason?: string };
}

export function InsightsWidget() {
  const [idx, setIdx] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-insights"],
    queryFn:  fetchInsights,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="ll-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Klivo Insights</span>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  // On 403 (free plan) or no data: hide widget entirely
  if (error || !data) return null;
  if (data.insights.length === 0) {
    if (!data.reason) return null;
    return (
      <div className="ll-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Klivo Insights</span>
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{data.reason}</p>
      </div>
    );
  }

  const total   = data.insights.length;
  const insight = data.insights[Math.min(idx, total - 1)];
  const Icon    = TYPE_ICON[insight.type] ?? Sparkles;

  return (
    <div className="ll-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid hsl(var(--ll-border))" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Klivo Insights</span>
        </div>
        {total > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors disabled:opacity-30"
              style={{ background: "hsl(var(--ll-bg-elevated))" }}
              aria-label="Previous insight"
            >
              <ChevronLeft className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-text-muted))" }} />
            </button>
            <span className="text-[11px] tabular-nums" style={{ color: "hsl(var(--ll-text-muted))" }}>{idx + 1}/{total}</span>
            <button
              onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
              disabled={idx === total - 1}
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors disabled:opacity-30"
              style={{ background: "hsl(var(--ll-bg-elevated))" }}
              aria-label="Next insight"
            >
              <ChevronRight className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-text-muted))" }} />
            </button>
          </div>
        )}
      </div>

      {/* Insight body */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: TYPE_BG[insight.type] }}>
            <Icon className="h-4 w-4" style={{ color: TYPE_COLOR[insight.type] }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>{insight.title}</p>
              {insight.metric && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: TYPE_BG[insight.type], color: TYPE_COLOR[insight.type] }}>
                  {insight.metric}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "hsl(var(--ll-text-secondary))" }}>{insight.body}</p>
            {insight.actionLabel && insight.actionHref && (
              <a
                href={insight.actionHref}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: "hsl(var(--ll-accent))" }}
              >
                {insight.actionLabel} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Dot pagination */}
        {total > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? "16px" : "6px",
                  background: i === idx ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))",
                }}
                aria-label={`Go to insight ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
