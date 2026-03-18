import type { Metadata } from "next";
import { ImportView } from "@/features/import/components/import-view";
export const metadata: Metadata = { title: "Import · LedgerLite" };
export default function ImportPage() { return <ImportView />; }
