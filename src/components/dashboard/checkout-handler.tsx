"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";

declare global {
  interface Window {
    DodoPayments?: {
      onCheckout: (config: any) => void;
    };
  }
}

// Dodo's "payment key" is expected to be a client-safe value.
// For Next.js, it must be exposed via `NEXT_PUBLIC_...` to reach the browser.
const DODO_PAYMENT_KEY =
  process.env.NEXT_PUBLIC_DODO_PAYMENT_KEY ??
  process.env.NEXT_PUBLIC_DODO_API_KEY ??
  "";

function CheckoutHandlerInner() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  useEffect(() => {
    if (checkout === "1") {
      const ensureDodoScript = async () => {
        // If another render already loaded it, just reuse.
        if (window.DodoPayments) return;

        const existing = document.getElementById("ll-dodo-checkout-script") as HTMLScriptElement | null;
        if (existing) {
          // Script tag exists; wait a bit for it to attach `window.DodoPayments`.
          await new Promise<void>(resolve => setTimeout(resolve, 500));
          return;
        }

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.id = "ll-dodo-checkout-script";
          script.src = "https://js.dodopayments.com/v1/checkout.js";
          script.async = true;

          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Dodo checkout.js"));

          document.body.appendChild(script);
        });
      };

      const run = async () => {
        try {
          await ensureDodoScript();

          const res = await authFetch("/api/v1/checkout");
          const json = await res.json();
          if (!json.success) throw new Error(json.error);

          const { productId, metadata, customer } = json.data;

          if (window.DodoPayments) {
            window.DodoPayments.onCheckout({
              productId,
              quantity: 1,
              metadata,
              customer,
              // Dodo checkout.js integrations commonly accept a client-side payment key.
              // If your dashboard expects a different field name, we can adjust quickly.
              ...(DODO_PAYMENT_KEY
                ? {
                    paymentKey: DODO_PAYMENT_KEY,
                    // Common alternates some integrations look for.
                    bearerToken: DODO_PAYMENT_KEY,
                    apiKey: DODO_PAYMENT_KEY,
                    licenseKey: DODO_PAYMENT_KEY,
                  }
                : {}),
            });
          } else {
            toast.error("Payment system is not ready. Please try again in a moment.");
          }
        } catch (err) {
          console.error("[checkout]", err);
          toast.error("Could not start checkout. Please try again from settings.");
        }
      };
      run();
    }
  }, [checkout]);

  return null;
}

export function CheckoutHandler() {
  return (
    <Suspense fallback={null}>
      <CheckoutHandlerInner />
    </Suspense>
  );
}
