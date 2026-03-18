import type { Metadata } from "next";
import { GoalsViewV2 } from "@/features/goals/components/v2/goals-view";

export const metadata: Metadata = { title: "Goals · LedgerLite Executive" };

export default function V2GoalsPage() {
  return <GoalsViewV2 />;
}
