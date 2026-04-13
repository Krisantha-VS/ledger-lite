"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/shared/lib/auth-client";

export interface Subscription {
  key:              string;
  description:      string;
  recurrence:       string;
  nextDue:          string | null;
  lastAmount:       number;
  monthlyEquivalent: number;
  occurrences:      number;
  categoryId:       number;
  accountId:        number;
  categoryName:     string;
  categoryIcon:     string;
  categoryColour:   string;
  lastTransactionId: number;
  // id alias for edit operations — maps to lastTransactionId
  id:               number;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
  totalMonthly:  number;
}

const KEY = ["subscriptions"];

async function fetchSubscriptions(): Promise<SubscriptionsResponse> {
  const res  = await authFetch("/api/v1/subscriptions");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  // Ensure every subscription has an id field
  const data = json.data as SubscriptionsResponse;
  data.subscriptions = data.subscriptions.map(s => ({
    ...s,
    id: s.id ?? s.lastTransactionId,
  }));
  return data;
}

interface UpdateSubscriptionPayload {
  id:         number;
  note:       string;
  amount:     number;
  recurrence: string;
  nextDue:    string;
}

export function useSubscriptions() {
  const qc = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn:  fetchSubscriptions,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, note, amount, recurrence, nextDue }: UpdateSubscriptionPayload) => {
      const res  = await authFetch(`/api/v1/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ note, amount, recurrence, nextDue }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const updateSubscription = (payload: UpdateSubscriptionPayload) => updateMutation.mutateAsync(payload);

  return {
    subscriptions:      data?.subscriptions ?? [],
    totalMonthly:       data?.totalMonthly ?? 0,
    loading,
    error:              error ? (error as Error).message : null,
    updateSubscription,
    isUpdating:         updateMutation.isPending,
  };
}
