import * as Icons from "lucide-react";

interface Props {
  icon: string;
  size?: number;
  className?: string;
}

/**
 * Renders a category icon.
 * If `icon` is a Lucide component name (e.g. "Utensils"), renders the component.
 * Otherwise renders it as text (emoji fallback).
 */
export function CategoryIcon({ icon, size = 14, className }: Props) {
  const Icon = (Icons as Record<string, unknown>)[icon] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  if (Icon) return <Icon size={size} className={className} />;
  return <span className={className}>{icon}</span>;
}
