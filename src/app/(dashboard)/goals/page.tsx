import type { Metadata } from "next";
import { GoalsView } from "@/features/goals/components/goals-view";
export const metadata: Metadata = { title: "Goals · LedgerLite" };
export default function GoalsPage() { return <GoalsView />; }
