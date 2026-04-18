"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";

interface Feature {
  text: string;
  available: boolean;
}

interface Tier {
  name: string;
  badge?: string;
  price: (annual: boolean) => string;
  billingNote: (annual: boolean) => string;
  description: string;
  features: Feature[];
  cta: string;
  href: string;
  highlighted: boolean;
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: () => "$0",
    billingNote: () => "forever",
    description: "Get a feel for LedgerLite. No card required.",
    features: [
      { text: "1 bank account", available: true },
      { text: "3 months transaction history", available: true },
      { text: "50 manual transactions/month", available: true },
      { text: "Basic dashboard", available: true },
      { text: "1 savings goal", available: true },
      { text: "AI statement import", available: false },
    ],
    cta: "Start free →",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Lite",
    badge: "MOST POPULAR",
    price: (annual) => (annual ? "$4.92/mo" : "$7/mo"),
    billingNote: (annual) =>
      annual ? "billed $59/yr · save $25" : "billed monthly",
    description: "For individuals who want real AI-powered clarity.",
    features: [
      { text: "3 bank accounts", available: true },
      { text: "12 months history", available: true },
      { text: "Unlimited transactions", available: true },
      { text: "3 AI imports per month", available: true },
      { text: "Budget tracking", available: true },
      { text: "3 savings goals", available: true },
      { text: "Basic reports", available: true },
    ],
    cta: "Get Lite →",
    href: "/login",
    highlighted: true,
  },
  {
    name: "Pro",
    price: (annual) => (annual ? "$9.08/mo" : "$14/mo"),
    billingNote: (annual) =>
      annual ? "billed $109/yr · save $59" : "billed monthly",
    description: "For freelancers, expats, and power users.",
    features: [
      { text: "Unlimited accounts", available: true },
      { text: "Unlimited history", available: true },
      { text: "Unlimited AI imports", available: true },
      { text: "Multi-currency support", available: true },
      { text: "Subscription tracker", available: true },
      { text: "Full reports + CSV export", available: true },
      { text: "Tax-ready export", available: true },
      { text: "Priority support", available: true },
    ],
    cta: "Get Pro →",
    href: "/login",
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="border-t"
      style={{ borderColor: "var(--land-border)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">

        {/* Section label */}
        <div className="mb-6">
          <p
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: "var(--land-muted)" }}
          >
            04 &mdash; PRICING
          </p>
        </div>
        <hr style={{ borderColor: "var(--land-border)" }} className="mb-10" />

        {/* Headline */}
        <h2
          className="text-3xl font-semibold tracking-tight mb-4 lg:text-4xl"
          style={{ color: "var(--land-fg)" }}
        >
          Simple, honest pricing.
          <br />
          <span style={{ color: "var(--land-muted)" }}>
            Free to start. Upgrade when you&apos;re ready.
          </span>
        </h2>

        {/* Annual / Monthly toggle */}
        <div className="mt-8 mb-10 flex items-center gap-3">
          <div
            className="inline-flex rounded-full p-1"
            style={{
              background: "var(--land-surface)",
              border: "1px solid var(--land-border)",
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: !annual ? "hsl(var(--ll-accent))" : "transparent",
                color: !annual ? "#fff" : "var(--land-muted)",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                background: annual ? "hsl(var(--ll-accent))" : "transparent",
                color: annual ? "#fff" : "var(--land-muted)",
              }}
            >
              Annual
              {annual && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.22)",
                    color: "#fff",
                    letterSpacing: "0.02em",
                  }}
                >
                  Save 35%
                </span>
              )}
              {!annual && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "hsl(var(--ll-accent) / 0.12)",
                    color: "hsl(var(--ll-accent))",
                    letterSpacing: "0.02em",
                  }}
                >
                  Save 35%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Founding Member banner */}
        <div
          className="mb-8 flex flex-col gap-2 rounded-lg px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: "hsl(var(--ll-accent) / 0.08)",
            border: "1px solid hsl(var(--ll-accent) / 0.2)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--land-fg)" }}>
            <span className="mr-1">⚡</span>
            <span className="font-semibold">Founding Member offer</span>
            {" — "}
            First 100 users get Pro locked at{" "}
            <span className="font-semibold">$7/mo for life.</span>
          </p>
          <Link
            href="/login"
            className="whitespace-nowrap text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ color: "hsl(var(--ll-accent))" }}
          >
            Claim offer &rarr;
          </Link>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="flex flex-col rounded-xl p-6"
              style={{
                background: tier.highlighted
                  ? "hsl(var(--ll-accent) / 0.04)"
                  : "var(--land-surface)",
                border: tier.highlighted
                  ? "1px solid hsl(var(--ll-accent) / 0.4)"
                  : "1px solid var(--land-border)",
              }}
            >
              {/* Badge */}
              {tier.badge && (
                <p
                  className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "hsl(var(--ll-accent))" }}
                >
                  {tier.badge}
                </p>
              )}

              {/* Name */}
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--land-fg)" }}
              >
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className="text-4xl font-bold tracking-tight"
                  style={{ color: "var(--land-fg)" }}
                >
                  {tier.name === "Pro" && annual ? "$7/mo" : tier.price(annual)}
                </span>
                {tier.name === "Pro" && annual && (
                  <span className="text-xs line-through opacity-50 ml-2" style={{ color: "var(--land-muted)" }}>
                    {tier.price(annual)}
                  </span>
                )}
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--land-muted)" }}
              >
                {tier.name === "Pro" && annual ? "Founding Member rate · locked for life" : tier.billingNote(annual)}
              </p>

              {/* Description */}
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ color: "var(--land-muted)" }}
              >
                {tier.description}
              </p>

              <hr
                className="my-6"
                style={{ borderColor: "var(--land-border)" }}
              />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2.5">
                    {feature.available ? (
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        style={{ color: "hsl(var(--ll-accent))", flexShrink: 0 }}
                      />
                    ) : (
                      <X
                        size={14}
                        strokeWidth={2.5}
                        style={{ color: "var(--land-dim)", flexShrink: 0 }}
                      />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color: feature.available
                          ? "var(--land-fg)"
                          : "var(--land-dim)",
                        textDecoration: feature.available
                          ? "none"
                          : "line-through",
                      }}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Link
                  href={tier.name === "Free" ? "/login" : `/login?plan=${tier.name.toLowerCase()}&billing=${annual ? "annual" : "monthly"}${tier.name === "Pro" && annual ? "&founding=true" : ""}`}
                  className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-85"
                  style={
                    tier.highlighted || tier.name === "Pro"
                      ? {
                          background: "hsl(var(--ll-accent))",
                          color: "#fff",
                          opacity: tier.name === "Pro" ? 0.9 : 1,
                        }
                      : {
                          background: "transparent",
                          color: "var(--land-fg)",
                          border: "1px solid var(--land-border)",
                        }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
