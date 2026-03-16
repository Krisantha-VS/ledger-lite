"use client";

import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/shared/lib/auth-client";
import type { Category } from "@/shared/types";

async function fetchCategories(): Promise<Category[]> {
  const res  = await authFetch("/api/v1/categories");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useCategories() {
  const { data: categories = [], isLoading: loading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000, // categories rarely change
  });

  return {
    categories,
    loading,
    error: error ? (error as Error).message : null,
  };
}
