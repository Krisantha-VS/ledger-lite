export type DodoPlan    = "lite" | "pro" | "credits"
export type DodoBilling = "monthly" | "annual" | "once"

export const DODO_BASE = process.env.DODO_MODE === "test"
  ? "https://test.dodopayments.com"
  : "https://live.dodopayments.com"

const IDS = {
  lite: {
    monthly: process.env.DODO_PRODUCT_LITE_MONTHLY ?? "",
    annual:  process.env.DODO_PRODUCT_LITE_ANNUAL  ?? "",
  },
  pro: {
    monthly:  process.env.DODO_PRODUCT_PRO_MONTHLY  ?? "",
    annual:   process.env.DODO_PRODUCT_PRO_ANNUAL   ?? "",
    founding: process.env.DODO_PRODUCT_PRO_FOUNDING ?? "",
  },
  credits: process.env.DODO_PRODUCT_AI_CREDITS ?? "",
}

// Keep for backwards compat with checkout/route.ts
export const DODO_CONFIG = {
  productIdLiteMonthly:  IDS.lite.monthly,
  productIdLiteAnnual:   IDS.lite.annual,
  productIdProMonthly:   IDS.pro.monthly,
  productIdProAnnual:    IDS.pro.annual,
  productIdProFounding:  IDS.pro.founding,
}

export function getDodoProductId(
  plan: DodoPlan,
  billing: DodoBilling,
  isFounding = false,
): string | null {
  if (plan === "credits") return IDS.credits || null
  if (plan === "pro" && billing === "annual" && isFounding) {
    const enabled = process.env.FOUNDING_MEMBER_ENABLED === "true"
    return enabled ? (IDS.pro.founding || IDS.pro.annual) : IDS.pro.annual
  }
  const id = plan === "lite"
    ? IDS.lite[billing as "monthly" | "annual"]
    : IDS.pro[billing as "monthly" | "annual"]
  return id || null
}

export function isCreditsProduct(productId: string): boolean {
  return !!IDS.credits && productId === IDS.credits
}

// Reverse-lookup: productId → plan + billing (used in webhook handler)
const PRODUCT_MAP: Record<string, { plan: DodoPlan; billing: DodoBilling }> = {}
if (IDS.lite.monthly)  PRODUCT_MAP[IDS.lite.monthly]  = { plan: "lite",    billing: "monthly" }
if (IDS.lite.annual)   PRODUCT_MAP[IDS.lite.annual]   = { plan: "lite",    billing: "annual"  }
if (IDS.pro.monthly)   PRODUCT_MAP[IDS.pro.monthly]   = { plan: "pro",     billing: "monthly" }
if (IDS.pro.annual)    PRODUCT_MAP[IDS.pro.annual]    = { plan: "pro",     billing: "annual"  }
if (IDS.pro.founding)  PRODUCT_MAP[IDS.pro.founding]  = { plan: "pro",     billing: "annual"  }
if (IDS.credits)       PRODUCT_MAP[IDS.credits]       = { plan: "credits", billing: "once"    }

export function planFromProductId(
  productId: string,
): { plan: DodoPlan; billing: DodoBilling } | null {
  return PRODUCT_MAP[productId] ?? null
}

export const BASE_PRODUCT_IDS = new Set(Object.keys(PRODUCT_MAP))
