"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { Transaction } from "@/shared/types";

interface Filters {
  page?:      number;
  perPage?:   number;
  accountId?: number;
  type?:      string;
  month?:     string;
}

export function useTransactions(filters: Filters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.page)      params.set("page", String(filters.page));
      if (filters.perPage)   params.set("perPage", String(filters.perPage));
      if (filters.accountId) params.set("accountId", String(filters.accountId));
      if (filters.type)      params.set("type", filters.type);
      if (filters.month)     params.set("month", filters.month);

      const res  = await authFetch(`/api/v1/transactions?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTransactions(json.data.rows);
      setTotal(json.data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.perPage, filters.accountId, filters.type, filters.month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const createTransaction = useCallback(async (payload: {
    accountId: number; categoryId: number; type: string;
    amount: number; date: string; note?: string;
    transferToId?: number; isRecurring?: boolean; recurrence?: string;
  }) => {
    const res  = await authFetch("/api/v1/transactions", { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Transaction;
  }, [load]);

  const deleteTransaction = useCallback(async (id: number) => {
    const res  = await authFetch(`/api/v1/transactions/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  }, [load]);

  return { transactions, total, loading, error, reload: load, createTransaction, deleteTransaction };
}
