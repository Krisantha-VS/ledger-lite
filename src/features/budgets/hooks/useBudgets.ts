"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { Budget } from "@/shared/types";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/v1/budgets");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setBudgets(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upsertBudget = useCallback(async (payload: { categoryId: number; amount: number }) => {
    const res  = await authFetch("/api/v1/budgets", { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Budget;
  }, [load]);

  const deleteBudget = useCallback(async (id: number) => {
    const res  = await authFetch(`/api/v1/budgets/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  }, [load]);

  return { budgets, loading, error, reload: load, upsertBudget, deleteBudget };
}
