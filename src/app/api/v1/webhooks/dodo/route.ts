import { db } from "@/lib/db";
import { PlanType } from "@prisma/client";

/**
 * POST /api/v1/webhooks/dodo
 * handles subscription events from Dodo Payments.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.event;
    const data = body.data;

    // TODO: Verify Dodo signature if DODO_WEBHOOK_SECRET is set

    const userId = data.metadata?.userId;
    if (!userId) {
      console.warn("[dodo/webhook] No userId in metadata", body);
      return new Response("No userId", { status: 200 }); // Still return 200 to avoid retries
    }

    if (event.startsWith("subscription.")) {
      const plan = (data.metadata?.plan as PlanType) || "lite";
      const subId = data.subscription_id;
      const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end * 1000) : null;

      let status = "active";
      if (event === "subscription.canceled") status = "canceled";
      if (event === "subscription.failed") status = "past_due";

      await db.subscription.upsert({
        where: { userId },
        update: {
          plan,
          status: status as any,
          dodoSubscriptionId: subId,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
        create: {
          userId,
          plan,
          status: status as any,
          dodoSubscriptionId: subId,
          currentPeriodEnd,
        },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[dodo/webhook] Error processing webhook", e);
    return new Response("Webhook Error", { status: 500 });
  }
}
