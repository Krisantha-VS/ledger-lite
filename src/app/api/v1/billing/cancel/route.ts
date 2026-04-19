import { ok, fail, handleError, getUserId } from "@/lib/api"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"

const DODO_API_URL = "https://api.dodopayments.com"

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req)
    const body   = await req.json().catch(() => ({}))
    const immediately: boolean = body.immediately === true

    const sub = await db.subscription.findUnique({ where: { userId } })

    if (!sub || sub.plan === "free") return fail("No active subscription", 400)
    if (!immediately && sub.cancelAtPeriodEnd) return fail("Already scheduled for cancellation", 400)
    if (!sub.dodoSubscriptionId)     return fail("Subscription ID not found", 400)

    const apiKey = process.env.DODO_API_KEY
    if (!apiKey) {
      log("warn", "billing.cancel.no_api_key", { userId })
      return fail("Cancellation not configured — DODO_API_KEY missing", 503)
    }

    if (immediately) {
      // Cancel immediately: set status to cancelled in Dodo
      const res = await fetch(`${DODO_API_URL}/subscriptions/${sub.dodoSubscriptionId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) {
        const err = await res.text()
        log("error", "billing.cancel_now.dodo_error", { userId, status: res.status, err })
        return fail("Failed to cancel with payment provider", 502)
      }
      await db.subscription.update({
        where: { userId },
        data: { plan: "free", status: "active", cancelAtPeriodEnd: false, gracePeriodEndsAt: null, currentPeriodEnd: null },
      })
      log("info", "billing.cancel_now.done", { userId, dodoSubId: sub.dodoSubscriptionId })
      return ok({ cancelled: true, immediately: true })
    } else {
      // Cancel at period end
      const res = await fetch(`${DODO_API_URL}/subscriptions/${sub.dodoSubscriptionId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_period_end: true }),
      })
      if (!res.ok) {
        const err = await res.text()
        log("error", "billing.cancel.dodo_error", { userId, status: res.status, err })
        return fail("Failed to cancel with payment provider", 502)
      }
      await db.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      })
      log("info", "billing.cancel.scheduled", { userId, dodoSubId: sub.dodoSubscriptionId })
      return ok({ cancelAtPeriodEnd: true, currentPeriodEnd: sub.currentPeriodEnd })
    }
  } catch (e) {
    return handleError(e)
  }
}
