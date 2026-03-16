"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { Account } from "@/shared/types";

const KEY = ["accounts"];

async function fetchAccounts(): Promise<Account[]> {
  const res  = await authFetch("/api/v1/accounts");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useAccounts() {
  const qc = useQueryClient();

  const { data: accounts = [], isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn: fetchAccounts,
  });

  const createAccount = useMutation({
    mutationFn: async (payload: { name: string; type: string; startingBalance: number; colour: string }) => {
      const res  = await authFetch("/api/v1/accounts", { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Account;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Account created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Account> }) => {
      const res  = await authFetch(`/api/v1/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Account;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Account updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: number) => {
      const res  = await authFetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Account deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    accounts,
    loading,
    error: error ? (error as Error).message : null,
    createAccount: (p: Parameters<typeof createAccount.mutateAsync>[0]) => createAccount.mutateAsync(p),
    updateAccount: (id: number, payload: Partial<Account>) => updateAccount.mutateAsync({ id, payload }),
    deleteAccount: (id: number) => deleteAccount.mutateAsync(id),
  };
}
