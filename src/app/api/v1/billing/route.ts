import { ok, handleError, getUserId } from "@/lib/api";
import { getSubscription, getEntitlements } from "@/lib/subscriptions";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const [sub, ent] = await Promise.all([getSubscription(userId), getEntitlements(userId)]);

    const [accountCount, goalCount] = await Promise.all([
      db.account.count({ where: { userId, isArchived: false } }),
      db.goal.count({ where: { userId } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Reset aiImportCount if it's a new month (read-only check for display)
    const aiUsed = (sub.aiImportResetAt && sub.aiImportResetAt >= monthStart)
      ? (sub.aiImportCount ?? 0)
      : 0;
    const aiLimit = ent.aiImportsPerMonth === Infinity ? null : ent.aiImportsPerMonth;

    return ok({
      plan: ent.plan,
      status: sub.status,
      billing: sub.billing,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      gracePeriodEndsAt: sub.gracePeriodEndsAt,
      inGracePeriod: sub.status === "past_due" && sub.gracePeriodEndsAt != null && sub.gracePeriodEndsAt > now,
      // Entitlement usage
      aiImportsUsed: aiUsed,
      aiImportsLimit: aiLimit,
      aiImportsRemaining: aiLimit === null ? null : Math.max(0, aiLimit - aiUsed),
      aiImportCredits: sub.aiImportCredits ?? 0,
      maxAccounts: ent.maxAccounts === Infinity ? null : ent.maxAccounts,
      maxGoals: ent.maxGoals === Infinity ? null : ent.maxGoals,
      historyMonths: ent.historyMonths === Infinity ? null : ent.historyMonths,
      accountsUsed: accountCount,
      goalsUsed: goalCount,
    });
  } catch (e) {
    return handleError(e);
  }
}
