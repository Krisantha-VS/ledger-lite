import type { Metadata } from "next";
import { ReportsView } from "@/features/reports/components/reports-view";
export const metadata: Metadata = { title: "Reports · LedgerLite" };
export default function ReportsPage() { return <ReportsView />; }
