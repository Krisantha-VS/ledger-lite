import { ok, fail, handleError, getUserId } from "@/lib/api";
import { getDodoProductId, DodoPlan, DodoBilling } from "@/lib/payments/dodo";
import { getUserEmail } from "@/lib/auth";

/**
 * GET /api/v1/checkout
 * returns the productId and metadata for Dodo Payments checkout.
 */
export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const email  = await getUserEmail(req);

    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") as DodoPlan) || "lite";
    const billing = (url.searchParams.get("billing") as DodoBilling) || "annual";
    const isFounding = url.searchParams.get("founding") === "true";

    const productId = getDodoProductId(plan, billing, isFounding);

    if (!productId) {
      return fail("Invalid checkout configuration", 400);
    }

    return ok({
      productId,
      quantity: 1,
      customer: {
        email: email,
      },
      metadata: {
        userId: userId,
        plan,
        billing,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
