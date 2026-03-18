import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId(req);

    await db.$transaction([
      // Transactions first (FK to account/category)
      db.transaction.deleteMany({ where: { userId } }),
      // Budgets (FK to category)
      db.budget.deleteMany({ where: { userId } }),
      // Goals (FK to account)
      db.goal.deleteMany({ where: { userId } }),
      // AuditLog entries
      db.auditLog.deleteMany({ where: { userId } }),
      // Non-system categories
      db.category.deleteMany({ where: { userId, isSystem: false } }),
      // Accounts
      db.account.deleteMany({ where: { userId } }),
      // Settings
      db.userSettings.deleteMany({ where: { userId } }),
    ]);

    return ok({ message: "All data deleted" });
  } catch (e) { return handleError(e); }
}
