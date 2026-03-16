import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: "hsl(var(--ll-accent) / 0.08)" }}
      >
        <Icon className="h-6 w-6" style={{ color: "hsl(var(--ll-accent))" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>{title}</p>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
