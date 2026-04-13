import { Banknote, PiggyBank, Wallet, CreditCard, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ACCOUNT_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  checking:   { label: "Checking Account", icon: Banknote    },
  savings:    { label: "Savings Account",  icon: PiggyBank   },
  cash:       { label: "Cash",             icon: Wallet      },
  credit:     { label: "Credit Card",      icon: CreditCard  },
  investment: { label: "Investment",       icon: TrendingUp  },
};

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_CONFIG[type]?.label ?? type;
}

export function accountTypeIcon(type: string): LucideIcon {
  return ACCOUNT_TYPE_CONFIG[type]?.icon ?? Banknote;
}
