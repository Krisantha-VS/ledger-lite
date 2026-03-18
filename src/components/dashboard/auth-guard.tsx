"use client";

import { useEffect, useState, useRef } from "react";
import { getAccessToken, refreshAccessToken } from "@/shared/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Hard redirect when refresh token expires mid-session.
    // Registered here so cleanup works correctly via useEffect return.
    const onExpired = () => window.location.replace("/login");
    window.addEventListener("auth:expired", onExpired);

    const check = async () => {
      if (!getAccessToken()) {
        // No access token — try a silent refresh before giving up.
        const refreshed = await refreshAccessToken();
        if (!mounted.current) return; // unmounted while awaiting — bail
        if (!refreshed) {
          window.location.replace("/login");
          return;
        }
      }
      if (mounted.current) setReady(true);
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
