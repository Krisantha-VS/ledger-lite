import type { Metadata } from "next";
import { BudgetsViewV2 } from "@/features/budgets/components/v2/budgets-view";

export const metadata: Metadata = { title: "Budgets · LedgerLite Executive" };

export default function V2BudgetsPage() {
  return <BudgetsViewV2 />;
}
