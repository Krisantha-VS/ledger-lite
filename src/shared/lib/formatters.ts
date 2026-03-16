// All monetary values use tabular numerals — enforced via CSS class `tabular-nums`.

export function formatCurrency(
  amount: number,
  currency = "USD",
  opts?: { compact?: boolean },
): string {
  if (opts?.compact) {
    if (Math.abs(amount) >= 1_000_000)
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1_000)
      return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, style: "short" | "medium" = "medium"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: style === "short" ? "short" : "long",
    day: "numeric",
    year: style === "short" ? undefined : "numeric",
  });
}

export function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "short", year: "numeric",
  });
}

export function signedAmount(amount: number, type: "income" | "expense" | "transfer"): string {
  const fmt = formatCurrency(Math.abs(amount));
  if (type === "income")  return `+${fmt}`;
  if (type === "expense") return `-${fmt}`;
  return fmt;
}
