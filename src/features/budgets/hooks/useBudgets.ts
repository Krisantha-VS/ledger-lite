"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { Budget } from "@/shared/types";

const KEY = ["budgets"];

async function fetchBudgets(): Promise<Budget[]> {
  const res  = await authFetch("/api/v1/budgets");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useBudgets() {
  const qc = useQueryClient();

  const { data: budgets = [], isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn: fetchBudgets,
  });

  const upsertBudget = useMutation({
    mutationFn: async (payload: { categoryId: number; amount: number; rollover?: boolean }) => {
      const res  = await authFetch("/api/v1/budgets", { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Budget;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Budget saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: number) => {
      const res  = await authFetch(`/api/v1/budgets/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Budget deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    budgets,
    loading,
    error: error ? (error as Error).message : null,
    upsertBudget: (p: { categoryId: number; amount: number; rollover?: boolean }) => upsertBudget.mutateAsync(p),
    deleteBudget: (id: number) => deleteBudget.mutateAsync(id),
  };
}
