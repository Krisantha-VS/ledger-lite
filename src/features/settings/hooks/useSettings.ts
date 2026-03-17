"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import type { UserSettings } from "@/shared/types";

const KEY = ["settings"];

async function fetchSettings(): Promise<UserSettings> {
  const res  = await authFetch("/api/v1/settings");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export function useSettings() {
  const qc = useQueryClient();

  const { data: settings, isLoading: loading } = useQuery({
    queryKey: KEY,
    queryFn:  fetchSettings,
  });

  const updateSettings = useMutation({
    mutationFn: async (payload: Partial<Pick<UserSettings, "currency" | "locale" | "theme">>) => {
      const res  = await authFetch("/api/v1/settings", { method: "PATCH", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as UserSettings;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success("Settings saved"); },
    onError:   (e: Error) => toast.error(e.message),
  });

  return {
    settings,
    loading,
    updateSettings: (p: Parameters<typeof updateSettings.mutateAsync>[0]) => updateSettings.mutateAsync(p),
    isSaving: updateSettings.isPending,
  };
}
