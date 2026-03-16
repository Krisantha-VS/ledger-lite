import { cn } from "@/shared/lib/utils";

type Variant = "income" | "expense" | "transfer" | "default";

const variantStyles: Record<Variant, string> = {
  income:   "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
  expense:  "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  transfer: "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20",
  default:  "bg-white/5 text-white/60 ring-1 ring-white/10",
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
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
