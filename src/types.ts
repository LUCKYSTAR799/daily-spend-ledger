export type Currency = "NGN" | "USD" | "EUR";

export type CategoryId =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "healthcare"
  | "shopping"
  | "business"
  | "groceries"
  | "education"
  | "misc";

export interface Transaction {
  id: string;
  /** amount in the transaction's own native currency */
  amount: number;
  currency: Currency;
  category: CategoryId;
  /** ISO timestamp */
  timestamp: string;
  note: string;
  merchant?: string;
  tags?: string[];
  isSimulated: boolean;
  receiptRef?: string;
}

export interface MonthlyBudget {
  amount: number;
  currency: Currency;
}

export type SortOrder = "newest" | "oldest" | "largest";
export type SourceFilter = "all" | "manual" | "simulated";

export interface LedgerFilterState {
  search: string;
  category: CategoryId | "all";
  currency: Currency | "all";
  source: SourceFilter;
  sort: SortOrder;
}

export interface SimState {
  active: boolean;
  speedMs: number;
  lastRun: number | null;
  count: number;
}
