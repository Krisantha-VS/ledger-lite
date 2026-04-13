"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { authFetch } from "@/shared/lib/auth-client";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

interface CashflowData {
  baseline:   number;
  dailyDrift: number;
  marks:      { d30: number; d60: number; d90: number };
  points:     { day: number; date: string; balance: number }[];
}

function useCashflow() {
  return useQuery<CashflowData>({
    queryKey: ["cashflow"],
    queryFn: async () => {
      const res  = await authFetch("/api/v1/cashflow");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as CashflowData;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

const MARKS = [
  { key: "d30" as const, label: "30 days" },
  { key: "d60" as const, label: "60 days" },
  { key: "d90" as const, label: "90 days" },
];

function TrendIcon({ value, baseline }: { value: number; baseline: number }) {
  const delta = value - baseline;
  if (Math.abs(delta) < 0.5) return <Minus className="h-3 w-3" style={{ color: "hsl(var(--ll-text-muted))" }} />;
  return delta > 0
    ? <TrendingUp  className="h-3 w-3" style={{ color: "hsl(var(--ll-income))" }} />
    : <TrendingDown className="h-3 w-3" style={{ color: "hsl(var(--ll-expense))" }} />;
}

// Thin out 90 points to ~18 for the chart (every 5th day)
function thinPoints(points: CashflowData["points"]) {
  return points.filter((_, i) => i % 5 === 4 || i === points.length - 1);
}

export function CashflowWidget() {
  const { data, isLoading, isError } = useCashflow();

  if (isLoading) return <Skeleton className="h-56 rounded-xl" />;

  if (isError || !data) {
    return (
      <div
        className="ll-card flex h-56 flex-col items-center justify-center gap-2 rounded-xl"
        style={{ color: "hsl(var(--ll-text-muted))" }}
      >
        <TrendingUp className="h-8 w-8 opacity-20" />
        <p className="text-xs">Cash flow data unavailable</p>
        <p className="text-[11px] opacity-60">Add transactions to see your projection</p>
      </div>
    );
  }

  const chartData = thinPoints(data.points);
  const isPositiveDrift = data.dailyDrift >= 0;

  return (
    <div className="ll-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
            Cash Flow Projection
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Based on recurring schedule + {isPositiveDrift ? "+" : ""}{formatCurrency(data.dailyDrift * 30)}/mo historical avg
          </p>
        </div>
      </div>

      {/* 30/60/90 marks */}
      <div className="grid grid-cols-3 divide-x px-5 pb-4" style={{ borderColor: "hsl(var(--ll-border))", borderBottom: "1px solid hsl(var(--ll-border))" }}>
        {MARKS.map(({ key, label }) => {
          const val   = data.marks[key];
          const delta = val - data.baseline;
          const color = delta >= 0 ? "hsl(var(--ll-income))" : "hsl(var(--ll-expense))";
          return (
            <div key={key} className="px-4 py-3 first:pl-0 last:pr-0">
              <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{label}</p>
              <p className="ll-mono text-sm font-semibold mt-0.5" style={{ color }}>
                {formatCurrency(val, "USD", { compact: true })}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendIcon value={val} baseline={data.baseline} />
                <span className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  {delta >= 0 ? "+" : ""}{formatCurrency(delta, "USD", { compact: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini area chart */}
      <div className="h-28 px-2 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--ll-text-muted))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `d${v}`}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--ll-bg-elevated))",
                border: "1px solid hsl(var(--ll-border))",
                borderRadius: 8,
                fontSize: 11,
                color: "hsl(var(--ll-text-primary))",
              }}
              formatter={(v: number) => [formatCurrency(v), "Balance"]}
              labelFormatter={(l) => `Day ${l}`}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(239 84% 67%)"
              strokeWidth={1.5}
              fill="url(#cf-grad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
