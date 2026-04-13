import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";

// ─── Recurring pattern detection ────────────────────────────────────────────
// Scans last 180 days of non-recurring transactions for repeat patterns.
// Returns up to 10 suggestions with merchant name, avg amount, and period.

function normalizeDesc(s: string): string {
  return s.toLowerCase().replace(/\d+/g, "").replace(/\s+/g, " ").trim();
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

export async function GET(req: Request) {
  try {
    const userId  = await getUserId(req);
    const since   = new Date();
    since.setDate(since.getDate() - 180);

    // Fetch non-recurring transactions from last 180 days
    const txns = await db.transaction.findMany({
      where: {
        userId,
        isRecurring: false,
        deletedAt:   null,
        type:        { in: ["income", "expense"] },
        date:        { gte: since },
      },
      orderBy: { date: "asc" },
      select: { note: true, amount: true, type: true, date: true } as const,
    });

    // Group by normalised description
    const groups = new Map<string, { note: string; amount: number; type: string; date: Date }[]>();
    for (const t of txns) {
      if (!t.note) continue;
      const key = normalizeDesc(t.note);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ note: t.note, amount: Number(t.amount), type: String(t.type), date: t.date });
    }

    const suggestions: {
      description: string;
      avgAmount:   number;
      type:        string;
      recurrence:  "weekly" | "monthly";
      occurrences: number;
    }[] = [];

    for (const [, rows] of groups) {
      if (rows.length < 3) continue;

      // Check amount consistency (within 20%)
      const amounts = rows.map((r) => r.amount);
      const avgAmt  = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const amtStd  = stdDev(amounts);
      if (amtStd / avgAmt > 0.2) continue;

      // Compute day intervals between consecutive dates
      const sorted    = rows.map((r) => r.date.getTime()).sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push((sorted[i] - sorted[i - 1]) / 86_400_000); // ms → days
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intStd      = stdDev(intervals);

      // Must have consistent intervals (std dev < 6 days)
      if (intStd > 6) continue;

      let recurrence: "weekly" | "monthly" | null = null;
      if (avgInterval >= 5 && avgInterval <= 9)   recurrence = "weekly";
      if (avgInterval >= 25 && avgInterval <= 35) recurrence = "monthly";
      if (!recurrence) continue;

      // Use the most common raw description in the group
      const descFreq = new Map<string, number>();
      for (const r of rows) {
        const d = r.note ?? "";
        descFreq.set(d, (descFreq.get(d) ?? 0) + 1);
      }
      const bestDesc = [...descFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

      suggestions.push({
        description: bestDesc,
        avgAmount:   Math.round(avgAmt * 100) / 100,
        type:        rows[0].type,
        recurrence,
        occurrences: rows.length,
      });

      if (suggestions.length >= 10) break;
    }

    // Sort by occurrences descending
    suggestions.sort((a, b) => b.occurrences - a.occurrences);

    return ok(suggestions);
  } catch (e) { return handleError(e); }
}
