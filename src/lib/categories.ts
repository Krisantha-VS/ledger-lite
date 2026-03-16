export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining",  icon: "Utensils",    colour: "#f59e0b", type: "expense" as const, isSystem: true },
  { name: "Transport",      icon: "Car",          colour: "#3b82f6", type: "expense" as const, isSystem: true },
  { name: "Housing",        icon: "Home",         colour: "#8b5cf6", type: "expense" as const, isSystem: true },
  { name: "Utilities",      icon: "Zap",          colour: "#06b6d4", type: "expense" as const, isSystem: true },
  { name: "Health",         icon: "Heart",        colour: "#ec4899", type: "expense" as const, isSystem: true },
  { name: "Entertainment",  icon: "Gamepad2",     colour: "#f43f5e", type: "expense" as const, isSystem: true },
  { name: "Shopping",       icon: "ShoppingBag",  colour: "#f97316", type: "expense" as const, isSystem: true },
  { name: "Personal",       icon: "User",         colour: "#94a3b8", type: "expense" as const, isSystem: true },
  { name: "Salary",         icon: "Briefcase",    colour: "#22c55e", type: "income"  as const, isSystem: true },
  { name: "Freelance",      icon: "Code",         colour: "#10b981", type: "income"  as const, isSystem: true },
  { name: "Investment",     icon: "TrendingUp",   colour: "#6366f1", type: "income"  as const, isSystem: true },
  { name: "Other",          icon: "Circle",       colour: "#64748b", type: "both"    as const, isSystem: true },
] as const;
