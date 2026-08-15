import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useToast } from "./Toasts";
import { CATEGORIES, CategoryIcon, getCategory } from "../lib/categories";
import { fmtUSD, todayISO, uid } from "../lib/format";
import { useBodyScrollLock } from "../lib/hooks";
import type { Transaction, TxType } from "../types";

interface Props {
  open: boolean;
  editing: Transaction | null;
  onClose: () => void;
}

export function TransactionModal({ open, editing, onClose }: Props) {
  const { add, update } = useFinance();
  const { push } = useToast();
  useBodyScrollLock(open);

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("dining");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setDate(editing.date);
      setNote(editing.note);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("dining");
      setDate(todayISO());
      setNote("");
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cats = CATEGORIES.filter((c) => c.type === type);

  const switchType = (t: TxType) => {
    setType(t);
    if (getCategory(categoryId).type !== t) {
      setCategoryId(t === "income" ? "salary" : "dining");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (amt > 10_000_000) {
      setError("That amount looks a little too large for a personal ledger.");
      return;
    }
    if (!date) {
      setError("Pick a date for this entry.");
      return;
    }
    const tx: Transaction = {
      id: editing?.id ?? uid(),
      type,
      amount: Math.round(amt * 100) / 100,
      categoryId,
      note: note.trim(),
      date,
    };
    if (editing) {
      update(tx);
      push({
        message: `Updated “${tx.note || getCategory(tx.categoryId).label}” · ${fmtUSD(tx.amount)}`,
        kind: "success",
      });
    } else {
      add(tx);
      push({
        message: `${type === "income" ? "Income" : "Expense"} added — ${
          tx.note || getCategory(tx.categoryId).label
        } · ${fmtUSD(tx.amount)}`,
        kind: "success",
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="fade-in absolute inset-0 cursor-default bg-pine-950/70 backdrop-blur-[3px] focus-visible:outline-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit transaction" : "Add transaction"}
        className="modal-in relative max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-[18px] border border-pine-600 bg-pine-850 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.85)] sm:rounded-[16px]"
      >
        <header className="flex items-center justify-between border-b border-pine-700 px-5 py-4">
          <div>
            <p className="label">{editing ? "Editing entry" : "New entry"}</p>
            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-moss-100">
              {editing ? "Edit transaction" : "Add transaction"}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={17} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-1 rounded-[10px] border border-pine-700 bg-pine-900 p-1">
            {(["expense", "income"] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                aria-pressed={type === t}
                className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
                  type === t
                    ? t === "income"
                      ? "bg-mint-400/15 text-mint-400 shadow-[inset_0_0_0_1px_rgba(87,227,155,0.35)]"
                      : "bg-coral-400/15 text-coral-400 shadow-[inset_0_0_0_1px_rgba(255,122,108,0.35)]"
                    : "text-moss-500 hover:text-moss-300"
                }`}
              >
                {t === "income" ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="tx-amount" className="label mb-1.5 block">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg font-semibold text-moss-500">
                $
              </span>
              <input
                id="tx-amount"
                autoFocus
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                className="input py-3 pl-8 font-mono text-[22px] font-bold tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="label mb-1.5 block">Category</span>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {cats.map((c) => {
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-[10px] border px-1.5 py-2.5 transition-all ${
                      active
                        ? ""
                        : "border-pine-700 bg-pine-900/60 text-moss-400 hover:border-pine-600 hover:text-moss-200"
                    }`}
                    style={
                      active
                        ? { borderColor: `${c.color}66`, background: `${c.color}14`, color: c.color }
                        : undefined
                    }
                  >
                    <CategoryIcon id={c.id} size={17} />
                    <span className="text-[10.5px] font-semibold leading-none">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
            <div>
              <label htmlFor="tx-date" className="label mb-1.5 block">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="input font-mono text-[13px]"
              />
            </div>
            <div>
              <label htmlFor="tx-note" className="label mb-1.5 block">
                Note <span className="normal-case tracking-normal text-moss-500">(optional)</span>
              </label>
              <input
                id="tx-note"
                type="text"
                maxLength={64}
                placeholder="e.g. Weekly grocery haul"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-coral-400/30 bg-coral-400/10 px-3 py-2 text-[12.5px] font-medium text-coral-300"
            >
              <AlertTriangle size={14} className="flex-none" aria-hidden />
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 text-[13.5px]">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center px-4 py-2.5 text-[13.5px] hover:brightness-110"
              style={
                type === "expense"
                  ? { background: "#ff7a6c", boxShadow: "0 6px 20px -8px rgba(255,122,108,0.55)" }
                  : undefined
              }
            >
              {editing ? "Save changes" : type === "income" ? "Add income" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
