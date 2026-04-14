"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const styles: Record<Variant, string> = {
  primary:   "bg-[hsl(var(--ll-accent))] text-[hsl(var(--ll-accent-fg))] hover:bg-[hsl(var(--ll-accent-hover))]",
  secondary: "bg-[hsl(var(--ll-bg-surface))] border border-[hsl(var(--ll-border))] text-[hsl(var(--ll-text-primary))] hover:bg-[hsl(var(--ll-bg-elevated))]",
  danger:    "bg-[hsl(var(--ll-expense)/0.1)] border border-[hsl(var(--ll-expense)/0.3)] text-[hsl(var(--ll-expense))] hover:bg-[hsl(var(--ll-expense)/0.15)]",
  ghost:     "text-[hsl(var(--ll-text-muted))] hover:bg-[hsl(var(--ll-bg-elevated))] hover:text-[hsl(var(--ll-text-primary))]",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ll-accent))] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
