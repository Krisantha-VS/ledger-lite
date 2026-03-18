import type { Metadata } from "next";
import { KpiCardsV2 } from "@/features/dashboard/components/v2/kpi-cards";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";
import { BudgetAlert } from "@/features/dashboard/components/budget-alert";
import { ArrowUpRight, Plus, Filter, Download } from "lucide-react";

export const metadata: Metadata = { title: "Executive Dashboard · LedgerLite" };

export default function V2DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="v2-badge bg-[hsl(var(--v2-accent)/0.1)] text-[hsl(var(--v2-accent))]">Live</span>
             <span className="text-[10px] font-bold text-[hsl(var(--v2-text-muted))] uppercase tracking-wider">Financial Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--v2-text-primary))]">
            Executive Overview
          </h1>
          <p className="text-xs text-[hsl(var(--v2-text-muted))] mt-1">
            Real-time insights across your linked portfolios and credit facilities.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] px-3 text-xs font-semibold text-[hsl(var(--v2-text-primary))] hover:bg-[hsl(var(--v2-bg))] transition-colors shadow-sm">
            <Filter className="h-3.5 w-3.5" />
            Advanced Filters
          </button>
          <button className="flex h-9 items-center gap-2 rounded-md border border-[hsl(var(--v2-border))] bg-[hsl(var(--v2-surface))] px-3 text-xs font-semibold text-[hsl(var(--v2-text-primary))] hover:bg-[hsl(var(--v2-bg))] transition-colors shadow-sm">
            <Download className="h-3.5 w-3.5" />
            Report
          </button>
          <button className="flex h-9 items-center gap-2 rounded-md bg-[hsl(var(--v2-accent))] px-4 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" />
            New Entry
          </button>
        </div>
      </div>

      <BudgetAlert />

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
           <h2 className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Key Performance Indicators</h2>
        </div>
        <KpiCardsV2 />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-1">
             <h2 className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Transaction Velocity</h2>
             <button className="text-[10px] font-bold text-[hsl(var(--v2-accent))] hover:underline flex items-center gap-1">
               Full Statement <ArrowUpRight className="h-2.5 w-2.5" />
             </button>
           </div>
           {/* We can also create a V2 RecentTransactions with a table look */}
           <div className="v2-card overflow-hidden">
             <RecentTransactions />
           </div>
        </div>
        
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
             <h2 className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--v2-text-muted))]">Portfolio Allocation</h2>
           </div>
           <div className="v2-card p-6 h-[400px] flex flex-col items-center justify-center text-center">
              <div className="h-48 w-48 rounded-full border-8 border-[hsl(var(--v2-accent)/0.1)] border-t-[hsl(var(--v2-accent))] animate-spin-slow mb-4" />
              <p className="text-xs font-bold text-[hsl(var(--v2-text-primary))]">Analyzing Allocations...</p>
              <p className="text-[10px] text-[hsl(var(--v2-text-muted))] mt-1">Fetching real-time market data</p>
           </div>
        </div>
      </div>
    </div>
  );
}
