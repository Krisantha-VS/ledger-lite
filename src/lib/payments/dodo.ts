/**
 * Dodo Payments (dodopayments.com) Integration
 */

export const DODO_CONFIG = {
  productIdLiteMonthly: process.env.DODO_PRODUCT_LITE_MONTHLY || "",
  productIdLiteAnnual: process.env.DODO_PRODUCT_LITE_ANNUAL || "",
  productIdProMonthly: process.env.DODO_PRODUCT_PRO_MONTHLY || "",
  productIdProAnnual: process.env.DODO_PRODUCT_PRO_ANNUAL || "",
  productIdProFounding: process.env.DODO_PRODUCT_PRO_FOUNDING || "", // $7/mo locked for life (founding offer)
};

export type DodoPlan = "lite" | "pro";
export type DodoBilling = "monthly" | "annual";

export function getDodoProductId(plan: DodoPlan, billing: DodoBilling, isFounding: boolean = false) {
  if (isFounding && plan === "pro" && billing === "annual") {
    return DODO_CONFIG.productIdProFounding;
  }
  
  if (plan === "lite") {
    return billing === "annual" ? DODO_CONFIG.productIdLiteAnnual : DODO_CONFIG.productIdLiteMonthly;
  }
  
  return billing === "annual" ? DODO_CONFIG.productIdProAnnual : DODO_CONFIG.productIdProMonthly;
}
