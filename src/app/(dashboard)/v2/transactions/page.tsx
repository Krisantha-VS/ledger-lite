import type { Metadata } from "next";
import { TransactionsViewV2 } from "@/features/transactions/components/v2/transactions-view";

export const metadata: Metadata = { title: "Transactions · LedgerLite Executive" };

export default function V2TransactionsPage() {
  return <TransactionsViewV2 />;
}
