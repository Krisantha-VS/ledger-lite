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
      billing: sub.billing,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      gracePeriodEndsAt: sub.gracePeriodEndsAt,
      inGracePeriod: sub.status === "past_due" && sub.gracePeriodEndsAt != null && sub.gracePeriodEndsAt > new Date(),
    });
  } catch (e) {
    return handleError(e);
  }
}
