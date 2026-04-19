"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authFetch } from "@/shared/lib/auth-client"

declare global {
  interface Window {
    DodoPayments?: {
      Initialize: (config: { mode: string; displayType: string; onEvent?: (e: any) => void }) => void
      Checkout: {
        open: (config: { checkoutUrl: string; redirectUrl?: string }) => void
      }
    }
  }
}

const DODO_MODE = process.env.NEXT_PUBLIC_DODO_MODE ?? "live"
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL   ?? ""

function CheckoutHandlerInner() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get("checkout")

  useEffect(() => {
    if (checkout !== "1") return

    const ensureDodoScript = async () => {
      if (window.DodoPayments) return
      const existing = document.getElementById("ll-dodo-checkout-script")
      if (existing) {
        // Script already loading — wait for DodoPayments to appear
        await new Promise<void>((resolve, reject) => {
          let attempts = 0
          const interval = setInterval(() => {
            if (window.DodoPayments) { clearInterval(interval); resolve() }
            if (++attempts > 20)    { clearInterval(interval); reject(new Error("Dodo SDK timed out")) }
          }, 250)
        })
        return
      }
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.id    = "ll-dodo-checkout-script"
        script.src   = "https://cdn.jsdelivr.net/npm/dodopayments-checkout@latest/dist/index.js"
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load Dodo checkout SDK"))
        document.body.appendChild(script)
      })
    }

    const run = async () => {
      try {
        // Step 1: exchange cookie for intentId
        const intentRes  = await authFetch("/api/v1/checkout-intent")
        const intentJson = await intentRes.json()
        if (!intentJson.success || !intentJson.data?.intentId) return

        const { intentId } = intentJson.data

        await ensureDodoScript()

        // Step 2: create Dodo checkout session → get checkoutUrl
        const res  = await authFetch(`/api/v1/checkout?intentId=${intentId}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? "Checkout session failed")

        const { checkoutUrl } = json.data
        if (!checkoutUrl) throw new Error("No checkout URL received")

        if (!window.DodoPayments) throw new Error("Dodo SDK not ready")

        window.DodoPayments.Initialize({
          mode:        DODO_MODE,
          displayType: "overlay",
          onEvent: (e: any) => {
            if (e?.type === "checkout.error") {
              toast.error("Payment error. Please try again.")
            }
          },
        })

        window.DodoPayments.Checkout.open({
          checkoutUrl,
          redirectUrl: `${APP_URL}/dashboard`,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[checkout]", msg)
        toast.error(`Checkout error: ${msg}`)
      }
    }

    run()
  }, [checkout])

  return null
}

export function CheckoutHandler() {
  return (
    <Suspense fallback={null}>
      <CheckoutHandlerInner />
    </Suspense>
  )
}
