"use client";

import { useEffect, useState } from "react";
import { getAccessToken, refreshAccessToken } from "@/shared/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Start as "checking" to avoid a flash of content or premature redirect
  // before we know whether the session is valid.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!getAccessToken()) {
        // No token at all — try a silent refresh in case only the access
        // token was cleared but the refresh token is still valid.
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          window.location.replace("/login");
          return;
        }
      }
      setReady(true);

      // Hard redirect when refresh token expires mid-session
      const onExpired = () => window.location.replace("/login");
      window.addEventListener("auth:expired", onExpired);
      // Cleanup is handled when the component unmounts (user navigates away)
      return () => window.removeEventListener("auth:expired", onExpired);
    };

    check();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
