"use client";

import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/shared/lib/auth-client";
import type { MonthlySummary, CategoryBreakdown } from "@/shared/types";

export interface DashboardSummary {
  monthIncome:      number;
  monthExpenses:    number;
  monthNet:         number;
  budgetsOverLimit: number;
}

async function fetchSummary(type: string, extra = "") {
  const res  = await authFetch(`/api/v1/summary?type=${type}${extra}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useDashboardSummary() {
  const { data: summary = null, isLoading: loading } = useQuery<DashboardSummary>({
    queryKey: ["summary", "dashboard"],
    queryFn: () => fetchSummary("dashboard"),
  });
  return { summary, loading };
}

export function useMonthlySummary(months = 12) {
  const { data: rows = [], isLoading: loading } = useQuery<MonthlySummary[]>({
    queryKey: ["summary", "monthly", months],
    queryFn: () => fetchSummary("monthly", `&months=${months}`),
  });
  return { rows, loading };
}

export function useCategoryBreakdown(month?: string, txType?: "income" | "expense") {
  const resolvedType = txType ?? "expense";
  const { data: rows = [], isLoading: loading } = useQuery<CategoryBreakdown[]>({
    queryKey: ["summary", "categories", month, resolvedType],
    queryFn: () => fetchSummary("categories", `${month ? `&month=${month}` : ""}&txType=${resolvedType}`),
  });
  return { rows, loading };
}

export interface NetWorthSummary {
  netWorth:         number;
  totalAssets:      number;
  totalLiabilities: number;
}

export function useNetWorth() {
  const { data, isLoading: loading } = useQuery<NetWorthSummary>({
    queryKey: ["summary", "networth"],
    queryFn:  () => fetchSummary("networth"),
    staleTime: 30_000,
  });
  return { data: data ?? null, loading };
}
