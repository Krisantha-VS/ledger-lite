"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { Category, CategoryType } from "@/shared/types";

const KEY = ["categories"];

async function fetchCategories(): Promise<Category[]> {
  const res  = await authFetch("/api/v1/categories");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useCategories() {
  const qc = useQueryClient();

  const { data: categories = [], isLoading: loading, error } = useQuery({
    queryKey: KEY,
    queryFn: fetchCategories,
    staleTime: 5 * 60_000, // categories rarely change
  });

  const createCategory = useMutation({
    mutationFn: async (payload: { name: string; icon: string; colour: string; type: CategoryType }) => {
      const res  = await authFetch("/api/v1/categories", { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Category;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Category created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: async (payload: { id: number; name?: string; icon?: string; colour?: string }) => {
      const { id, ...body } = payload;
      const res  = await authFetch(`/api/v1/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Category;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Category updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const res  = await authFetch(`/api/v1/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Category deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    categories,
    loading,
    error: error ? (error as Error).message : null,
    createCategory: (p: Parameters<typeof createCategory.mutateAsync>[0]) => createCategory.mutateAsync(p),
    updateCategory: (p: Parameters<typeof updateCategory.mutateAsync>[0]) => updateCategory.mutateAsync(p),
    deleteCategory: (id: number) => deleteCategory.mutateAsync(id),
  };
}
