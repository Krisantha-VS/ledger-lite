"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authFetch } from "@/shared/lib/auth-client"

declare global {
  interface Window {
    DodoPayments?: {
      onCheckout: (config: any) => void
    }
  }
}

const DODO_PAYMENT_KEY = process.env.NEXT_PUBLIC_DODO_PAYMENT_KEY ?? ""

function CheckoutHandlerInner() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get("checkout")

  useEffect(() => {
    if (checkout !== "1") return

    const ensureDodoScript = async () => {
      if (window.DodoPayments) return
      const existing = document.getElementById("ll-dodo-checkout-script")
      if (existing) {
        await new Promise<void>(resolve => setTimeout(resolve, 500))
        return
      }
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.id = "ll-dodo-checkout-script"
        script.src = "https://js.dodopayments.com/v1/checkout.js"
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load Dodo checkout.js"))
        document.body.appendChild(script)
      })
    }

    const run = async () => {
      try {
        // Step 1: consume the pending checkout cookie → get intentId
        const intentRes = await authFetch("/api/v1/checkout-intent")
        const intentJson = await intentRes.json()
        if (!intentJson.success || !intentJson.data?.intentId) return // no pending checkout

        const { intentId } = intentJson.data

        await ensureDodoScript()

        // Step 2: resolve productId from server using intentId
        const res = await authFetch(`/api/v1/checkout?intentId=${intentId}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)

        const { productId, metadata, customer } = json.data

        if (window.DodoPayments) {
          window.DodoPayments.onCheckout({
            productId,
            quantity: 1,
            metadata,
            customer,
            ...(DODO_PAYMENT_KEY ? { paymentKey: DODO_PAYMENT_KEY } : {}),
          })
        } else {
          toast.error("Payment system is not ready. Please try again in a moment.")
        }
      } catch (err) {
        console.error("[checkout]", err)
        toast.error("Could not start checkout. Please try again from settings.")
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
