"use client";

import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { RecurringSuggestions } from "./recurring-suggestions";

export function RecurringSuggestionsLoader() {
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  return <RecurringSuggestions accounts={accounts} categories={categories} />;
}
