import { db } from "@/lib/db"
import { planFromProductId } from "@/lib/payments/dodo"
import { log } from "@/lib/logger"
import { waitUntil } from "@vercel/functions"
import crypto from "crypto"
import {
  receiptEmail, paymentFailedEmail, subscriptionCancelledEmail, accessRestrictedEmail,
} from "@/infrastructure/email/templates"
import { sendMailLogged, nextReceiptNumber } from "@/infrastructure/email/mailer"

export const runtime = "nodejs"

// ── Signature verification ────────────────────────────────────────────────────
// Dodo signs: webhook-id + "." + webhook-timestamp + "." + rawBody
// Header: "webhook-signature" (raw hex, no prefix)
function verifySignature(
  rawBody: string,
  sig: string | null,
  webhookId: string | null,
  webhookTs: string | null,
): boolean {
  const secret = process.env.DODO_WEBHOOK_SECRET
  if (!secret) {
    log("warn", "webhook.no_secret", { note: "DODO_WEBHOOK_SECRET not set — skipping verification" })
    return true
  }
  if (!sig || !webhookId || !webhookTs) return false

  const signedContent = `${webhookId}.${webhookTs}.${rawBody}`
  const expected = crypto.createHmac("sha256", secret).update(signedContent).digest("hex")
  const expectedBuf = Buffer.from(expected)

  // Header may carry space-separated multiple sigs (e.g. key rotation)
  const candidates = sig.split(" ").map(s => s.replace(/^v1,/, ""))
  return candidates.some(candidate => {
    const buf = Buffer.from(candidate)
    if (buf.length !== expectedBuf.length) return false
    try { return crypto.timingSafeEqual(expectedBuf, buf) } catch { return false }
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sigHeader  = req.headers.get("webhook-signature")
  const webhookId  = req.headers.get("webhook-id")
  const webhookTs  = req.headers.get("webhook-timestamp")

  if (!verifySignature(rawBody, sigHeader, webhookId, webhookTs)) {
    log("error", "webhook.sig_invalid", { sigHeader: sigHeader?.slice(0, 20) })
    return new Response("Unauthorized", { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response("Bad JSON", { status: 400 })
  }

  const eventType: string = body.type ?? body.event ?? ""
  const data: any         = body.data ?? body
  const eventId: string   = body.id ?? body.delivery_id ?? body.event_id ?? `${eventType}-${Date.now()}`
  const payloadHash       = crypto.createHash("sha256").update(rawBody).digest("hex")
  const receivedAt        = new Date()

  // Idempotency check
  const existing = await db.paymentEvent.findUnique({ where: { eventId } })
  if (existing) {
    log("info", "webhook.duplicate", { eventId, eventType })
    return new Response("OK", { status: 200 })
  }

  // Resolve intentId from metadata → userId + email
  const intentId = data.metadata?.intentId ?? data.payment_link?.metadata?.intentId
  const traceId  = data.metadata?.traceId  ?? data.payment_link?.metadata?.traceId ?? crypto.randomUUID()

  let userId: string | null = null
  let intentEmail: string | null = null
  if (intentId) {
    const intent = await db.checkoutIntent.findUnique({ where: { id: intentId } })
    userId      = intent?.userId ?? null
    intentEmail = intent?.email  ?? null
  }

  // Resolve plan + billing from productId
  const productId       = data.product_id ?? data.subscription?.product_id
  const planInfo        = productId ? planFromProductId(productId) : null
  const resolvedPlan    = planInfo?.plan    ?? (data.metadata?.plan    ?? "lite")
  const resolvedBilling = planInfo?.billing ?? (data.metadata?.billing ?? "monthly")
  const dodoSubId       = data.subscription_id ?? data.id

  // Insert PaymentEvent (audit trail first)
  await db.paymentEvent.create({
    data: {
      traceId, eventId, eventType, provider: "dodo",
      userId, dodoSubId, receivedAt, payloadHash,
    },
  })

  if (!userId) {
    await db.paymentEvent.update({
      where: { eventId },
      data: { quarantined: true, processingError: "userId not resolved from intentId" },
    })
    log("warn", "webhook.quarantined", { eventId, eventType, intentId })
    return new Response("OK", { status: 200 })
  }

  // Per-subscription ordering guard
  const existingSub = await db.subscription.findFirst({
    where: { dodoSubscriptionId: dodoSubId },
  })
  const eventTimestamp = data.created_at ? new Date(data.created_at) : receivedAt
  const isOverride = eventType.includes("refund") || eventType.includes("chargeback") || eventType.includes("reversed")
  if (!isOverride && existingSub?.lastEventAt && existingSub.lastEventAt > eventTimestamp) {
    log("warn", "webhook.stale_event", { eventId, eventType, dodoSubId })
    await db.paymentEvent.update({ where: { eventId }, data: { processedAt: new Date() } })
    return new Response("OK", { status: 200 })
  }

  // State machine
  try {
    const currentPeriodEnd = data.current_period_end
      ? new Date(typeof data.current_period_end === "number"
          ? data.current_period_end * 1000
          : data.current_period_end)
      : null

    if (["subscription.activated", "subscription.renewed", "subscription.active"].includes(eventType)) {
      await db.subscription.upsert({
        where: { userId },
        update: {
          plan: resolvedPlan as any, status: "active", billing: resolvedBilling,
          dodoSubscriptionId: dodoSubId, currentPeriodEnd, cancelAtPeriodEnd: false,
          gracePeriodEndsAt: null, lastEventAt: eventTimestamp,
          ...(intentEmail ? { email: intentEmail } : {}),
        },
        create: {
          userId, plan: resolvedPlan as any, status: "active", billing: resolvedBilling,
          dodoSubscriptionId: dodoSubId, currentPeriodEnd, lastEventAt: eventTimestamp,
          ...(intentEmail ? { email: intentEmail } : {}),
        },
      })

      // Mark intent consumed + increment founding counter if applicable
      if (intentId) {
        const intent = await db.checkoutIntent.findUnique({ where: { id: intentId } })
        await db.checkoutIntent.update({ where: { id: intentId }, data: { consumed: true } })
        if (intent?.founding) {
          await db.foundingCounter.upsert({
            where: { id: 1 },
            update: { count: { increment: 1 } },
            create: { id: 1, count: 1 },
          })
        }
      }

      waitUntil(sendReceiptAsync({ userId, plan: resolvedPlan, billing: resolvedBilling, data, traceId, intentEmail }))

    } else if (eventType === "subscription.canceled") {
      await db.subscription.update({
        where: { userId },
        data: { status: "canceled", cancelAtPeriodEnd: true, lastEventAt: eventTimestamp },
      })
      waitUntil(sendCancelledAsync({ userId, currentPeriodEnd, traceId }))

    } else if (eventType === "subscription.failed" || eventType === "subscription.payment_failed") {
      const gracePeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.subscription.update({
        where: { userId },
        data: { status: "past_due", gracePeriodEndsAt, lastEventAt: eventTimestamp },
      })
      waitUntil(sendPaymentFailedAsync({ userId, traceId, day: 0 }))

    } else if (isOverride) {
      await db.subscription.update({
        where: { userId },
        data: { status: "canceled", cancelAtPeriodEnd: false, gracePeriodEndsAt: null, lastEventAt: eventTimestamp },
      })
    }

    await db.paymentEvent.update({ where: { eventId }, data: { processedAt: new Date(), userId } })
    log("info", "webhook.processed", { eventId, eventType, userId, dodoSubId })

  } catch (err) {
    await db.paymentEvent.update({
      where: { eventId },
      data: { processingError: String(err).slice(0, 500) },
    })
    log("error", "webhook.error", { eventId, eventType, error: String(err) })
  }

  return new Response("OK", { status: 200 })
}

// ── Async email helpers ───────────────────────────────────────────────────────

async function sendReceiptAsync(p: {
  userId: string; plan: string; billing: string;
  data: any; traceId: string; intentEmail: string | null
}) {
  try {
    const sub = await db.subscription.findUnique({ where: { userId: p.userId } })
    if (!sub) return

    const userEmail = p.intentEmail ?? p.data.customer?.email ?? p.data.billing?.email ?? sub.email ?? ""
    if (!userEmail) return

    const receiptNumber = await nextReceiptNumber()
    const now = new Date()
    const fmt = (d: Date | null) => d ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"

    const amount     = String(p.data.amount ?? p.data.total ?? "0.00")
    const tax        = String(p.data.tax ?? "0.00")
    const total      = String(p.data.total_amount ?? amount)
    const invoiceUrl = p.data.invoice_url ?? p.data.payment?.invoice_url ?? null

    const { subject, html } = receiptEmail({
      userName: p.data.customer?.name ?? "there",
      plan: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
      billingCadence: p.billing.charAt(0).toUpperCase() + p.billing.slice(1),
      receiptNumber,
      receiptDate: fmt(now),
      amount,
      taxAmount: tax,
      totalAmount: total,
      currency: p.data.currency ?? "USD",
      periodStart: fmt(now),
      periodEnd: fmt(sub.currentPeriodEnd),
      dodoSubId: sub.dodoSubscriptionId ?? "",
      invoiceUrl,
    })

    await sendMailLogged({ to: userEmail, userId: p.userId, subject, html, templateId: "receipt_activated", traceId: p.traceId })
  } catch (err) {
    log("error", "receipt.send_failed", { userId: p.userId, error: String(err) })
  }
}

async function sendCancelledAsync(p: { userId: string; currentPeriodEnd: Date | null; traceId: string }) {
  try {
    const sub = await db.subscription.findUnique({ where: { userId: p.userId } })
    const userEmail = sub?.email ?? ""
    if (!userEmail) return

    const fmt = (d: Date | null) => d ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "end of billing period"
    const { subject, html } = subscriptionCancelledEmail("there", fmt(p.currentPeriodEnd))
    await sendMailLogged({ to: userEmail, userId: p.userId, subject, html, templateId: "sub_canceled", traceId: p.traceId })
  } catch (err) {
    log("error", "cancel_email.failed", { userId: p.userId, error: String(err) })
  }
}

async function sendPaymentFailedAsync(p: { userId: string; traceId: string; day: 0 | 3 }) {
  try {
    const sub = await db.subscription.findUnique({ where: { userId: p.userId } })
    const userEmail = sub?.email ?? ""
    if (!userEmail) return

    const { subject, html } = paymentFailedEmail("there", p.day)
    await sendMailLogged({ to: userEmail, userId: p.userId, subject, html, templateId: `payment_failed_d${p.day}`, traceId: p.traceId })
  } catch (err) {
    log("error", "payment_failed_email.failed", { userId: p.userId, error: String(err) })
  }
}
