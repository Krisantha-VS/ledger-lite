import { ok, fail, handleError, getUserId } from "@/lib/api"
import { getDodoProductId, DodoPlan, DodoBilling } from "@/lib/payments/dodo"
import { getUserEmail } from "@/lib/auth"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"

const DODO_BASE = process.env.DODO_MODE === "test"
  ? "https://test.dodopayments.com"
  : "https://live.dodopayments.com"

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req)
    const email  = await getUserEmail(req)

    const url      = new URL(req.url)
    const intentId = url.searchParams.get("intentId")

    if (!intentId) return fail("Missing intentId", 400)

    const intent = await db.checkoutIntent.findUnique({ where: { id: intentId } })

    if (!intent)                        return fail("Checkout intent not found", 404)
    if (intent.userId !== userId)       return fail("Checkout intent mismatch", 403)
    if (intent.consumed)                return fail("Checkout intent already used", 409)
    if (intent.expiresAt < new Date())  return fail("Checkout intent expired", 410)

    // Persist email for receipt emails
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
    if (!productId) return fail("Invalid checkout configuration — product ID missing", 400)

    const apiKey = process.env.DODO_API_KEY
    if (!apiKey) return fail("Checkout not configured — DODO_API_KEY missing", 503)

    // Create a Dodo checkout session server-side (8s timeout — under Vercel 10s limit)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    let sessionRes: Response
    try {
      sessionRes = await fetch(`${DODO_BASE}/checkouts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_cart: [{ product_id: productId, quantity: 1 }],
          customer:     { email },
          metadata:     { intentId, traceId: intent.traceId },
        }),
        signal: controller.signal,
      })
    } catch (fetchErr: any) {
      clearTimeout(timer)
      const msg = fetchErr?.name === "AbortError" ? "Dodo API timed out" : `Dodo fetch failed: ${fetchErr?.message}`
      log("error", "checkout.fetch_failed", { userId, msg })
      return fail(msg, 502)
    }
    clearTimeout(timer)

    const rawBody = await sessionRes.text()
    if (!sessionRes.ok) {
      log("error", "checkout.session_failed", { userId, status: sessionRes.status, body: rawBody.slice(0, 300) })
      return fail(`Dodo error ${sessionRes.status}: ${rawBody.slice(0, 200)}`, 502)
    }

    let session: any
    try { session = JSON.parse(rawBody) } catch {
      log("error", "checkout.bad_json", { userId, rawBody: rawBody.slice(0, 300) })
      return fail("Dodo returned invalid JSON", 502)
    }

    const checkoutUrl = session.checkout_url ?? session.url ?? session.payment_url

    if (!checkoutUrl) {
      log("error", "checkout.no_url", { userId, session })
      return fail(`No checkout URL in Dodo response: ${JSON.stringify(session).slice(0, 200)}`, 502)
    }

    log("info", "checkout.session_created", { userId, plan, billing, founding, intentId })

    return ok({ checkoutUrl })
  } catch (e) {
    return handleError(e)
  }
}
