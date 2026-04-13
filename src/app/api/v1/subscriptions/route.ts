import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";

function toMonthlyAmount(amount: number, recurrence: string | null): number {
  switch (recurrence) {
    case "weekly":  return amount * 4.33;
    case "monthly": return amount;
    default:        return amount;
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);

    const transactions = await db.transaction.findMany({
      where:   { userId, isRecurring: true, deletedAt: null },
      orderBy: { date: "desc" },
      select: {
        id:         true,
        note:       true,
        amount:     true,
        recurrence: true,
        nextDue:    true,
        date:       true,
        categoryId: true,
        accountId:  true,
        category: { select: { name: true, icon: true, colour: true } },
      },
    });

    // Group by normalised note (merchant description)
    const grouped: Record<string, {
      key:              string;
      description:      string;
      recurrence:       string;
      nextDue:          Date | null;
      lastAmount:       number;
      monthlyEquivalent: number;
      occurrences:      number;
      categoryId:       number;
      accountId:        number;
      categoryName:     string;
      categoryIcon:     string;
      categoryColour:   string;
      lastTransactionId: number;
    }> = {};

    for (const tx of transactions) {
      const key = (tx.note ?? "unknown").trim().toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          key,
          description:       tx.note ?? "Unknown",
          recurrence:        tx.recurrence ?? "monthly",
          nextDue:           tx.nextDue,
          lastAmount:        Number(tx.amount),
          monthlyEquivalent: toMonthlyAmount(Number(tx.amount), tx.recurrence),
          occurrences:       1,
          categoryId:        tx.categoryId,
          accountId:         tx.accountId,
          categoryName:      tx.category.name,
          categoryIcon:      tx.category.icon,
          categoryColour:    tx.category.colour,
          lastTransactionId: tx.id,
        };
      } else {
        grouped[key].occurrences += 1;
        // Keep the nearest upcoming due date
        if (tx.nextDue && (!grouped[key].nextDue || tx.nextDue < grouped[key].nextDue!)) {
          grouped[key].nextDue = tx.nextDue;
        }
      }
    }

    const subscriptions = Object.values(grouped).sort(
      (a, b) => b.monthlyEquivalent - a.monthlyEquivalent,
    );

    const totalMonthly = subscriptions.reduce((sum, s) => sum + s.monthlyEquivalent, 0);

    return ok({ subscriptions, totalMonthly });
  } catch (e) { return handleError(e); }
}
