"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useMonthlySummary, useCategoryBreakdown } from "@/features/summary/hooks/useSummary";
import { formatCurrency, formatMonth } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = [
  "hsl(239 84% 67%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)",
  "hsl(330 81% 60%)", "hsl(199 89% 48%)", "hsl(24 95% 53%)",
  "hsl(262 83% 58%)", "hsl(0 84% 60%)",
];

export function ReportsView() {
  const { rows: monthly, loading: mLoading } = useMonthlySummary(6);
  const { rows: cats,    loading: cLoading }  = useCategoryBreakdown();

  const chartData = monthly.map(r => ({
    month:    formatMonth(r.month),
    income:   r.income,
    expenses: r.expenses,
    net:      r.net,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Reports</h1>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>6-month overview</p>
      </div>

      {/* Income vs Expenses area chart */}
      <div className="ll-card p-4">
        <p className="mb-4 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Income vs Expenses
        </p>
        {mLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
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

      {/* Category breakdown */}
      <div className="ll-card p-4">
        <p className="mb-4 text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Spending by Category (This Month)
        </p>
        {cLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : cats.length === 0 ? (
          <p className="py-8 text-center text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>No expense data this month</p>
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
                    <span className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{c.icon} {c.name}</span>
                  </div>
                  <span className="ll-mono text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
