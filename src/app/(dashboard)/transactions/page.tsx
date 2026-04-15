import type { Metadata } from "next";
import { TransactionsView } from "@/features/transactions/components/transactions-view";
export const metadata: Metadata = { title: "Transactions" };
export default function TransactionsPage() { return <TransactionsView />; }
