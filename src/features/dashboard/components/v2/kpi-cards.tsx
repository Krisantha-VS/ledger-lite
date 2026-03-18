"use client";

import { TrendingUp, TrendingDown, DollarSign, Activity, Landmark, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useDashboardSummary, useNetWorth } from "@/features/summary/hooks/useSummary";
import { formatCurrency } from "@/shared/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const MOCK_SPARKLINE = [
  { v: 400 }, { v: 300 }, { v: 500 }, { v: 450 }, { v: 600 }, { v: 550 }, { v: 700 }
];

export function KpiCardsV2() {
  const { summary, loading } = useDashboardSummary();
  const { data: netWorthData, loading: nwLoading } = useNetWorth();

  if (loading || nwLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Balance",
      value: formatCurrency(netWorthData?.netWorth ?? 0),
      trend: "+2.4%",
      isPositive: true,
      icon: Landmark,
      color: "hsl(var(--v2-accent))",
    },
    {
      label: "Monthly Income",
      value: formatCurrency(summary?.monthIncome ?? 0),
      trend: "+12.1%",
      isPositive: true,
      icon: TrendingUp,
      color: "hsl(var(--ll-income))",
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(summary?.monthExpenses ?? 0),
      trend: "-4.3%",
      isPositive: true, // expense going down is positive
      icon: TrendingDown,
      color: "hsl(var(--ll-expense))",
    },
    {
      label: "Net Savings",
      value: formatCurrency(summary?.monthNet ?? 0),
      trend: "+8.2%",
      isPositive: (summary?.monthNet ?? 0) >= 0,
      icon: Activity,
      color: (summary?.monthNet ?? 0) >= 0 ? "hsl(var(--v2-accent))" : "hsl(var(--ll-expense))",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(c => (
        <div key={c.label} className="v2-card group p-5 flex flex-col justify-between transition-all hover:border-[hsl(var(--v2-accent)/0.3)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--v2-text-muted))] mb-1">{c.label}</p>
              <h3 className="text-xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">{c.value}</h3>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--v2-surface))] border border-[hsl(var(--v2-border))] shadow-sm group-hover:bg-[hsl(var(--v2-accent)/0.05)] transition-colors">
              <c.icon className="h-4 w-4" style={{ color: c.color }} />
            </div>
          </div>
          
          <div className="mt-4 flex items-end justify-between">
             <div className="flex items-center gap-1.5">
                <div className={cn(
                  "flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[10px] font-bold",
                  c.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                )}>
                  {c.isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {c.trend}
                </div>
                <span className="text-[10px] text-[hsl(var(--v2-text-muted))]">vs last month</span>
             </div>
             
             {/* Sparkline */}
             <div className="h-8 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={MOCK_SPARKLINE}>
                   <Area 
                    type="monotone" 
                    dataKey="v" 
                    stroke={c.color} 
                    fill={c.color} 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                  />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
