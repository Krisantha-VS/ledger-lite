"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { authFetch } from "@/shared/lib/auth-client"

export interface BillingData {
  plan: "free" | "lite" | "pro"
  status: "active" | "past_due" | "canceled" | "cancelled" | string
  billing: "monthly" | "annual" | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  gracePeriodEndsAt: string | null
  inGracePeriod: boolean
}

export function useBilling() {
  return useQuery<BillingData>({
    queryKey: ["billing"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/billing")
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    staleTime: 60_000,
  })
}

export function useInvalidateBilling() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ["billing"] })
}

// Sets ll_pending_checkout cookie and navigates to dashboard checkout flow
export function startCheckout(plan: string, billing: string) {
  const data = { plan, billing, founding: false }
  document.cookie = `ll_pending_checkout=${encodeURIComponent(JSON.stringify(data))}; Path=/; Max-Age=1800; SameSite=Lax`
  window.location.href = "/dashboard?checkout=1"
}
