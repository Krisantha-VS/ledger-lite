import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const RowSchema = z.object({
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  description:  z.string().max(300),
  amount:       z.number().positive("amount must be positive"),
  type:         z.enum(["income", "expense"]),
  categoryName: z.string().max(100).optional(),
});

const ImportSchema = z.object({
  transactions: z.array(RowSchema).min(1).max(500),
  accountId:    z.number().int().positive(),
  categoryId:   z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = ImportSchema.parse(await req.json());

    // IDOR: verify account belongs to user
    const account = await db.account.findFirst({
      where: { id: body.accountId, userId, isArchived: false },
    });
    if (!account) return fail("Account not found", 404);

    // If categoryId provided, verify ownership
    if (body.categoryId !== undefined) {
      const cat = await db.category.findFirst({ where: { id: body.categoryId, userId } });
      if (!cat) return fail("Category not found", 404);
    }

    // Determine fallback category
    let fallbackCategoryId = body.categoryId;
    if (fallbackCategoryId === undefined) {
      const cat = await db.category.findFirst({
        where: { userId },
        orderBy: { id: "asc" },
      });
      if (!cat) return fail("No categories found. Please create a category first.", 400);
      fallbackCategoryId = cat.id;
    }

    // Resolve per-row categoryNames (Mint import)
    const uniqueNames = [
      ...new Set(body.transactions.map((r) => r.categoryName).filter(Boolean)),
    ] as string[];

    const catNameToId = new Map<string, number>();

    if (uniqueNames.length > 0) {
      // Load all user categories once
      const existing = await db.category.findMany({ where: { userId } });
      for (const c of existing) catNameToId.set(c.name.toLowerCase(), c.id);

      // Create any missing categories
      for (const name of uniqueNames) {
        if (!catNameToId.has(name.toLowerCase())) {
          const created = await db.category.create({
            data: { userId, name, icon: "🏷️", colour: "#6366f1", type: "expense" },
          });
          catNameToId.set(name.toLowerCase(), created.id);
        }
      }
    }

    const data = body.transactions.map((row) => {
      let categoryId = fallbackCategoryId!;
      if (row.categoryName) {
        categoryId = catNameToId.get(row.categoryName.toLowerCase()) ?? fallbackCategoryId!;
      }
      return {
        userId,
        accountId:    body.accountId,
        categoryId,
        type:         row.type as "income" | "expense",
        amount:       row.amount,
        date:         new Date(row.date + "T00:00:00Z"),
        note:         row.description.slice(0, 300) || null,
        isRecurring:  false,
        recurrence:   null,
        nextDue:      null,
        transferToId: null,
      };
    });

    const result = await db.transaction.createMany({ data });

    return ok({ imported: result.count, skipped: body.transactions.length - result.count }, 201);
  } catch (e) { return handleError(e); }
}
