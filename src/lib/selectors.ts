import type { FinanceState, Transaction, TxType } from "../types";
import { lastNMonthKeys, monthShortLabel, round2 } from "./format";

export const txInMonth = (state: FinanceState, monthKey: string): Transaction[] =>
  state.transactions.filter((t) => t.date.startsWith(monthKey));

export const sumByType = (txs: Transaction[], type: TxType): number =>
  round2(txs.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0));

export interface CategorySlice {
  id: string;
  value: number;
}

export const expensesByCategory = (txs: Transaction[]): CategorySlice[] => {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([id, value]) => ({ id, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
};

export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export const monthSeries = (state: FinanceState, endKey: string, n: number): MonthPoint[] =>
  lastNMonthKeys(endKey, n).map((key) => {
    const txs = txInMonth(state, key);
    const income = sumByType(txs, "income");
    const expenses = sumByType(txs, "expense");
    return { key, label: monthShortLabel(key), income, expenses, net: round2(income - expenses) };
  });

export const allTimeNet = (state: FinanceState): number =>
  round2(
    state.transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0),
  );
