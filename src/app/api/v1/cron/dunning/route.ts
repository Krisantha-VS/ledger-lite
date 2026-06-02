import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"
import { paymentFailedEmail, accessRestrictedEmail } from "@/infrastructure/email/templates"
import { sendMailLogged } from "@/infrastructure/email/mailer"
import crypto from "crypto"

export const runtime = "nodejs"

export async function GET() {
  const now = new Date()
  let reminded = 0
  let downgraded = 0

  // Day-3 reminders: grace period ends 3–4 days from now
  const day3Window = {
    gt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    lt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
  }

  const toRemind = await db.subscription.findMany({
    where: { status: "past_due", gracePeriodEndsAt: day3Window },
  })

  for (const sub of toRemind) {
    const userEmail = sub.email ?? ""
    if (!userEmail) {
      log("warn", "dunning.no_email", { userId: sub.userId })
      reminded++
      continue
    }
    try {
      const { subject, html } = paymentFailedEmail("there", 3)
      await sendMailLogged({
        to: userEmail, userId: sub.userId, subject, html,
        templateId: "payment_failed_d3", traceId: crypto.randomUUID(),
      })
      reminded++
    } catch (err) {
      log("error", "dunning.d3_email_failed", { userId: sub.userId, error: String(err) })
    }
    log("info", "dunning.d3_reminder_sent", { userId: sub.userId })
  }

  // Expired grace: downgrade to free and send access restricted email
  const expired = await db.subscription.findMany({
    where: { status: "past_due", gracePeriodEndsAt: { lt: now } },
  })

  for (const sub of expired) {
    await db.subscription.update({
      where: { userId: sub.userId },
      data: { plan: "free", status: "active", gracePeriodEndsAt: null },
    })
    log("info", "dunning.downgraded", { userId: sub.userId })

    const userEmail = sub.email ?? ""
    if (!userEmail) {
      log("warn", "dunning.no_email", { userId: sub.userId })
      downgraded++
      continue
    }
    try {
      const { subject, html } = accessRestrictedEmail("there")
      await sendMailLogged({
        to: userEmail, userId: sub.userId, subject, html,
        templateId: "access_restricted", traceId: crypto.randomUUID(),
      })
    } catch (err) {
      log("error", "dunning.downgrade_email_failed", { userId: sub.userId, error: String(err) })
    }
    downgraded++
  }

  log("info", "dunning.complete", { reminded, downgraded })
  return NextResponse.json({ reminded, downgraded })
}
