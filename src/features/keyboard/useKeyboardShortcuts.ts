"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ShortcutHandlers {
  onNewTransaction?: () => void;
  onNewAccount?:     () => void;
  onShowHelp?:       () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "n": // N = new transaction
          e.preventDefault();
          handlers.onNewTransaction?.();
          break;
        case "a": // A = new account
          e.preventDefault();
          handlers.onNewAccount?.();
          break;
        case "g": // G = go to goals
          e.preventDefault();
          router.push("/goals");
          break;
        case "r": // R = go to reports
          e.preventDefault();
          router.push("/reports");
          break;
        case "t": // T = go to transactions
          e.preventDefault();
          router.push("/transactions");
          break;
        case "s": // S = settings
          e.preventDefault();
          router.push("/settings");
          break;
        case "h": // H = go home
          e.preventDefault();
          router.push("/");
          break;
        case "?": // ? = keyboard help
          e.preventDefault();
          handlers.onShowHelp?.();
          break;
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [router, handlers]);
}
