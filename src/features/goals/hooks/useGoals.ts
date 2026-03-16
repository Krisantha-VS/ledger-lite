"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { Goal } from "@/shared/types";

const KEY = ["goals"];

async function fetchGoals(): Promise<Goal[]> {
  const res  = await authFetch("/api/v1/goals");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useGoals() {
  const qc = useQueryClient();

  const { data: goals = [], isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn: fetchGoals,
  });

  const createGoal = useMutation({
    mutationFn: async (payload: {
      name: string; targetAmount: number; targetDate?: string | null;
      accountId?: number | null; colour?: string;
    }) => {
      const res  = await authFetch("/api/v1/goals", { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Goal;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Goal created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Goal> }) => {
      const res  = await authFetch(`/api/v1/goals/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Goal;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Goal updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => {
      const res  = await authFetch(`/api/v1/goals/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Goal deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    goals,
    loading,
    error: error ? (error as Error).message : null,
    createGoal: (p: Parameters<typeof createGoal.mutateAsync>[0]) => createGoal.mutateAsync(p),
    updateGoal: (id: number, payload: Partial<Goal>) => updateGoal.mutateAsync({ id, payload }),
    deleteGoal: (id: number) => deleteGoal.mutateAsync(id),
  };
}
