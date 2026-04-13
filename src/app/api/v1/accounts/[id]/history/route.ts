import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId    = await getUserId(req);
    const { id }    = await params;
    const accountId = parseInt(id);

    // Verify ownership
    const account = await db.account.findFirst({ where: { id: accountId, userId } });
    if (!account) return ok([]);

    // Monthly balance: startingBalance + cumulative net up to end of each month
    type Row = { month: string; net: number };
    const rows = await db.$queryRaw<Row[]>`
      SELECT TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type='income'  THEN amount
                 WHEN type='expense' THEN -amount
                 WHEN type='transfer' AND "accountId"=${accountId} THEN -amount
                 ELSE 0 END)::float AS net
      FROM "Transaction"
      WHERE "accountId"=${accountId}
        AND "userId"=${userId}
        AND "deletedAt" IS NULL
        AND date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month
      ORDER BY month ASC
    `;

    // Build cumulative balance from startingBalance
    let running = Number(account.startingBalance);
    const points = rows.map(r => {
      running += r.net;
      return { month: r.month, balance: Math.round(running * 100) / 100 };
    });

    return ok(points);
  } catch (e) { return handleError(e); }
}
