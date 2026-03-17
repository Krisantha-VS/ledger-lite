"use client";

import { useState } from "react";
import { useKeyboardShortcuts } from "@/features/keyboard/useKeyboardShortcuts";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);

  useKeyboardShortcuts({ onShowHelp: () => setHelpOpen(true) });

  return (
    <>
      {children}
      <KeyboardShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
