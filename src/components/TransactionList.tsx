import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useToast } from "./Toasts";
import { CATEGORIES, CategoryIcon, getCategory } from "../lib/categories";
import { dayLabel, fmtSigned, fmtUSD, round2 } from "../lib/format";
import { txInMonth } from "../lib/selectors";
import type { Transaction } from "../types";

interface Props {
  monthKey: string;
  onEdit: (tx: Transaction) => void;
  onAdd: () => void;
}

export function TransactionList({ monthKey, onEdit, onAdd }: Props) {
  const { state, remove, add } = useFinance();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const monthTx = useMemo(() => txInMonth(state, monthKey), [state, monthKey]);
  const net = round2(
    monthTx.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0),
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = monthTx
      .filter((t) => (catFilter === "all" ? true : t.categoryId === catFilter))
      .filter((t) =>
        q
          ? t.note.toLowerCase().includes(q) ||
            getCategory(t.categoryId).label.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const arr = map.get(t.date);
      if (arr) arr.push(t);
      else map.set(t.date, [t]);
    }
    return [...map.entries()];
  }, [monthTx, query, catFilter]);

  const handleDelete = (tx: Transaction) => {
    remove(tx.id);
    push({
      message: `Deleted “${tx.note || getCategory(tx.categoryId).label}” · ${fmtUSD(tx.amount)}`,
      kind: "info",
      action: { label: "Undo", onClick: () => add(tx) },
    });
  };

  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label flex items-center gap-2">
            <span className="tick bg-mint-400" />
            Ledger
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-moss-100">
            Transactions
          </h2>
        </div>
        <span className="rounded-md border border-pine-700 bg-pine-900/70 px-2.5 py-1 font-mono text-[11px] tabular-nums text-moss-400">
          {monthTx.length} record{monthTx.length === 1 ? "" : "s"} ·{" "}
          <span className={net >= 0 ? "text-mint-400" : "text-coral-400"}>{fmtUSD(net)}</span>
        </span>
      </header>

      <div className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-moss-500"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or categories…"
            aria-label="Search transactions"
            className="input pl-9"
          />
        </div>
        <div className="relative flex-none">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            aria-label="Filter by category"
            className="input w-[148px] appearance-none pr-8 text-[13px]"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-moss-500"
            aria-hidden
          />
        </div>
      </div>

      <div className="scroll-slim -mr-2 min-h-0 flex-1 overflow-y-auto pr-2 lg:max-h-[560px]">
        {groups.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-[14px] border border-pine-600 bg-pine-800 text-moss-500">
              <Receipt size={22} aria-hidden />
            </span>
            <div>
              <p className="font-display text-[15px] font-semibold text-moss-200">
                {monthTx.length === 0 ? "Nothing here yet" : "No matches"}
              </p>
              <p className="mx-auto mt-1 max-w-[260px] text-[12.5px] leading-relaxed text-moss-500">
                {monthTx.length === 0
                  ? "This month's ledger is blank. Record your first income or expense."
                  : "Try a different search or category filter."}
              </p>
            </div>
            {monthTx.length === 0 && (
              <button onClick={onAdd} className="btn-primary px-3.5 py-2 text-[13px]">
                <Plus size={15} strokeWidth={2.6} aria-hidden />
                Add transaction
              </button>
            )}
          </div>
        ) : (
          groups.map(([date, items]) => {
            const dayNet = items.reduce(
              (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
              0,
            );
            return (
              <section key={date} className="mb-2.5">
                <h3 className="sticky top-0 z-10 mb-1 flex items-center justify-between rounded-md bg-pine-850/95 px-1 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-moss-500 backdrop-blur-sm">
                  {dayLabel(date)}
                  <span
                    className={`font-mono text-[10.5px] normal-case tracking-normal tabular-nums ${
                      dayNet >= 0 ? "text-mint-500" : "text-moss-500"
                    }`}
                  >
                    {dayNet >= 0 ? "+" : "\u2212"}
                    {fmtUSD(Math.abs(dayNet)).replace("-", "")}
                  </span>
                </h3>
                <ul className="space-y-0.5">
                  {items.map((t) => {
                    const cat = getCategory(t.categoryId);
                    return (
                      <li
                        key={t.id}
                        className="group flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-pine-800/60"
                      >
                        <span
                          className="grid h-9 w-9 flex-none place-items-center rounded-[10px]"
                          style={{ background: `${cat.color}1a`, color: cat.color }}
                        >
                          <CategoryIcon id={t.categoryId} size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-moss-200">
                            {t.note || cat.label}
                          </p>
                          <p className="text-[11px] text-moss-500">{cat.label}</p>
                        </div>
                        <span
                          className={`font-mono text-[13.5px] font-semibold tabular-nums ${
                            t.type === "income" ? "text-mint-400" : "text-moss-100"
                          }`}
                        >
                          {fmtSigned(t.type, t.amount)}
                        </span>
                        <span className="flex flex-none gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <button
                            className="icon-btn"
                            onClick={() => onEdit(t)}
                            aria-label={`Edit ${t.note || cat.label}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="icon-btn hover:text-coral-400"
                            onClick={() => handleDelete(t)}
                            aria-label={`Delete ${t.note || cat.label}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
