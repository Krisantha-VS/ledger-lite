import type { Metadata } from "next";
import { GuideView } from "@/features/guide/components/guide-view";
export const metadata: Metadata = { title: "User Guide" };
export default function GuidePage() { return <GuideView />; }
