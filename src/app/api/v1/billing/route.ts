import { ok, handleError, getUserId } from "@/lib/api";
import { getSubscription } from "@/lib/subscriptions";

/**
 * GET /api/v1/billing
 * returns the user's current billing subscription status.
 */
export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const sub = await getSubscription(userId);

    return ok({
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      isTrial: sub.plan !== "free" && sub.trialEndsAt && sub.trialEndsAt > new Date(),
    });
  } catch (e) {
    return handleError(e);
  }
}
