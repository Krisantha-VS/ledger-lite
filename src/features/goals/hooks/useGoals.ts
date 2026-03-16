"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { Goal } from "@/shared/types";

export function useGoals() {
  const [goals, setGoals]   = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/v1/goals");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setGoals(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createGoal = useCallback(async (payload: {
    name: string; targetAmount: number; targetDate?: string | null;
    accountId?: number | null; colour?: string;
  }) => {
    const res  = await authFetch("/api/v1/goals", { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Goal;
  }, [load]);

  const updateGoal = useCallback(async (id: number, payload: Partial<Goal>) => {
    const res  = await authFetch(`/api/v1/goals/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Goal;
  }, [load]);

  const deleteGoal = useCallback(async (id: number) => {
    const res  = await authFetch(`/api/v1/goals/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  }, [load]);

  return { goals, loading, error, reload: load, createGoal, updateGoal, deleteGoal };
}
