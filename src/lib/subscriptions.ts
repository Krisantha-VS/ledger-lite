import { db } from "@/lib/db";
import { PlanType } from "@prisma/client";

/**
 * Ensures a user has a subscription record.
 * If new, starts a 14-day Pro trial.
 */
export async function getSubscription(userId: string) {
  let sub = await db.subscription.findUnique({
    where: { userId },
  });

  if (!sub) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    sub = await db.subscription.create({
      data: {
        userId,
        plan: "pro", // Default to Pro trial
        trialEndsAt,
      },
    });
  }

  return sub;
}

/**
 * Checks the current active plan, handling trial expiry.
 */
export async function checkPlan(userId: string): Promise<PlanType> {
  const sub = await getSubscription(userId);

  // If trial ended and no active Dodo subscription, downgrade to free
  if (
    sub.plan !== "free" &&
    sub.trialEndsAt &&
    sub.trialEndsAt < new Date() &&
    !sub.dodoSubscriptionId
  ) {
    await db.subscription.update({
      where: { userId },
      data: { plan: "free" },
    });
    return "free";
  }

  return sub.plan as PlanType;
}

/**
 * Returns true if the user can use the AI import feature.
 */
export async function canUseAI(userId: string): Promise<boolean> {
  const plan = await checkPlan(userId);
  return plan !== "free";
}
