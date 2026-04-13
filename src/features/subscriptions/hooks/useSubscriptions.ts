"use client";

import { useQuery } from "@tanstack/react-query";
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
  return json.data;
}

export function useSubscriptions() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn:  fetchSubscriptions,
  });

  return {
    subscriptions: data?.subscriptions ?? [],
    totalMonthly:  data?.totalMonthly ?? 0,
    loading,
    error: error ? (error as Error).message : null,
  };
}
