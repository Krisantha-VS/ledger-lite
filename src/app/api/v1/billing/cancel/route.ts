import { ok, fail, handleError, getUserId } from "@/lib/api"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"

const DODO_API_URL = "https://api.dodopayments.com"

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req)
    const sub = await db.subscription.findUnique({ where: { userId } })

    if (!sub || sub.plan === "free") return fail("No active subscription", 400)
    if (sub.cancelAtPeriodEnd)       return fail("Already scheduled for cancellation", 400)
    if (!sub.dodoSubscriptionId)     return fail("Subscription ID not found", 400)

    const apiKey = process.env.DODO_API_KEY
    if (!apiKey) {
      log("warn", "billing.cancel.no_api_key", { userId })
      return fail("Cancellation not configured", 503)
    }

    // Cancel at period end via Dodo API
    const res = await fetch(`${DODO_API_URL}/subscriptions/${sub.dodoSubscriptionId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancel_at_period_end: true }),
    })

    if (!res.ok) {
      const err = await res.text()
      log("error", "billing.cancel.dodo_error", { userId, status: res.status, err })
      return fail("Failed to cancel with payment provider", 502)
    }

    // Optimistically update DB — webhook will confirm
    await db.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    })

    log("info", "billing.cancel.scheduled", { userId, dodoSubId: sub.dodoSubscriptionId })
    return ok({ cancelAtPeriodEnd: true, currentPeriodEnd: sub.currentPeriodEnd })
  } catch (e) {
    return handleError(e)
  }
}
