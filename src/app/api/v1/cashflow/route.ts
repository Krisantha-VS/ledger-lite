import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";

// ─── Cash flow projection ───────────────────────────────────────────────────
// Returns 90-day projected daily balance using:
//   1. Current net worth as baseline
//   2. Scheduled recurring transactions (nextDue)
//   3. Historical average daily net (last 90 days) as drift
//
// Response: { baseline, dailyDrift, points: [{day, date, balance}], marks: {d30, d60, d90} }

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const today  = new Date(); today.setUTCHours(0, 0, 0, 0);

    // ── 1. Current net worth ──────────────────────────────────────────────
    type NWRow = { netWorth: number };
    const [nwRow] = await db.$queryRaw<NWRow[]>`
      SELECT COALESCE(SUM(
        a."startingBalance"
        + COALESCE((SELECT SUM(CASE WHEN t.type='income'   THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId} AND t."deletedAt" IS NULL), 0)
        - COALESCE((SELECT SUM(CASE WHEN t.type='expense'  THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId} AND t."deletedAt" IS NULL), 0)
        - COALESCE((SELECT SUM(CASE WHEN t.type='transfer' THEN t.amount ELSE 0 END) FROM "Transaction" t WHERE t."accountId"=a.id AND t."userId"=${userId} AND t."deletedAt" IS NULL), 0)
        + COALESCE((SELECT SUM(t2.amount) FROM "Transaction" t2 WHERE t2."transferToId"=a.id AND t2."userId"=${userId} AND t2."deletedAt" IS NULL), 0)
      ), 0)::float AS "netWorth"
      FROM "Account" a
      WHERE a."userId"=${userId} AND a."isArchived"=false
    `;
    const baseline = nwRow?.netWorth ?? 0;

    // ── 2. Historical daily drift (last 90 days, excluding recurring) ─────
    const since90 = new Date(today); since90.setDate(since90.getDate() - 90);
    type DriftRow = { income: number; expenses: number };
    const [driftRow] = await db.$queryRaw<DriftRow[]>`
      SELECT
        COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END),0)::float AS income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0)::float AS expenses
      FROM "Transaction"
      WHERE "userId"=${userId}
        AND "deletedAt" IS NULL
        AND "isRecurring"=false
        AND date >= ${since90}
        AND date <  ${today}
    `;
    const histNet    = (driftRow?.income ?? 0) - (driftRow?.expenses ?? 0);
    const dailyDrift = histNet / 90;

    // ── 3. Scheduled recurring events in next 90 days ─────────────────────
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 90);

    const recurring = await db.transaction.findMany({
      where: {
        userId,
        isRecurring: true,
        deletedAt:   null,
        nextDue:     { lte: horizon },
      },
      select: { type: true, amount: true, nextDue: true, recurrence: true },
    });

    // Build a map of date-string → net delta from recurring events
    const recurringDeltas = new Map<string, number>();

    function addDelta(date: Date, delta: number) {
      const key = date.toISOString().slice(0, 10);
      recurringDeltas.set(key, (recurringDeltas.get(key) ?? 0) + delta);
    }

    function advanceDate(d: Date, rec: string): Date {
      const next = new Date(d);
      rec === "weekly" ? next.setDate(next.getDate() + 7) : next.setMonth(next.getMonth() + 1);
      return next;
    }

    for (const tx of recurring) {
      if (!tx.nextDue || !tx.recurrence) continue;
      let d = new Date(tx.nextDue); d.setUTCHours(0, 0, 0, 0);
      const sign = tx.type === "income" ? 1 : -1;
      const amt  = Number(tx.amount);
      while (d <= horizon) {
        addDelta(d, sign * amt);
        d = advanceDate(d, tx.recurrence);
      }
    }

    // ── 4. Build 90-day projection ────────────────────────────────────────
    type Point = { day: number; date: string; balance: number };
    const points: Point[] = [];
    let balance = baseline;

    for (let i = 1; i <= 90; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      balance += dailyDrift + (recurringDeltas.get(key) ?? 0);
      points.push({ day: i, date: key, balance: Math.round(balance * 100) / 100 });
    }

    const marks = {
      d30: points[29].balance,
      d60: points[59].balance,
      d90: points[89].balance,
    };

    return ok({ baseline, dailyDrift: Math.round(dailyDrift * 100) / 100, points, marks });
  } catch (e) { return handleError(e); }
}
