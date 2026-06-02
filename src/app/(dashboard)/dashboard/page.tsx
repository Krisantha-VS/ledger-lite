import type { Metadata } from "next";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";
import { BudgetAlert } from "@/features/dashboard/components/budget-alert";
import { CashflowWidget } from "@/features/dashboard/components/cashflow-widget";
import { RecurringSuggestionsLoader } from "@/features/dashboard/components/recurring-suggestions-loader";
import { GoalsProgressWidget } from "@/features/dashboard/components/goals-progress-widget";
import { InsightsWidget } from "@/features/dashboard/components/insights-widget";
import { AnomaliesWidget } from "@/features/dashboard/components/anomalies-widget";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Dashboard
        </h1>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Your financial overview for this month
        </p>
      </div>
      <BudgetAlert />
      <KpiCards />
      <InsightsWidget />
      <AnomaliesWidget />
      <div className="grid gap-5 lg:grid-cols-2">
        <CashflowWidget />
        <GoalsProgressWidget />
      </div>
      <RecurringSuggestionsLoader />
      <RecentTransactions />
    </div>
  );
}
