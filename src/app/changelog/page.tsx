import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { ChangelogView } from "@/components/releases/changelog-view";

export const metadata: Metadata = {
  title:       "Release Notes",
  description: "A record of every update, improvement, and fix to LedgerLite.",
};

export default function ChangelogPage() {
  return (
    <div style={{ background: "var(--land-bg)", minHeight: "100vh", color: "var(--land-text)" }}>
      <LandingNav />
      <ChangelogView />
      <LandingFooter />
    </div>
  );
}
