"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useMonthlySummary, useCategoryBreakdown } from "@/features/summary/hooks/useSummary";
import { formatCurrency, formatMonth } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = [
  "hsl(var(--chart-savings))", "hsl(var(--chart-income))",  "hsl(var(--chart-cat-2))",
  "hsl(var(--chart-cat-3))",  "hsl(var(--chart-cat-1))",   "hsl(var(--chart-cat-5))",
  "hsl(var(--chart-cat-4))",  "hsl(var(--chart-expense))",
];

type RangeOption = { label: string; months: number; ytd?: boolean };

const RANGE_OPTIONS: RangeOption[] = [
  { label: "Last 3 months",  months: 3 },
  { label: "Last 6 months",  months: 6 },
  { label: "Last 12 months", months: 12 },
  { label: "Year to date",   months: 0, ytd: true },
];

function resolvedMonths(opt: RangeOption): number {
  if (!opt.ytd) return opt.months;
  return new Date().getMonth() + 1;
}

/** ISO date string for the first day of the range (e.g. "2025-12-01" for last 6 months). */
function rangeFromDate(opt: RangeOption): string {
  const now = new Date();
  if (opt.ytd) {
    return `${now.getFullYear()}-01-01`;
  }
  const start = new Date(now.getFullYear(), now.getMonth() - opt.months + 1, 1);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
}

/** ISO date string for the last day of the current month. */
function rangeToDate(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

function rangeLabel(opt: RangeOption, from: string): string {
  const fromDate = new Date(from + "T00:00:00");
  const toDate   = new Date();
  const fromStr  = fromDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const toStr    = toDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
}

export function ReportsView() {
  const [range, setRange] = useState<RangeOption>(RANGE_OPTIONS[1]);

  const months  = resolvedMonths(range);
  const fromStr = rangeFromDate(range);
  const toStr   = rangeToDate();

  const { rows: monthly,    loading: mLoading } = useMonthlySummary(months);
  const { rows: cats,       loading: cLoading } = useCategoryBreakdown(undefined, "expense", fromStr, toStr);
  const { rows: incomeCats, loading: icLoading } = useCategoryBreakdown(undefined, "income",  fromStr, toStr);

  const chartData = monthly.map(r => ({
    month:    formatMonth(r.month),
    income:   r.income,
    expenses: r.expenses,
    net:      r.net,
  }));

  const subtitleLabel = rangeLabel(range, fromStr);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Reports</h1>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{subtitleLabel}</p>
      </div>

      {/* Date range pill selector */}
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map(opt => {
          const active = opt.label === range.label;
          return (
            <button
              key={opt.label}
              onClick={() => setRange(opt)}
              className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: active ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-surface))",
                color:      active ? "hsl(var(--ll-accent-fg))" : "hsl(var(--ll-text-muted))",
                border:     `1px solid ${active ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))"}`,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Income vs Expenses area chart */}
      <div className="ll-card p-4">
        <p className="mb-4 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Income vs Expenses
        </p>
        {mLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-52 items-center justify-center">
            <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No transactions in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ll-border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--ll-text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--ll-text-muted))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--ll-bg-surface))", border: "1px solid hsl(var(--ll-border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="income"   stroke="hsl(142 71% 45%)" fill="url(#gIncome)"  strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(0 84% 60%)"   fill="url(#gExpense)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Net savings bar chart */}
      <div className="ll-card p-4">
        <p className="mb-4 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Net Savings
        </p>
        {mLoading ? (
          <Skeleton className="h-44 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-44 items-center justify-center">
            <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No transactions in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ll-border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--ll-text-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--ll-text-muted))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--ll-bg-surface))", border: "1px solid hsl(var(--ll-border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="net" name="Net" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spending by Category — full range */}
      <div className="ll-card p-4">
        <p className="mb-1 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Spending by Category
        </p>
        <p className="mb-4 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{subtitleLabel}</p>
        {cLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : cats.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No expense data for this period</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={cats} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {cats.map((c, i) => <Cell key={c.categoryId} fill={c.colour || CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--ll-bg-surface))", border: "1px solid hsl(var(--ll-border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {cats.map((c, i) => (
                <div key={c.categoryId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: c.colour || CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                      <CategoryIcon icon={c.icon} size={12} /> {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ll-mono text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{formatCurrency(c.total)}</span>
                    <span className="ll-mono text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Income by Category — full range */}
      <div className="ll-card p-4">
        <p className="mb-1 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Income by Category
        </p>
        <p className="mb-4 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{subtitleLabel}</p>
        {icLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : incomeCats.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No income data for this period</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={incomeCats} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {incomeCats.map((c, i) => <Cell key={c.categoryId} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--ll-bg-surface))", border: "1px solid hsl(var(--ll-border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {incomeCats.map((c, i) => (
                <div key={c.categoryId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                      <CategoryIcon icon={c.icon} size={12} /> {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ll-mono text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{formatCurrency(c.total)}</span>
                    <span className="ll-mono text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
