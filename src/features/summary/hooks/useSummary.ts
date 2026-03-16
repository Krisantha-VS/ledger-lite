"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/shared/lib/auth-client";
import type { MonthlySummary, CategoryBreakdown } from "@/shared/types";

export interface DashboardSummary {
  monthIncome: number;
  monthExpenses: number;
  monthNet: number;
  budgetsOverLimit: number;
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/v1/summary?type=dashboard");
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { summary, loading, reload: load };
}

export function useMonthlySummary(months = 12) {
  const [rows, setRows]       = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/v1/summary?type=monthly&months=${months}`)
      .then(r => r.json())
      .then(j => { if (j.success) setRows(j.data); })
      .finally(() => setLoading(false));
  }, [months]);

  return { rows, loading };
}

export function useCategoryBreakdown(month?: string) {
  const [rows, setRows]       = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = month ? `&month=${month}` : "";
    authFetch(`/api/v1/summary?type=categories${q}`)
      .then(r => r.json())
      .then(j => { if (j.success) setRows(j.data); })
      .finally(() => setLoading(false));
  }, [month]);

  return { rows, loading };
}
