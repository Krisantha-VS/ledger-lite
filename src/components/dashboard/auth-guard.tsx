"use client";

import { useEffect } from "react";
import { getAccessToken } from "@/shared/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hard redirect if no token on mount
    if (!getAccessToken()) {
      window.location.replace("/login");
      return;
    }

    // Hard redirect when refresh token expires mid-session
    const onExpired = () => window.location.replace("/login");
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  if (typeof window !== "undefined" && !getAccessToken()) return null;
  return <>{children}</>;
}
