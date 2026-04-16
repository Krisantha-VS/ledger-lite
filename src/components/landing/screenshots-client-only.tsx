"use client";

import { useEffect, useState } from "react";
import { Screenshots } from "@/components/landing/screenshots";

export function ScreenshotsClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Screenshots />;
}

