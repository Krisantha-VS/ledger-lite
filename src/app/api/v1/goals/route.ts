import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const CreateSchema = z.object({
  name:         z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  targetDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  accountId:    z.number().int().positive().nullable().optional(),
  colour:       z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const goals  = await db.goal.findMany({
      where:   { userId },
      include: { account: true },
      orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
    });

    const enriched = await Promise.all(goals.map(async g => {
      let currentBalance = 0;
      let projectedCompletionDate: string | null = null;

      if (g.account) {
        const [balRow] = await db.$queryRaw<{ balance: number }[]>`
          SELECT (${g.account.startingBalance}
            + COALESCE(SUM(CASE WHEN type='income'   THEN amount ELSE 0 END),0)
            - COALESCE(SUM(CASE WHEN type='expense'  THEN amount ELSE 0 END),0)
            - COALESCE(SUM(CASE WHEN type='transfer' THEN amount ELSE 0 END),0)
            + COALESCE((SELECT SUM(t2.amount) FROM "Transaction" t2
                         WHERE t2."transferToId"=${g.account.id} AND t2."userId"=${userId}),0)
          )::float AS balance
          FROM "Transaction" WHERE "accountId"=${g.account.id}
        `;
        currentBalance = balRow?.balance ?? Number(g.account.startingBalance);

        // Projected completion: avg monthly net over last 3 months
        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const [netRow] = await db.$queryRaw<{ net: number }[]>`
          SELECT (
            COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0)
            - COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0)
          )::float / 3 AS net
          FROM "Transaction"
          WHERE "userId"=${userId} AND "accountId"=${g.account.id}
            AND date >= ${threeMonthsAgo}
        `;
        const avgMonthlyNet = netRow?.net ?? 0;
        if (avgMonthlyNet > 0) {
          const remaining     = Number(g.targetAmount) - currentBalance;
          const monthsNeeded  = remaining > 0 ? Math.ceil(remaining / avgMonthlyNet) : 0;
          const projected     = new Date(); projected.setMonth(projected.getMonth() + monthsNeeded);
          projectedCompletionDate = projected.toISOString().slice(0, 10);
        }
      }

      return { ...g, currentBalance, projectedCompletionDate };
    }));

    return ok(enriched);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = CreateSchema.parse(await req.json());

    if (body.accountId) {
      const acc = await db.account.findFirst({ where: { id: body.accountId, userId } });
      if (!acc) return fail("Account not found", 404);
    }

    const goal = await db.goal.create({
      data: {
        userId, name: body.name, targetAmount: body.targetAmount,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        accountId:  body.accountId ?? null, colour: body.colour,
      },
    });
    return ok(goal, 201);
  } catch (e) { return handleError(e); }
}
