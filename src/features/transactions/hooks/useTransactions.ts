"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { Transaction } from "@/shared/types";

interface Filters {
  page?:      number;
  perPage?:   number;
  accountId?: number;
  type?:      string;
  month?:     string;
}

async function fetchTransactions(filters: Filters): Promise<{ rows: Transaction[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page)      params.set("page",      String(filters.page));
  if (filters.perPage)   params.set("perPage",   String(filters.perPage));
  if (filters.accountId) params.set("accountId", String(filters.accountId));
  if (filters.type)      params.set("type",      filters.type);
  if (filters.month)     params.set("month",     filters.month);

  const res  = await authFetch(`/api/v1/transactions?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useTransactions(filters: Filters = {}) {
  const qc  = useQueryClient();
  const key = ["transactions", filters];

  const { data, isLoading: loading, error } = useQuery({
    queryKey: key,
    queryFn: () => fetchTransactions(filters),
  });

  const createTransaction = useMutation({
    mutationFn: async (payload: {
      accountId: number; categoryId: number; type: string;
      amount: number; date: string; note?: string;
      transferToId?: number; isRecurring?: boolean; recurrence?: string;
    }) => {
      const res  = await authFetch("/api/v1/transactions", { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Transaction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      toast.success("Transaction added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: Partial<{
        accountId: number; categoryId: number; type: string;
        amount: number; date: string; note?: string | null;
        isRecurring?: boolean; recurrence?: string | null; nextDue?: string | null;
      }>;
    }) => {
      const res  = await authFetch(`/api/v1/transactions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Transaction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      toast.success("Transaction updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => {
      const res  = await authFetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      toast.success("Transaction deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    transactions: data?.rows ?? [],
    total:        data?.total ?? 0,
    loading,
    error: error ? (error as Error).message : null,
    createTransaction: (p: Parameters<typeof createTransaction.mutateAsync>[0]) => createTransaction.mutateAsync(p),
    updateTransaction: (p: Parameters<typeof updateTransaction.mutateAsync>[0]) => updateTransaction.mutateAsync(p),
    deleteTransaction: (id: number) => deleteTransaction.mutateAsync(id),
  };
}
