import { ok, fail, handleError, getUserId } from "@/lib/api"
import { getDodoProductId, DodoPlan, DodoBilling } from "@/lib/payments/dodo"
import { getUserEmail } from "@/lib/auth"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req)
    const email  = await getUserEmail(req)

    const url      = new URL(req.url)
    const intentId = url.searchParams.get("intentId")

    if (!intentId) return fail("Missing intentId", 400)

    const intent = await db.checkoutIntent.findUnique({ where: { id: intentId } })

    if (!intent)                   return fail("Checkout intent not found", 404)
    if (intent.userId !== userId)  return fail("Checkout intent mismatch", 403)
    if (intent.consumed)           return fail("Checkout intent already used", 409)
    if (intent.expiresAt < new Date()) return fail("Checkout intent expired", 410)

    // Persist email so webhook can send receipts without a profile table
    if (email && !intent.email) {
      await db.checkoutIntent.update({ where: { id: intentId }, data: { email } })
    }

    const plan    = intent.plan    as DodoPlan
    const billing = intent.billing as DodoBilling

    // Founding eligibility check
    let founding = intent.founding
    if (founding) {
      const enabled = process.env.FOUNDING_MEMBER_ENABLED === "true"
      const max     = parseInt(process.env.FOUNDING_MEMBER_MAX ?? "100", 10)
      if (!enabled) {
        founding = false
      } else {
        const counter = await db.foundingCounter.findUnique({ where: { id: 1 } })
        if ((counter?.count ?? 0) >= max) founding = false
      }
    }

    const productId = getDodoProductId(plan, billing, founding)
    if (!productId) return fail("Invalid checkout configuration", 400)

    log("info", "checkout.resolved", { userId, plan, billing, founding, intentId, traceId: intent.traceId })

    return ok({
      productId,
      quantity: 1,
      customer: { email },
      metadata: {
        intentId,
        traceId: intent.traceId,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
