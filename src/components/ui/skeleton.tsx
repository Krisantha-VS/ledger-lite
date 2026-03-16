import { cn } from "@/shared/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ background: "hsl(var(--ll-border))" }}
    />
  );
}
