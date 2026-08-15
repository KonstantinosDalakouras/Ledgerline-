export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  /** Positive amount in USD */
  amount: number;
  categoryId: string;
  note: string;
  /** ISO date, yyyy-mm-dd (local) */
  date: string;
}

/** categoryId -> monthly budget amount in USD */
export type Budgets = Record<string, number>;

export interface FinanceState {
  transactions: Transaction[];
  budgets: Budgets;
}
