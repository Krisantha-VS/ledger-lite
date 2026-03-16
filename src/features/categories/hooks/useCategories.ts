"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { Category } from "@/shared/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/v1/categories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCategories(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, loading, error, reload: load };
}
