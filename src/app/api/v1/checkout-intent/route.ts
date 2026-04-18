import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ok, fail, handleError, getUserId } from "@/lib/api"
import { db } from "@/lib/db"
import { log } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req)
    const jar    = await cookies()
    const raw    = jar.get("ll_pending_checkout")?.value

    if (!raw) return ok({ intent: null })

    let parsed: { plan?: string; billing?: string; founding?: boolean; traceId?: string }
    try {
      parsed = JSON.parse(decodeURIComponent(raw))
    } catch {
      log("warn", "checkout_intent.bad_cookie", { userId })
      return ok({ intent: null })
    }

    const { plan, billing, founding = false, traceId = crypto.randomUUID() } = parsed

    if (!plan || !billing) return ok({ intent: null })

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min TTL

    const intent = await db.checkoutIntent.create({
      data: { userId, traceId, plan, billing, founding, expiresAt },
    })

    log("info", "checkout_intent.created", { intentId: intent.id, userId, plan, billing, founding, traceId })

    const res = NextResponse.json({ success: true, data: { intentId: intent.id, plan, billing, founding } })

    const isProduction = process.env.NODE_ENV === "production"
    res.headers.append("Set-Cookie", `ll_pending_checkout=; Path=/; Max-Age=0${isProduction ? "; Secure" : ""}`)

    return res
  } catch (e) {
    return handleError(e)
  }
}
