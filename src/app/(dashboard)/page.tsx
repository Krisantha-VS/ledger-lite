import type { Metadata } from "next";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";

export const metadata: Metadata = { title: "Dashboard · LedgerLite" };

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
      <KpiCards />
      <RecentTransactions />
    </div>
  );
}
