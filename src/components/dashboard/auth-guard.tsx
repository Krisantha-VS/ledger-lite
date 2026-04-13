"use client";

import { useEffect, useState, useRef } from "react";
import { getAccessToken, refreshAccessToken, storeTokens, consumeInitToken } from "@/shared/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const onExpired = () => window.location.replace("/login");
    window.addEventListener("auth:expired", onExpired);

    const check = async () => {
      // 1. Already have a token in sessionStorage
      if (getAccessToken()) {
        if (mounted.current) setReady(true);
        return;
      }
      // 2. Consume _at_init cookie set by OAuth callback
      const initTok = consumeInitToken();
      if (initTok) {
        storeTokens(initTok);
        if (mounted.current) setReady(true);
        return;
      }
      // 3. Silent refresh via httpOnly cookie
      const refreshed = await refreshAccessToken();
      if (!mounted.current) return;
      if (!refreshed) {
        window.location.replace("/login");
        return;
      }
      setReady(true);
    };

    check();

    return () => {
      mounted.current = false;
      window.removeEventListener("auth:expired", onExpired);
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
