import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const url    = new URL(req.url);
    const type   = url.searchParams.get("type");

    if (type === "monthly")    return ok(await monthlySummary(userId, parseInt(url.searchParams.get("months") ?? "12")));
    if (type === "categories") {
      const rawTxType = url.searchParams.get("txType");
      const txType: "income" | "expense" = rawTxType === "income" ? "income" : "expense";
      return ok(await categoryBreakdown(userId, url.searchParams.get("month") ?? undefined, txType));
    }
    if (type === "dashboard")  return ok(await dashboardSummary(userId));
    if (type === "networth")   return ok(await netWorthSummary(userId));

    return fail("type must be monthly | categories | dashboard | networth");
  } catch (e) { return handleError(e); }
}

async function monthlySummary(userId: string, months: number) {
  type Row = { month: string; income: number; expenses: number };
  const rows = await db.$queryRaw<Row[]>`
    SELECT TO_CHAR(date, 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0)::float AS income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0)::float AS expenses
    FROM "Transaction"
    WHERE "userId"=${userId}
      AND date >= (CURRENT_DATE - (${months} || ' months')::interval)
    GROUP BY month ORDER BY month ASC
  `;
  return rows.map(r => ({ ...r, net: r.income - r.expenses }));
}

async function categoryBreakdown(userId: string, month?: string, txType: "income" | "expense" = "expense") {
  const now   = new Date();
  const [y, m] = month
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(y, m - 1, 1);
  const end   = new Date(y, m, 0, 23, 59, 59);

  type Row = { categoryId: number; name: string; colour: string; icon: string; total: number };
  const rows = await db.$queryRaw<Row[]>`
    SELECT c.id AS "categoryId", c.name, c.colour, c.icon,
           COALESCE(SUM(t.amount),0)::float AS total
    FROM "Category" c
    LEFT JOIN "Transaction" t
      ON t."categoryId"=c.id AND t."userId"=${userId}
      AND t.type=${txType} AND t.date BETWEEN ${start} AND ${end}
    WHERE c."userId"=${userId}
    GROUP BY c.id HAVING COALESCE(SUM(t.amount),0)>0
    ORDER BY total DESC
  `;

  const grand = rows.reduce((s, r) => s + r.total, 0);
  return rows.map(r => ({ ...r, percentage: grand > 0 ? Math.round((r.total / grand) * 1000) / 10 : 0 }));
}

async function dashboardSummary(userId: string) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [monthData] = await db.$queryRaw<{ income: number; expenses: number }[]>`
    SELECT COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0)::float AS income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0)::float AS expenses
    FROM "Transaction"
    WHERE "userId"=${userId} AND date BETWEEN ${start} AND ${end}
  `;

  const budgetsOverLimit = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM "Budget" b
    WHERE b."userId"=${userId}
    AND (SELECT COALESCE(SUM(t.amount),0) FROM "Transaction" t
         WHERE t."categoryId"=b."categoryId" AND t."userId"=${userId}
           AND t.type='expense' AND t.date BETWEEN ${start} AND ${end}
        ) > (b.amount + COALESCE(b."rolloverAmount", 0))
  `;

  return {
    monthIncome:     monthData?.income   ?? 0,
    monthExpenses:   monthData?.expenses ?? 0,
    monthNet:        (monthData?.income ?? 0) - (monthData?.expenses ?? 0),
    budgetsOverLimit: budgetsOverLimit[0]?.count ?? 0,
  };
}

async function netWorthSummary(userId: string) {
  // Sum of all non-archived account balances:
  //   startingBalance + income - expenses - transfers_out + transfers_in
  type Row = { netWorth: number };
  const [row] = await db.$queryRaw<Row[]>`
    SELECT COALESCE(SUM(
      a."startingBalance"
      + COALESCE((SELECT SUM(CASE WHEN t.type='income'   THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId}), 0)
      - COALESCE((SELECT SUM(CASE WHEN t.type='expense'  THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId}), 0)
      - COALESCE((SELECT SUM(CASE WHEN t.type='transfer' THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId}), 0)
      + COALESCE((SELECT SUM(t2.amount) FROM "Transaction" t2 WHERE t2."transferToId"=a.id AND t2."userId"=${userId}), 0)
    ), 0)::float AS "netWorth"
    FROM "Account" a
    WHERE a."userId"=${userId} AND a."isArchived"=false
  `;
  return {
    netWorth:        row?.netWorth ?? 0,
    totalAssets:     row?.netWorth ?? 0,
    totalLiabilities: 0,
  };
}
