import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const CreateSchema = z.object({
  accountId:    z.number().int().positive(),
  categoryId:   z.number().int().positive(),
  type:         z.enum(["income","expense","transfer"]),
  amount:       z.number().positive(),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note:         z.string().max(300).nullable().optional(),
  isRecurring:  z.boolean().default(false),
  recurrence:   z.enum(["weekly","monthly"]).nullable().optional(),
  transferToId: z.number().int().positive().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const url    = new URL(req.url);
    const p      = url.searchParams;

    // Lazy-create overdue recurring transactions (idempotent)
    await processRecurring(userId);

    const where: Prisma.TransactionWhereInput = { userId, deletedAt: null };
    if (p.get("accountId"))  where.accountId  = parseInt(p.get("accountId")!);
    if (p.get("categoryId")) where.categoryId = parseInt(p.get("categoryId")!);
    if (p.get("type") && ["income","expense","transfer"].includes(p.get("type")!))
      where.type = p.get("type") as "income" | "expense" | "transfer";
    if (p.get("dateFrom") || p.get("dateTo")) {
      where.date = {};
      if (p.get("dateFrom")) where.date.gte = new Date(p.get("dateFrom")!);
      if (p.get("dateTo"))   where.date.lte = new Date(p.get("dateTo")!);
    }

    const page    = Math.max(1, parseInt(p.get("page") ?? "1"));
    const perPage = Math.min(100, Math.max(1, parseInt(p.get("perPage") ?? "20")));

    const [rows, total] = await Promise.all([
      db.transaction.findMany({
        where, skip: (page - 1) * perPage, take: perPage,
        orderBy: [{ date: "desc" }, { id: "desc" }],
        include: {
          category: { select: { name: true, icon: true, colour: true } },
          account:  { select: { name: true } },
        },
      }),
      db.transaction.count({ where }),
    ]);

    return ok({ rows, total, page, perPage });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = CreateSchema.parse(await req.json());

    // IDOR: verify ownership
    const account = await db.account.findFirst({ where: { id: body.accountId, userId, isArchived: false } });
    if (!account) return fail("Account not found", 404);
    const category = await db.category.findFirst({ where: { id: body.categoryId, userId } });
    if (!category) return fail("Category not found", 404);

    if (body.type === "transfer") {
      if (!body.transferToId) return fail("transferToId required for transfers", 400);
      if (body.transferToId === body.accountId) return fail("Source and destination must differ", 400);
      const dest = await db.account.findFirst({ where: { id: body.transferToId, userId, isArchived: false } });
      if (!dest) return fail("Destination account not found", 404);
    }

    const dateObj = new Date(body.date + "T00:00:00Z");
    let nextDue: Date | null = null;
    if (body.isRecurring && body.recurrence) {
      nextDue = advanceDate(dateObj, body.recurrence);
    }

    const tx = await db.transaction.create({
      data: {
        userId, accountId: body.accountId, categoryId: body.categoryId,
        type: body.type, amount: body.amount, date: dateObj,
        note: body.note ?? null, isRecurring: body.isRecurring,
        recurrence: body.recurrence ?? null,
        nextDue, transferToId: body.transferToId ?? null,
      },
      include: {
        category: { select: { name: true, icon: true, colour: true } },
        account:  { select: { name: true } },
      },
    });

    return ok(tx, 201);
  } catch (e) { return handleError(e); }
}

// ─── helpers ─────────────────────────────────────────────

function advanceDate(from: Date, recurrence: "weekly" | "monthly"): Date {
  const d = new Date(from);
  recurrence === "weekly" ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1);
  return d;
}

async function processRecurring(userId: string) {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);

  const due = await db.transaction.findMany({
    where: { userId, isRecurring: true, nextDue: { lte: today } },
  });

  for (const row of due) {
    if (!row.nextDue) continue;
    const next = advanceDate(row.nextDue, row.recurrence as "weekly" | "monthly");

    // Atomic idempotency guard: only insert if we advance nextDue
    const affected = await db.transaction.updateMany({
      where: { id: row.id, nextDue: row.nextDue },
      data:  { nextDue: next },
    });
    if (affected.count === 0) continue;

    await db.transaction.create({
      data: {
        userId, accountId: row.accountId, categoryId: row.categoryId,
        type: row.type, amount: row.amount, date: row.nextDue,
        note: row.note, isRecurring: true,
        recurrence: row.recurrence, nextDue: next,
      },
    });
  }
}
