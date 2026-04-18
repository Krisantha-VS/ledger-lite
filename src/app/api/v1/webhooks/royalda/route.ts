import { db } from "@/lib/db"
import { log } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Royalda Mail sends events with: { type, messageId, ... }
    const { type, messageId } = body

    if (!messageId) return new Response("OK", { status: 200 })

    if (type === "delivery" || type === "delivered") {
      await db.emailLog.updateMany({
        where: { royaldaMessageId: messageId },
        data: { deliveredAt: new Date() },
      })
    } else if (type === "bounce" || type === "bounced") {
      await db.emailLog.updateMany({
        where: { royaldaMessageId: messageId },
        data: {
          bouncedAt: new Date(),
          failReason: body.reason?.slice(0, 300) ?? "bounced",
        },
      })
    }

    log("info", "royalda_webhook.processed", { type, messageId })
    return new Response("OK", { status: 200 })
  } catch (err) {
    log("error", "royalda_webhook.error", { error: String(err) })
    return new Response("Error", { status: 500 })
  }
}
