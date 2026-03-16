export type AccountType      = "checking" | "savings" | "cash" | "credit" | "investment";
export type TransactionType  = "income" | "expense" | "transfer";
export type CategoryType     = "income" | "expense" | "both";
export type RecurrencePeriod = "weekly" | "monthly";

export interface Account {
  id:              number;
  userId:          string;
  name:            string;
  type:            AccountType;
  currency:        string;
  startingBalance: number;
  colour:          string;
  isArchived:      boolean;
  balance:         number;   // computed: starting + sum(transactions)
  createdAt:       string;
}

export interface Category {
  id:        number;
  userId:    string;
  name:      string;
  icon:      string;
  colour:    string;
  type:      CategoryType;
  isSystem:  boolean;
  createdAt: string;
}

export interface Transaction {
  id:           number;
  userId:       string;
  accountId:    number;
  categoryId:   number;
  type:         TransactionType;
  amount:       number;
  date:         string;
  note:         string | null;
  isRecurring:  boolean;
  recurrence:   RecurrencePeriod | null;
  nextDue:      string | null;
  transferToId: number | null;
  createdAt:    string;
  updatedAt:    string;
  // joined
  categoryName?:   string;
  categoryIcon?:   string;
  categoryColour?: string;
  accountName?:    string;
}

export interface Budget {
  id:         number;
  userId:     string;
  categoryId: number;
  amount:     number;
  period:     "monthly";
  createdAt:  string;
  // computed
  spent?:          number;
  categoryName?:   string;
  categoryColour?: string;
  categoryIcon?:   string;
}

export interface Goal {
  id:           number;
  userId:       string;
  accountId:    number | null;
  name:         string;
  targetAmount: number;
  targetDate:   string | null;
  colour:       string;
  isCompleted:  boolean;
  createdAt:    string;
  // computed
  currentBalance?:          number;
  projectedCompletionDate?: string | null;
}

export interface MonthlySummary {
  month:    string;
  income:   number;
  expenses: number;
  net:      number;
}

export interface CategoryBreakdown {
  categoryId: number;
  name:       string;
  colour:     string;
  icon:       string;
  total:      number;
  percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
}
