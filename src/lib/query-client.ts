"use client";

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Never retry auth errors — retrying a 401 fires multiple token
      // refreshes which triggers AuthSaas TOKEN_REUSE protection and
      // deletes all sessions, kicking the user out.
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.toLowerCase().includes("unauthorized")) return false;
        return failureCount < 1;
      },
    },
  },
});
