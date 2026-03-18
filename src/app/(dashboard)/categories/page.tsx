import type { Metadata } from "next";
import { CategoriesView } from "@/features/categories/components/categories-view";
export const metadata: Metadata = { title: "Categories · LedgerLite" };
export default function CategoriesPage() { return <CategoriesView />; }
