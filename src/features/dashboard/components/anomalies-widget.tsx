"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/shared/lib/auth-client";
import type { Anomaly } from "@/app/api/v1/transactions/anomalies/route";

async function fetchAnomalies() {
  const res  = await authFetch("/api/v1/transactions/anomalies");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as { anomalies: Anomaly[]; count: number };
}

export function AnomaliesWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["anomalies"],
    queryFn:  fetchAnomalies,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading || error || !data || data.anomalies.length === 0) return null;

  const top = data.anomalies.slice(0, 3);

  return (
    <div className="ll-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid hsl(var(--ll-border))", background: "hsl(38 92% 50% / 0.05)" }}>
        <AlertTriangle className="h-4 w-4" style={{ color: "hsl(38 92% 50%)" }} />
        <span className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          {data.count === 1 ? "1 unusual transaction" : `${data.count} unusual transactions`}
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border) / 0.6)" }}>
        {top.map(a => (
          <div key={a.transactionId} className="px-5 py-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: a.severity === "high" ? "hsl(var(--ll-expense))" : "hsl(38 92% 50%)" }} />
              <div className="flex-1 min-w-0">
                {a.description && (
                  <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--ll-text-primary))" }}>{a.description}</p>
                )}
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--ll-text-secondary))" }}>{a.explanation}</p>
                {a.date && <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--ll-text-muted))" }}>{a.date}</p>}
              </div>
              {a.amount && (
                <span className="text-xs font-bold ll-mono shrink-0" style={{ color: "hsl(var(--ll-expense))" }}>
                  -{a.amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3">
        <a href="/transactions" className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--ll-accent))" }}>
          View all transactions <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
