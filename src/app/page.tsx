import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Screenshots } from "@/components/landing/screenshots";
import { Stats } from "@/components/landing/stats";
import { CTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: { absolute: "LedgerLite — Your finances, cleared." },
  description:
    "Drop a bank statement PDF or CSV. LedgerLite parses it with AI in under a second — categorised, deduplicated, and ready to review.",
};

export default function LandingPage() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh" }} className="text-white">
      <LandingNav />
      <Hero />
      <Features />
      <Screenshots />
      <Stats />
      <CTA />
      <LandingFooter />
    </div>
  );
}
