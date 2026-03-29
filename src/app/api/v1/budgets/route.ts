import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";
import { getUserEmail } from "@/lib/auth";
import { z } from "zod";
import { sendMail } from "@/infrastructure/email/mailer";
import { budgetExceededEmail } from "@/infrastructure/email/templates";

const UpsertSchema = z.object({
  categoryId: z.number().int().positive(),
  amount:     z.number().positive(),
});

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

    // Compute monthly spend per category
    const spentRows = await db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "expense", date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const spentMap = Object.fromEntries(spentRows.map(r => [r.categoryId, r._sum.amount ?? 0]));

    const result = budgets.map(b => ({
      ...b,
      spent:          Number(spentMap[b.categoryId] ?? 0),
      categoryName:   b.category.name,
      categoryColour: b.category.colour,
      categoryIcon:   b.category.icon,
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
      create: { userId, ...body },
      update: { amount: body.amount },
      include: { category: { select: { name: true, colour: true, icon: true } } },
    });

    // ── Email trigger: check if current month spend exceeds budget ──────────
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
