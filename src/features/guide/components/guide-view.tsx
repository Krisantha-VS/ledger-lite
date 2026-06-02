"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Upload, BarChart3, Target, PiggyBank, Sparkles, CreditCard, ArrowUpDown } from "lucide-react";

interface Section {
  icon: React.ElementType;
  title: string;
  items: { q: string; a: string }[];
}

const SECTIONS: Section[] = [
  {
    icon: BookOpen,
    title: "Getting Started",
    items: [
      {
        q: "How do I add my first account?",
        a: "Go to Accounts in the sidebar and click 'New Account'. Enter your account name (e.g. 'HSBC Checking'), type, and your current balance. This starting balance is used to calculate your live account balance as you add transactions.",
      },
      {
        q: "How do I add transactions manually?",
        a: "Go to Transactions and click 'New' (or press N). Fill in the date, amount, type (income / expense / transfer), category, and account. Add a note to describe it. Click Save.",
      },
      {
        q: "What file types can I import from my bank?",
        a: "Klivo accepts CSV, PDF, XLSX, XLS, OFX, QFX, and TXT files. Most banks let you export a statement in CSV or PDF from their online portal. Go to Import to get started.",
      },
      {
        q: "How does AI import work?",
        a: "Upload any bank statement file and Klivo's AI (Claude Haiku) reads it and extracts all transactions automatically — including date, amount, type, and category suggestions. You review the extracted rows, check/uncheck what to import, then click Import. No manual column mapping needed.",
      },
    ],
  },
  {
    icon: Upload,
    title: "Importing Transactions",
    items: [
      {
        q: "How many AI imports do I get per month?",
        a: "Free plan: 0 (manual CSV only). Lite plan: 3 AI imports per month. Pro plan: unlimited. Your remaining quota is shown at the top of the Import page and in the sidebar subscription card.",
      },
      {
        q: "What if AI fails to parse my file?",
        a: "For CSV files, Klivo automatically falls back to manual column mapping where you select which column is the date, description, and amount. For PDF/XLSX/OFX files, if AI fails you'll see an error and can try re-uploading or contact support.",
      },
      {
        q: "How does duplicate detection work?",
        a: "After AI extracts transactions, Klivo checks your existing transactions for matches on the same date and amount. Potential duplicates are flagged and unchecked by default — you decide whether to include them.",
      },
      {
        q: "Can I import from Mint or other finance apps?",
        a: "Yes. Klivo auto-detects Mint CSV exports and preserves the existing categories. Just upload your Mint export CSV and it will be handled automatically.",
      },
    ],
  },
  {
    icon: ArrowUpDown,
    title: "Transactions",
    items: [
      {
        q: "How do I filter transactions by date range?",
        a: "On the Transactions page, click the 'Date range' button in the filter bar. Pick a quick range (This month, Last 7d, Last 30d, Last 90d) or enter custom From / To dates. Period summary tiles (Income, Spending, Net) appear above the list to show totals for the selected range.",
      },
      {
        q: "How do I filter by category?",
        a: "Use the 'All categories' dropdown in the filter bar to narrow transactions to a specific category.",
      },
      {
        q: "Can I edit a transaction?",
        a: "Yes. Hover over any transaction row and click the pencil icon, or click the row on mobile. You can change any field including date, amount, category, and note.",
      },
      {
        q: "What is a recurring transaction?",
        a: "A recurring transaction automatically creates a new copy on its next due date (weekly or monthly). Set a transaction as recurring in the transaction form. The Import page also detects recurring patterns in your statement and lets you confirm them.",
      },
    ],
  },
  {
    icon: PiggyBank,
    title: "Budgets",
    items: [
      {
        q: "How do I set a budget?",
        a: "Go to Budgets and click 'New Budget'. Select a category (e.g. Groceries), set a monthly limit, and optionally enable rollover. Rollover carries any unspent amount to the following month.",
      },
      {
        q: "How do I edit a budget?",
        a: "Click the pencil icon on any budget card. You can change the monthly limit and rollover setting. The category cannot be changed — delete and recreate if you need a different category.",
      },
      {
        q: "What happens to my transactions when I delete a budget?",
        a: "Nothing. Deleting a budget only removes the spending limit. All your existing transactions in that category are preserved and unaffected.",
      },
      {
        q: "What do the warning colours mean?",
        a: "Blue = on track. Amber = nearly at limit (75%+ used). Red = over limit. The pace forecast below each bar shows whether you're on track to stay within the limit by end of month.",
      },
    ],
  },
  {
    icon: Target,
    title: "Goals",
    items: [
      {
        q: "How do I track progress toward a savings goal?",
        a: "Create a goal under Goals, enter a target amount and optional target date, and link it to an account. Klivo uses the linked account's current balance as the 'saved so far' amount, so your goal progress updates automatically as you add transactions.",
      },
      {
        q: "Can I edit or delete a goal?",
        a: "Yes. Each goal card has a pencil icon (edit) and a trash icon (delete). Deleting a goal only removes the goal tracker — your account and transactions are not affected.",
      },
      {
        q: "How do I filter and sort goals?",
        a: "Use the filter chips (All / In Progress / Completed) and the Sort dropdown (by date added, % complete, target date, or amount) at the top of the Goals page.",
      },
    ],
  },
  {
    icon: BarChart3,
    title: "Reports",
    items: [
      {
        q: "How do I view spending over a date range?",
        a: "Go to Reports and select a range: Last 3 months, Last 6 months, Last 12 months, or Year to date. All charts — including the Income vs Expenses area chart, Net Savings bar chart, and category breakdowns — update to reflect the full selected range.",
      },
      {
        q: "Why do the category pie charts show 'no data'?",
        a: "The pie charts aggregate spending across the entire selected range. If you have no transactions in a category for that period, it won't appear. Try a wider range or add some transactions first.",
      },
    ],
  },
  {
    icon: Sparkles,
    title: "AI Features",
    items: [
      {
        q: "What AI features are available?",
        a: "AI bank statement import (Lite/Pro), smart category suggestions (all plans, on transaction create), spending insights and anomaly alerts on the dashboard, budget recommendations, and goal coaching messages.",
      },
      {
        q: "Which AI model does Klivo use?",
        a: "Claude Haiku for fast, cost-efficient tasks (import parsing, category suggestions). Claude Sonnet for deeper analysis (spending insights, goal coaching). No OpenAI dependency.",
      },
      {
        q: "How do I get more AI imports if I run out?",
        a: "Upgrade to Pro for unlimited AI imports. On the Import page, when your quota is exhausted you'll see an 'Upgrade to Pro' link. Lite users get 3 imports per month; the counter resets on the 1st of each month.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Subscription & Billing",
    items: [
      {
        q: "What's included in each plan?",
        a: "Free: 1 account, 50 transactions/month, 3-month history, no AI import. Lite ($9/mo or $7/mo annual): 3 accounts, unlimited transactions, 12-month history, 3 AI imports/month. Pro: everything unlimited.",
      },
      {
        q: "How do I upgrade?",
        a: "Click the upgrade prompt in the sidebar, on the Import page, or go to Settings → Billing. You'll be taken through a secure Dodo Payments checkout.",
      },
      {
        q: "What happens if my payment fails?",
        a: "You'll enter a 3-day grace period where your paid features remain active. You'll receive an email reminder. After the grace period, your account reverts to the Free plan until payment is resolved.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "Go to Settings → Billing and click 'Cancel subscription'. Your plan remains active until the end of the current billing period, then reverts to Free. Your data is never deleted.",
      },
      {
        q: "Is my financial data safe?",
        a: "Yes. All data is stored in a private Neon Postgres database. AI parsing uses zero-disk-write — your uploaded files are processed in memory and never stored. We never sell your data.",
      },
    ],
  },
];

function AccordionSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const Icon = section.icon;

  const toggleItem = (i: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="ll-card overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ background: "hsl(var(--ll-accent)/0.12)" }}>
          <Icon className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
        </div>
        <span className="flex-1 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          {section.title}
        </span>
        <span className="text-[11px] mr-2" style={{ color: "hsl(var(--ll-text-muted))" }}>
          {section.items.length} topics
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-text-muted))" }} />
          : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-text-muted))" }} />
        }
      </button>

      {open && (
        <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border) / 0.5)", borderTop: "1px solid hsl(var(--ll-border))" }}>
          {section.items.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggleItem(i)}
                className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex-1 text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {item.q}
                </span>
                {openItems.has(i)
                  ? <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--ll-text-muted))" }} />
                  : <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--ll-text-muted))" }} />
                }
              </button>
              {openItems.has(i) && (
                <div className="px-5 pb-4">
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GuideView() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>User Guide</h1>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Everything you need to know about using Klivo
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(section => (
          <AccordionSection key={section.title} section={section} />
        ))}
      </div>

      <div className="ll-card p-4 text-center space-y-2">
        <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
          Still have questions?
        </p>
        <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
          Email us at <span style={{ color: "hsl(var(--ll-accent))" }}>support@klivo.app</span>
        </p>
      </div>
    </div>
  );
}
