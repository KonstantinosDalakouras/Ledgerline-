import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Budgets, FinanceState, Transaction } from "../types";
import { buildDemoState } from "../lib/seed";

const STORAGE_KEY = "ledgerline:v2";

/** The app always initializes to zero — an empty ledger, no budgets. */
export const EMPTY_STATE: FinanceState = { transactions: [], budgets: {} };

type Action =
  | { type: "add"; tx: Transaction }
  | { type: "update"; tx: Transaction }
  | { type: "remove"; id: string }
  | { type: "setBudget"; categoryId: string; amount: number }
  | { type: "replace"; state: FinanceState };

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case "add":
      return { ...state, transactions: [action.tx, ...state.transactions] };
    case "update":
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)),
      };
    case "remove":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "setBudget": {
      const budgets: Budgets = { ...state.budgets };
      if (action.amount <= 0) delete budgets[action.categoryId];
      else budgets[action.categoryId] = action.amount;
      return { ...state, budgets };
    }
    case "replace":
      return action.state;
  }
}

function loadInitial(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceState>;
      if (
        Array.isArray(parsed.transactions) &&
        parsed.budgets &&
        typeof parsed.budgets === "object"
      ) {
        return { transactions: parsed.transactions, budgets: parsed.budgets };
      }
    }
  } catch {
    /* corrupted storage — fall back to a clean slate */
  }
  return EMPTY_STATE;
}

interface FinanceApi {
  state: FinanceState;
  add: (tx: Transaction) => void;
  update: (tx: Transaction) => void;
  remove: (id: string) => void;
  setBudget: (categoryId: string, amount: number) => void;
  /** Load five months of realistic sample data (replaces everything). */
  loadSample: () => void;
  clearAll: () => void;
}

const Ctx = createContext<FinanceApi | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — app keeps working in memory */
    }
  }, [state]);

  const api = useMemo<FinanceApi>(
    () => ({
      state,
      add: (tx) => dispatch({ type: "add", tx }),
      update: (tx) => dispatch({ type: "update", tx }),
      remove: (id) => dispatch({ type: "remove", id }),
      setBudget: (categoryId, amount) =>
        dispatch({ type: "setBudget", categoryId, amount: Math.round(amount * 100) / 100 }),
      loadSample: () => dispatch({ type: "replace", state: buildDemoState() }),
      clearAll: () => dispatch({ type: "replace", state: EMPTY_STATE }),
    }),
    [state],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useFinance(): FinanceApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFinance must be used inside <FinanceProvider>");
  return ctx;
}
