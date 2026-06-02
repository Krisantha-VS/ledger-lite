export type ChangeType = "New" | "Improved" | "Fixed";

export interface ChangeItem {
  type:        ChangeType;
  description: string;
}

export interface Release {
  version:     string;         // e.g. "1.4.0"
  date:        string;         // ISO date string "YYYY-MM-DD"
  title:       string;         // Short release name
  summary:     string;         // One-sentence overview
  changes:     ChangeItem[];
}

export const RELEASES: Release[] = [
  {
    version: "1.4.0",
    date:    "2026-06-02",
    title:   "AI Suggestions Engine",
    summary: "AI-powered suggestions across the app — from categorising transactions to coaching you toward your savings goals.",
    changes: [
      { type: "New",      description: "Smart category suggestions appear automatically as you type a transaction note. The AI reads the description and suggests the best matching category from your list." },
      { type: "New",      description: "Spending insights widget on the dashboard. After two or more months of data, the app surfaces up to five personalised insights — spending spikes, subscription creep, savings achievements, and more." },
      { type: "New",      description: "Unusual transaction detection. The app automatically flags charges that are significantly higher than your normal spend for that payee, and duplicate charges within three days. Paid plans receive a plain-English explanation for each alert." },
      { type: "New",      description: "Budget recommendations. A new button on the Budgets page analyses your last three months of spending and suggests realistic monthly limits, with a small buffer built in for variable categories." },
      { type: "New",      description: "Goal coaching messages. Each savings goal now shows a one-sentence progress update — on track, ahead, or at risk — that refreshes every 24 hours." },
      { type: "Improved", description: "The import success screen now includes an AI-generated statement summary — top category, biggest charge, period covered, and any notable patterns detected — so you get an instant snapshot after every upload." },
    ],
  },
  {
    version: "1.3.0",
    date:    "2026-04-18",
    title:   "Subscriptions and Billing",
    summary: "Paid plans with Lite and Pro tiers, full billing management, and automated transactional emails.",
    changes: [
      { type: "New",      description: "Lite and Pro subscription plans available via Dodo Payments. Upgrade directly from within the app with no redirects to external checkout pages." },
      { type: "New",      description: "Billing management page. View your current plan, next renewal date, and cancel or change your subscription at any time." },
      { type: "New",      description: "Automated transactional emails for payment receipts, failed payments, subscription cancellations, and access restriction notices." },
      { type: "New",      description: "Founding member pricing. Early subscribers receive a permanent discounted rate that is locked in for the lifetime of their subscription." },
      { type: "New",      description: "Grace period handling. Accounts with a failed payment remain fully active for a grace window before reverting to the free tier, giving time to update payment details." },
      { type: "Improved", description: "Free plan limits are now clearly communicated in the sidebar and on all gated features, making it easy to understand what requires an upgrade." },
    ],
  },
  {
    version: "1.2.0",
    date:    "2026-03-01",
    title:   "AI Bank Statement Parser",
    summary: "Upload any bank statement in any format and let the AI do the work — no column mapping, no credentials required.",
    changes: [
      { type: "New",      description: "AI-powered import for PDF, CSV, XLSX, XLS, OFX, QFX, and TXT bank statements. The AI reads the file, extracts every transaction, and assigns a category — regardless of which bank or country issued the statement." },
      { type: "New",      description: "Automatic duplicate detection during import. Transactions that already exist in your account are flagged and unchecked by default, so you can review before committing." },
      { type: "New",      description: "Recurring transaction detection during import. The app compares incoming transactions against your history and suggests marking matching amounts as recurring." },
      { type: "New",      description: "Statement metadata card. After parsing, the app displays detected bank name, account number, statement period, opening and closing balances, and credit card details when present." },
      { type: "New",      description: "Confidence scoring. Each AI-extracted row shows a confidence percentage. Low-confidence rows are highlighted for manual review before importing." },
      { type: "Improved", description: "Manual CSV column mapping is still available as a fallback if the AI cannot parse a file, preserving compatibility with any CSV format." },
    ],
  },
  {
    version: "1.1.0",
    date:    "2026-02-01",
    title:   "Goals, Budgets, and Reports",
    summary: "Tools to plan ahead — set savings goals, define spending limits, and review your financial history.",
    changes: [
      { type: "New",      description: "Savings goals. Create goals with a target amount and optional deadline. The app tracks progress against a linked account and projects your completion date at the current savings rate." },
      { type: "New",      description: "Monthly budgets per category. Set spending limits and get alerted on the dashboard when any budget is over its limit." },
      { type: "New",      description: "Date range spending reports. Filter transactions by custom date range and view a breakdown by category with income, expense, and net totals." },
      { type: "New",      description: "Recurring transactions management. Mark any transaction as recurring (weekly or monthly) and view all recurring items in one place." },
      { type: "New",      description: "CSV export. Download any transaction list as a CSV file for use in spreadsheets or other tools." },
      { type: "New",      description: "Progressive Web App support. Install the app on any mobile or desktop device directly from the browser — no app store required." },
      { type: "Improved", description: "Dashboard now shows a net worth card combining all account balances, and a cash flow chart with six months of income and expense history." },
    ],
  },
  {
    version: "1.0.0",
    date:    "2026-01-15",
    title:   "Initial Release",
    summary: "The first public release of LedgerLite — personal finance tracking that works with any bank, anywhere.",
    changes: [
      { type: "New", description: "Account management for checking, savings, cash, credit, and investment accounts. Each account has a starting balance and tracks live balance from all transactions." },
      { type: "New", description: "Transaction tracking with income, expense, and transfer types. Add transactions manually with a category, date, amount, and optional note." },
      { type: "New", description: "Category management. Create custom spending and income categories with a name, icon, and colour." },
      { type: "New", description: "Dashboard with month-to-date income, expenses, net flow, and a budget alert for any categories over their limit." },
      { type: "New", description: "Secure authentication. Sign in with your LedgerLite account — no third-party bank credentials required at any point." },
      { type: "New", description: "Dark and light theme with system preference detection. Switch at any time from the navigation bar." },
    ],
  },
];

export function formatReleaseDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
}
