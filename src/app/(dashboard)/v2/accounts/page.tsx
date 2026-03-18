import type { Metadata } from "next";
import { AccountsViewV2 } from "@/features/accounts/components/v2/accounts-view";

export const metadata: Metadata = { title: "Accounts · LedgerLite Executive" };

export default function V2AccountsPage() {
  return <AccountsViewV2 />;
}
