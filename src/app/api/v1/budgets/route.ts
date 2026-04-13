import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";
import { getUserEmail } from "@/lib/auth";
import { z } from "zod";
import { sendMail } from "@/infrastructure/email/mailer";
import { budgetExceededEmail } from "@/infrastructure/email/templates";

const UpsertSchema = z.object({
  categoryId: z.number().int().positive(),
  amount:     z.number().positive(),
  rollover:   z.boolean().optional(),
});

/** Compute how much carried over from last month (0 if rollover disabled). */
async function computeRollover(
  userId: string,
  categoryId: number,
  budgetAmount: number,
): Promise<number> {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const spent = await db.transaction.aggregate({
    where: { userId, categoryId, type: "expense", date: { gte: start, lte: end }, deletedAt: null },
    _sum: { amount: true },
  });
  const usedAmount = Number(spent._sum.amount ?? 0);
  const surplus    = budgetAmount - usedAmount;
  return surplus > 0 ? surplus : 0;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const now    = new Date();
    const start  = new Date(now.getFullYear(), now.getMonth(), 1);
    const end    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const budgets = await db.budget.findMany({
      where: { userId },
      include: { category: { select: { name: true, colour: true, icon: true } } },
    });

    const spentRows = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: { gte: start, lte: end }, deletedAt: null },
      _sum: { amount: true },
    });
    const spentMap = Object.fromEntries(spentRows.map(r => [r.categoryId, Number(r._sum.amount ?? 0)]));

    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed  = now.getDate();

    const result = await Promise.all(budgets.map(async b => {
      const spent           = spentMap[b.categoryId] ?? 0;
      const rolloverAmount  = b.rollover ? await computeRollover(userId, b.categoryId, Number(b.amount)) : 0;
      const effectiveAmount = Number(b.amount) + rolloverAmount;

      const spentNum    = Number(spent);
      const dailyRate   = daysElapsed > 0 ? spentNum / daysElapsed : 0;
      const projectedEnd = Math.round(dailyRate * daysInMonth * 100) / 100;
      const pace = {
        dailyRate:     Math.round(dailyRate * 100) / 100,
        projectedEnd,
        isOnTrack:     projectedEnd <= effectiveAmount,
        daysRemaining: daysInMonth - daysElapsed,
      };

      return {
        ...b,
        amount:          Number(b.amount),
        spent,
        rolloverAmount,
        effectiveAmount,
        pace,
        categoryName:   b.category.name,
        categoryColour: b.category.colour,
        categoryIcon:   b.category.icon,
      };
    }));

    return ok(result);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const userId    = await getUserId(req);
    const userEmail = await getUserEmail(req);
    const body      = UpsertSchema.parse(await req.json());

    const budget = await db.budget.upsert({
      where:  { userId_categoryId: { userId, categoryId: body.categoryId } },
      create: { userId, categoryId: body.categoryId, amount: body.amount, rollover: body.rollover ?? false },
      update: { amount: body.amount, ...(body.rollover !== undefined && { rollover: body.rollover }) },
      include: { category: { select: { name: true, colour: true, icon: true } } },
    });

    if (userEmail) {
      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const spentRow = await db.transaction.aggregate({
        where: { userId, categoryId: body.categoryId, type: "expense", date: { gte: start, lte: end }, deletedAt: null },
        _sum: { amount: true },
      });
      const spent = Number(spentRow._sum.amount ?? 0);

      if (spent > body.amount) {
        const { subject, html } = budgetExceededEmail({
          categoryName: budget.category.name,
          spent,
          budget:       body.amount,
          currency:     "USD",
        });
        sendMail(userEmail, subject, html).catch(err => console.error("email error:", err));
      }
    }

    return ok(budget, 201);
  } catch (e) { return handleError(e); }
}
