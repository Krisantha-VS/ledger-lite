import { db } from "@/lib/db"
import { log } from "@/lib/logger"

const ROYALDA_MAIL_URL = "https://mail.royalda.com/api/v1/send"
const ROYALDA_MAIL_KEY = process.env.ROYALDA_MAIL_API_KEY!
const FROM = "noreply@royalda.com"

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(ROYALDA_MAIL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ROYALDA_MAIL_KEY}` },
    body: JSON.stringify({ to, subject, html, from: FROM }),
  })
  if (!res.ok) throw new Error(`Mail error: ${res.status}`)
}

// ── Logged send (for payment emails) ─────────────────────────────────────────

export async function sendMailLogged(params: {
  to: string
  userId: string
  subject: string
  html: string
  templateId: string
  traceId: string
}): Promise<void> {
  const { to, userId, subject, html, templateId, traceId } = params

  let royaldaMessageId: string | undefined

  try {
    const res = await fetch(ROYALDA_MAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ROYALDA_MAIL_KEY}` },
      body: JSON.stringify({ to, subject, html, from: FROM }),
    })

    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      royaldaMessageId = data?.data?.id ?? data?.id
    } else {
      throw new Error(`Mail error: ${res.status}`)
    }

    await db.emailLog.create({
      data: { traceId, userId, to, templateId, royaldaMessageId: royaldaMessageId ?? null },
    })

    log("info", "email.sent", { to, templateId, traceId, userId })
  } catch (err) {
    log("error", "email.failed", { to, templateId, traceId, userId, error: String(err) })

    await db.emailLog.create({
      data: {
        traceId, userId, to, templateId,
        failedAt: new Date(),
        failReason: String(err).slice(0, 300),
      },
    }).catch(() => {})
  }
}

// ── Receipt number ────────────────────────────────────────────────────────────

export async function nextReceiptNumber(): Promise<string> {
  const updated = await db.foundingCounter.upsert({
    where: { id: 2 }, // id=1 is for founding member counter; id=2 is receipt counter
    update: { count: { increment: 1 } },
    create: { id: 2, count: 1 },
  })
  const year = new Date().getFullYear()
  return `LDR-${year}-${String(updated.count).padStart(6, "0")}`
}
