"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { Account } from "@/shared/types";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/v1/accounts");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAccounts(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAccount = useCallback(async (payload: {
    name: string; type: string; startingBalance: number; colour: string;
  }) => {
    const res  = await authFetch("/api/v1/accounts", { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Account;
  }, [load]);

  const updateAccount = useCallback(async (id: number, payload: Partial<Account>) => {
    const res  = await authFetch(`/api/v1/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
    return json.data as Account;
  }, [load]);

  const deleteAccount = useCallback(async (id: number) => {
    const res  = await authFetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    await load();
  }, [load]);

  return { accounts, loading, error, reload: load, createAccount, updateAccount, deleteAccount };
}
