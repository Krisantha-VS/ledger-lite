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

function CheckoutHandlerInner() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");

  useEffect(() => {
    if (checkout === "1") {
      const run = async () => {
        try {
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
            });
          } else {
            // If script not loaded yet, wait a bit
            setTimeout(() => {
              if (window.DodoPayments) {
                window.DodoPayments.onCheckout({
                  productId,
                  quantity: 1,
                  metadata,
                  customer,
                });
              } else {
                toast.error("Payment system is still loading. Please try again in a moment.");
              }
            }, 1000);
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
