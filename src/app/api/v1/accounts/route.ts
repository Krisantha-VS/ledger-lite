import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const CreateSchema = z.object({
  name:            z.string().min(1).max(100),
  type:            z.enum(["checking","savings","cash","credit","investment"]).default("checking"),
  currency:        z.string().length(3).default("USD"),
  startingBalance: z.number().default(0),
  colour:          z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const accounts = await getAccountsWithBalance(userId);
    return ok(accounts);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = CreateSchema.parse(await req.json());

    const account = await db.account.create({ data: { userId, ...body } });

    // Seed system categories on first account
    const existing = await db.category.count({ where: { userId } });
    if (existing === 0) {
      await db.category.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId })),
        skipDuplicates: true,
      });
    }

    const [withBalance] = await getAccountsWithBalance(userId, account.id);
    return ok(withBalance, 201);
  } catch (e) { return handleError(e); }
}

// ─── helpers ─────────────────────────────────────────────

export async function getAccountsWithBalance(userId: string, id?: number) {
  type Row = {
    id: number; userId: string; name: string; type: string;
    currency: string; startingBalance: number; colour: string;
    isArchived: boolean; createdAt: Date; balance: number;
  };

  const idFilter = id !== undefined ? Prisma.sql`AND a.id = ${id}` : Prisma.empty;

  const rows = await db.$queryRaw<Row[]>`
    SELECT a.*,
      (a."startingBalance"
       + COALESCE(SUM(CASE WHEN t.type = 'income'   THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense'  THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' THEN t.amount ELSE 0 END), 0)
       + COALESCE((
           SELECT SUM(t2.amount) FROM "Transaction" t2
           WHERE t2."transferToId" = a.id AND t2."userId" = ${userId}
         ), 0)
      )::float AS balance
    FROM "Account" a
    LEFT JOIN "Transaction" t ON t."accountId" = a.id
    WHERE a."userId" = ${userId}
      AND a."isArchived" = false
      ${idFilter}
    GROUP BY a.id
    ORDER BY a."createdAt" ASC
  `;

  return rows;
}
