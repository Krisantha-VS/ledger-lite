import { ok, handleError, getUserId } from "@/lib/api";
import { getSubscription, getEntitlements } from "@/lib/subscriptions";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const [sub, ent] = await Promise.all([getSubscription(userId), getEntitlements(userId)]);

    return ok({
      plan: ent.plan,
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
