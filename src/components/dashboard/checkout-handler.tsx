"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authFetch } from "@/shared/lib/auth-client"
import { DodoPayments } from "dodopayments-checkout"

const DODO_MODE = (process.env.NEXT_PUBLIC_DODO_MODE ?? "live") as "test" | "live"

function CheckoutHandlerInner() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get("checkout")

  useEffect(() => {
    if (checkout !== "1") return

    const run = async () => {
      try {
        // Step 1: exchange cookie for intentId
        const intentRes  = await authFetch("/api/v1/checkout-intent")
        const intentJson = await intentRes.json()
        if (!intentJson.success || !intentJson.data?.intentId) {
          if (!intentJson.success) toast.error("Could not start checkout. Please try again.")
          return
        }

        const { intentId } = intentJson.data

        // Step 2: create Dodo checkout session → get checkoutUrl
        const res  = await authFetch(`/api/v1/checkout?intentId=${intentId}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? "Checkout session failed")

        const { checkoutUrl } = json.data
        if (!checkoutUrl) throw new Error("No checkout URL received")

        DodoPayments.Initialize({
          mode:        DODO_MODE,
          displayType: "overlay",
          onEvent: (e) => {
            if (e?.event_type === "checkout.redirect") {
              window.location.href = "/dashboard"
            }
            if (e?.event_type === "checkout.error") {
              toast.error("Payment error. Please try again.")
            }
          },
        })

        DodoPayments.Checkout.open({ checkoutUrl })
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
