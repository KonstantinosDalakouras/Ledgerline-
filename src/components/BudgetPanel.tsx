import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Pencil, Plus, X } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useToast } from "./Toasts";
import { CategoryIcon, expenseCategories, getCategory } from "../lib/categories";
import { fmtUSD, fmtUSD0, monthLabel, round2 } from "../lib/format";
import { expensesByCategory, txInMonth } from "../lib/selectors";

export function BudgetPanel({ monthKey }: { monthKey: string }) {
  const { state, setBudget } = useFinance();
  const { push } = useToast();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState("");
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setEditing(null);
    setAdding(false);
  }, [monthKey]);

  const spentMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of expensesByCategory(txInMonth(state, monthKey))) m.set(s.id, s.value);
    return m;
  }, [state, monthKey]);

  const rows = useMemo(
    () =>
      expenseCategories
        .map((cat) => ({
          cat,
          spent: spentMap.get(cat.id) ?? 0,
          budget: state.budgets[cat.id] ?? 0,
        }))
        .filter((r) => r.budget > 0 || r.spent > 0)
        .sort((a, b) => b.spent / (b.budget || 1) - a.spent / (a.budget || 1)),
    [spentMap, state.budgets],
  );

  const untracked = expenseCategories.filter((c) => !rows.some((r) => r.cat.id === c.id));
  const totalBudget = rows.reduce((a, r) => a + r.budget, 0);
  const totalSpent = round2(rows.reduce((a, r) => a + r.spent, 0));
  const remaining = round2(totalBudget - totalSpent);

  const startEdit = (id: string, current: number) => {
    cancelRef.current = false;
    setAdding(false);
    setEditing(id);
    setDraft(current > 0 ? String(current) : "");
  };

  const cancelEdit = () => {
    cancelRef.current = true;
    setEditing(null);
  };

  const commit = (id: string) => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    const raw = draft.trim();
    const val = raw === "" ? 0 : Number(raw);
    setEditing(null);
    if (!Number.isFinite(val) || val < 0) return;
    const rounded = Math.round(val * 100) / 100;
    if (rounded === (state.budgets[id] ?? 0)) return;
    setBudget(id, rounded);
    push({
      message:
        rounded > 0
          ? `${getCategory(id).label} budget set to ${fmtUSD(rounded)}/mo`
          : `${getCategory(id).label} budget removed`,
      kind: "success",
    });
  };

  const addFor = (id: string) => {
    setBudget(id, 100);
    setAdding(false);
    push({ message: `${getCategory(id).label} budget started at ${fmtUSD(100)}/mo — tune it to fit.`, kind: "success" });
    startEdit(id, 100);
  };

  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="label flex items-center gap-2">
            <span className="tick bg-gold-400" />
            Budgets
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-moss-100">
            Monthly goals
          </h2>
        </div>
        <span className="rounded-md border border-pine-700 px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-moss-500">
          {monthLabel(monthKey)}
        </span>
      </header>

      <div className="grid grid-cols-3 divide-x divide-pine-700 overflow-hidden rounded-[10px] border border-pine-700 bg-pine-900/70">
        <div className="px-3 py-2.5">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-moss-500">
            Budgeted
          </p>
          <p className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-moss-100">
            {fmtUSD0(totalBudget)}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-moss-500">
            Spent
          </p>
          <p className="mt-0.5 font-mono text-[15px] font-bold tabular-nums text-moss-100">
            {fmtUSD0(totalSpent)}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-moss-500">
            Left
          </p>
          <p
            className={`mt-0.5 font-mono text-[15px] font-bold tabular-nums ${
              remaining >= 0 ? "text-mint-400" : "text-coral-400"
            }`}
          >
            {fmtUSD0(remaining)}
          </p>
        </div>
      </div>

      <div className="scroll-slim mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {rows.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-moss-500">
            No budgets, no spending — a blank slate.
            <br />
            Set your first goal below.
          </p>
        )}

        <ul className="space-y-1">
          {rows.map(({ cat, spent, budget }) => {
            const ratio = budget > 0 ? spent / budget : 1;
            const pctClamped = Math.min(100, ratio * 100);
            const over = budget > 0 && spent > budget;
            const barColor =
              budget === 0 ? "#64796b" : ratio > 0.95 ? "#ff7a6c" : ratio > 0.7 ? "#ffc25e" : "#57e39b";

            return (
              <li
                key={cat.id}
                className="group rounded-[10px] border border-transparent px-2.5 py-2.5 transition-colors hover:border-pine-600 hover:bg-pine-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 flex-none place-items-center rounded-[9px]"
                    style={{ background: `${cat.color}1a`, color: cat.color }}
                  >
                    <CategoryIcon id={cat.id} size={15} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-moss-200">
                    {cat.label}
                  </p>

                  {editing === cat.id ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-moss-500">$</span>
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        step="10"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commit(cat.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onBlur={() => commit(cat.id)}
                        aria-label={`${cat.label} monthly budget in dollars`}
                        className="input w-24 py-1.5 font-mono text-[13px]"
                      />
                      <button
                        className="icon-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => commit(cat.id)}
                        aria-label="Save budget"
                      >
                        <Check size={15} className="text-mint-400" />
                      </button>
                      <button
                        className="icon-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={cancelEdit}
                        aria-label="Cancel editing"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-mono text-[12.5px] tabular-nums">
                        <span className={over ? "font-semibold text-coral-400" : "text-moss-100"}>
                          {fmtUSD(spent)}
                        </span>
                        {budget > 0 && <span className="text-moss-500"> / {fmtUSD(budget)}</span>}
                      </p>
                      <button
                        className="icon-btn opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                        onClick={() => startEdit(cat.id, budget)}
                        aria-label={`Edit ${cat.label} budget`}
                      >
                        <Pencil size={13.5} />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2.5 pl-[42px]">
                  <div className="h-[7px] flex-1 overflow-hidden rounded-full border border-pine-700/60 bg-pine-950/80">
                    {budget > 0 ? (
                      <div
                        className="bar-fill h-full rounded-full"
                        style={{
                          width: mounted ? `${pctClamped}%` : "0%",
                          background: barColor,
                          boxShadow: `0 0 12px -3px ${barColor}`,
                        }}
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, rgba(139,163,146,0.28) 0 6px, transparent 6px 12px)",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="w-[88px] flex-none text-right font-mono text-[10.5px] tabular-nums"
                    style={{ color: budget === 0 ? "#64796b" : barColor }}
                  >
                    {budget > 0 ? (
                      over ? (
                        <>+{fmtUSD(spent - budget)} over</>
                      ) : (
                        <>{Math.round(ratio * 100)}% used</>
                      )
                    ) : (
                      <button
                        onClick={() => startEdit(cat.id, 0)}
                        className="text-moss-500 underline decoration-dotted underline-offset-2 transition-colors hover:text-mint-300"
                      >
                        set goal
                      </button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}

          {untracked.length > 0 && (
            <li className="pt-2">
              {adding ? (
                <div className="flex items-center gap-2 px-2.5">
                  <div className="relative flex-1">
                    <select
                      autoFocus
                      value={sel}
                      onChange={(e) => setSel(e.target.value)}
                      aria-label="Choose a category to budget"
                      className="input appearance-none py-2 pr-8 text-[13px]"
                    >
                      {untracked.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-moss-500"
                    />
                  </div>
                  <button
                    onClick={() => sel && addFor(sel)}
                    className="btn-ghost px-2.5 py-2 text-xs"
                  >
                    Set {fmtUSD0(100)}
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="icon-btn"
                    aria-label="Cancel adding a budget"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSel(untracked[0]?.id ?? "");
                    setEditing(null);
                    setAdding(true);
                  }}
                  className="btn-ghost w-full justify-center px-3 py-2 text-xs"
                >
                  <Plus size={13} strokeWidth={2.4} aria-hidden />
                  Budget another category
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
