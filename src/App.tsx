import { useCallback, useState } from "react";
import { Download, Plus, RefreshCcw, ShieldCheck, Trash2, X } from "lucide-react";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { ToastProvider, useToast } from "./components/Toasts";
import { Header } from "./components/Header";
import { Overview } from "./components/Overview";
import { CashflowChart } from "./components/CashflowChart";
import { CategoryDonut } from "./components/CategoryDonut";
import { BudgetPanel } from "./components/BudgetPanel";
import { TransactionList } from "./components/TransactionList";
import { TransactionModal } from "./components/TransactionModal";
import { Reveal } from "./components/Reveal";
import { allTimeNet } from "./lib/selectors";
import { buildCSV, currentMonthKey, downloadFile, shiftMonth } from "./lib/format";
import { getCategory } from "./lib/categories";
import type { Transaction } from "./types";

const TICKER = [
  "spend less than you earn",
  "pay yourself first",
  "a budget is telling your money where to go",
  "save before you splurge",
  "track the small stuff — it adds up",
  "compound interest never sleeps",
  "net worth = assets − liabilities",
  "every entry is a vote for the person you want to be",
];

function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div
      className="marquee relative z-10 border-b border-pine-700/60 bg-pine-900/70 py-1.5"
      aria-hidden
    >
      <div className="marquee-track">
        {items.map((t, i) => (
          <span
            key={i}
            className="flex items-center px-5 font-mono text-[10.5px] uppercase tracking-[0.22em] whitespace-nowrap text-moss-500"
          >
            {t}
            <span className="pl-10 text-mint-500/70">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Onboarding({
  onAdd,
  onLoadSample,
}: {
  onAdd: () => void;
  onLoadSample: () => void;
}) {
  const steps = [
    {
      n: "01",
      title: "Record your first entry",
      copy: "Income or expense — salary, rent, a coffee. Anything that moved money.",
    },
    {
      n: "02",
      title: "Give a category a goal",
      copy: "Set a monthly budget for groceries or dining and watch the bar fill as you spend.",
    },
    {
      n: "03",
      title: "Watch the trends form",
      copy: "Cashflow bars, the category donut and your savings rate come alive with data.",
    },
  ];

  return (
    <Reveal>
      <section
        className="card relative overflow-hidden p-6 sm:p-8"
        aria-label="Getting started"
      >
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #2e7d57, transparent 68%)" }}
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="label flex items-center gap-2">
              <span className="tick bg-mint-400" />
              Day zero
            </p>
            <h1 className="mt-2.5 font-display text-[30px] font-bold leading-[1.06] tracking-tight text-moss-100 sm:text-[40px]">
              Your ledger starts
              <br />
              at <span className="font-mono text-mint-400">$0.00</span> —
              <br className="hidden sm:block" /> exactly where wealth begins.
            </h1>
            <p className="mt-4 max-w-[430px] text-[14px] leading-relaxed text-moss-400">
              No accounts, no spreadsheets. Log what comes in and what goes out, give your
              spending a ceiling, and let the charts tell you the truth about your month.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={onAdd} className="btn-primary px-4 py-2.5 text-[13.5px]">
                <Plus size={16} strokeWidth={2.6} aria-hidden />
                Add your first transaction
              </button>
              <button onClick={onLoadSample} className="btn-ghost px-4 py-2.5 text-[13px]">
                <RefreshCcw size={13} aria-hidden />
                or load sample data
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-moss-500">
              <ShieldCheck size={12} className="text-mint-500" aria-hidden />
              Everything stays in this browser — you can wipe it anytime.
            </p>
          </div>

          <ol className="relative space-y-2.5">
            <span
              className="pointer-events-none absolute bottom-6 left-[19px] top-6 w-px"
              style={{
                background:
                  "repeating-linear-gradient(180deg, rgba(87,227,155,0.35) 0 5px, transparent 5px 11px)",
              }}
            />
            {steps.map((s, i) => (
              <li
                key={s.n}
                className="card card-hover relative flex gap-4 border-pine-700/70 p-4"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] border border-mint-400/25 bg-pine-800 font-mono text-[13px] font-bold text-mint-400 shadow-[0_0_16px_-6px_rgba(87,227,155,0.5)]">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[14.5px] font-semibold text-moss-100">
                    {s.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-moss-500">{s.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Reveal>
  );
}

function Footer() {
  const { state, loadSample, clearAll } = useFinance();
  const { push } = useToast();
  const [confirming, setConfirming] = useState<"reset" | "clear" | null>(null);

  const exportCsv = () => {
    if (state.transactions.length === 0) {
      push({ message: "Nothing to export yet — add a transaction first.", kind: "info" });
      return;
    }
    downloadFile(
      "ledgerline-transactions.csv",
      buildCSV(state.transactions, (id) => getCategory(id).label),
    );
    push({
      message: `Exported ${state.transactions.length} transaction${
        state.transactions.length === 1 ? "" : "s"
      } to CSV.`,
      kind: "success",
    });
  };

  const confirmBlock = (label: string, onYes: () => void) => (
    <div className="fade-in flex w-full items-center gap-2 rounded-[9px] border border-coral-400/30 bg-coral-400/10 px-3 py-2">
      <p className="min-w-0 flex-1 text-[12px] leading-snug text-coral-300">{label}</p>
      <button
        className="flex-none rounded-md bg-coral-400 px-2.5 py-1 text-xs font-bold text-pine-950 transition-colors hover:bg-coral-300"
        onClick={onYes}
      >
        Yes
      </button>
      <button
        className="icon-btn h-7 w-7 flex-none"
        onClick={() => setConfirming(null)}
        aria-label="Cancel"
      >
        <X size={13} />
      </button>
    </div>
  );

  const isEmpty = state.transactions.length === 0;

  const handleSample = () => {
    if (isEmpty) {
      loadSample();
      push({
        message: "Sample ledger loaded — five months of realistic history to explore.",
        kind: "success",
      });
      return;
    }
    setConfirming("reset");
  };

  return (
    <footer className="relative z-10 mt-10 border-t border-pine-700/60">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-mint-400/25 bg-pine-800">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M7 4v13h11"
                  stroke="#57e39b"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="18.5" cy="6.5" r="2.6" fill="#ffc25e" />
              </svg>
            </span>
            <span className="font-display text-[16px] font-bold tracking-tight text-moss-100">
              Ledgerline
            </span>
          </div>
          <p className="mt-3 max-w-[300px] text-[12.5px] leading-relaxed text-moss-500">
            A local-first personal finance dashboard. You start at $0.00 — no seed data, no
            accounts, no cloud. Your ledger lives in this browser's storage, and only there.
          </p>
        </div>

        <div>
          <p className="label mb-3">Your data</p>
          <div className="space-y-2">
            <button onClick={exportCsv} className="btn-ghost w-full justify-center px-3 py-2 text-xs">
              <Download size={13} aria-hidden />
              Export ledger as CSV
            </button>

            {confirming === "reset" ? (
              confirmBlock("Replace your real data with five months of sample data?", () => {
                loadSample();
                setConfirming(null);
                push({
                  message: "Sample ledger loaded — your previous data was replaced.",
                  kind: "success",
                });
              })
            ) : (
              <button onClick={handleSample} className="btn-ghost w-full justify-center px-3 py-2 text-xs">
                <RefreshCcw size={13} aria-hidden />
                {isEmpty ? "Load sample ledger" : "Replace with sample ledger"}
              </button>
            )}

            {confirming === "clear" ? (
              confirmBlock("Wipe the entire local ledger and all budgets?", () => {
                clearAll();
                setConfirming(null);
                push({ message: "Ledger cleared. Fresh start.", kind: "info" });
              })
            ) : (
              <button
                onClick={() => setConfirming("clear")}
                className="btn-ghost w-full justify-center px-3 py-2 text-xs hover:border-coral-400/40 hover:text-coral-400"
              >
                <Trash2 size={13} aria-hidden />
                Clear all data
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="label mb-3">Colophon</p>
          <p className="text-[12.5px] leading-relaxed text-moss-500">
            Built with React, TypeScript, Vite, Tailwind CSS and Recharts.
            <br />
            Type set in Bricolage Grotesque, Instrument Sans &amp; JetBrains Mono.
          </p>
          <p className="mt-4 font-mono text-[11px] tabular-nums text-moss-500">
            © 2026 Ledgerline · MIT licensed
          </p>
        </div>
      </div>
    </footer>
  );
}

function Shell() {
  const { state, loadSample } = useFinance();
  const { push } = useToast();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [modal, setModal] = useState<{ open: boolean; editing: Transaction | null }>({
    open: false,
    editing: null,
  });

  const openAdd = useCallback(() => setModal({ open: true, editing: null }), []);
  const openEdit = useCallback((tx: Transaction) => setModal({ open: true, editing: tx }), []);
  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);
  const loadSampleFromOnboarding = useCallback(() => {
    loadSample();
    push({
      message: "Sample ledger loaded — five months of realistic history to explore.",
      kind: "success",
    });
  }, [loadSample, push]);

  return (
    <div className="relative min-h-screen">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-a" />
      <div className="bg-glow bg-glow-b" />
      <div className="bg-noise" />

      <Ticker />
      <Header
        monthKey={monthKey}
        allTimeNet={allTimeNet(state)}
        onPrev={() => setMonthKey((k) => shiftMonth(k, -1))}
        onNext={() => setMonthKey((k) => shiftMonth(k, 1))}
        onToday={() => setMonthKey(currentMonthKey())}
        onAdd={openAdd}
      />

      <main className="relative z-10 mx-auto max-w-[1200px] space-y-5 px-4 pb-4 pt-6 sm:px-6">
        {state.transactions.length === 0 && (
          <Onboarding onAdd={openAdd} onLoadSample={loadSampleFromOnboarding} />
        )}

        <Reveal>
          <Overview monthKey={monthKey} />
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7" delay={60}>
            <CashflowChart monthKey={monthKey} />
          </Reveal>
          <Reveal className="lg:col-span-5" delay={140}>
            <CategoryDonut monthKey={monthKey} />
          </Reveal>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-5" delay={60}>
            <BudgetPanel monthKey={monthKey} />
          </Reveal>
          <Reveal className="lg:col-span-7" delay={140}>
            <TransactionList monthKey={monthKey} onEdit={openEdit} onAdd={openAdd} />
          </Reveal>
        </div>
      </main>

      <Footer />

      <TransactionModal open={modal.open} editing={modal.editing} onClose={closeModal} />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </FinanceProvider>
  );
}
