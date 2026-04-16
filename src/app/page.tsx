import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Screenshots } from "@/components/landing/screenshots";
import { Pricing } from "@/components/landing/pricing";
import { Stats } from "@/components/landing/stats";
import { CTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: { absolute: "LedgerLite — Personal finance for every bank, everywhere." },
  description:
    "Upload any bank statement PDF, CSV, or Excel file. LedgerLite's AI categorizes every transaction automatically — no bank credentials, no country restrictions, no sync to break.",
};

export default function LandingPage() {
  return (
    <div style={{ background: "var(--land-bg)", minHeight: "100vh", color: "var(--land-text)" }}>
      <LandingNav />
      <Hero />
      <Features />
      <Screenshots />
      <Pricing />
      <Stats />
      <CTA />
      <LandingFooter />
    </div>
  );
}
