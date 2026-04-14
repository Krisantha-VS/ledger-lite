import { cn } from "@/shared/lib/utils";

type Variant = "income" | "expense" | "transfer" | "default";

const variantStyles: Record<Variant, string> = {
  income:   "bg-[hsl(var(--ll-income)/0.1)] text-[hsl(var(--ll-income))] ring-1 ring-[hsl(var(--ll-income)/0.2)]",
  expense:  "bg-[hsl(var(--ll-expense)/0.1)] text-[hsl(var(--ll-expense))] ring-1 ring-[hsl(var(--ll-expense)/0.2)]",
  transfer: "bg-[hsl(var(--ll-accent)/0.1)] text-[hsl(var(--ll-accent))] ring-1 ring-[hsl(var(--ll-accent)/0.2)]",
  default:  "bg-black/5 text-black/60 ring-1 ring-black/10 dark:bg-white/5 dark:text-white/60 dark:ring-white/10",
};

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
      variantStyles[variant],
      className,
    )}>
      {children}
    </span>
  );
}
