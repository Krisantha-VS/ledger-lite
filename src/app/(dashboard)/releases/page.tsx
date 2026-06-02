import type { Metadata } from "next";
import { ChangelogView } from "@/components/releases/changelog-view";

export const metadata: Metadata = { title: "Release Notes" };

export default function ReleasesPage() {
  return <ChangelogView />;
}
