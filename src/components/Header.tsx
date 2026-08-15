import { ChevronLeft, ChevronRight, Plus, Wallet } from "lucide-react";
import { currentMonthKey, fmtUSD, monthLabel } from "../lib/format";

interface HeaderProps {
  monthKey: string;
  allTimeNet: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAdd: () => void;
}

export function Header({ monthKey, allTimeNet, onPrev, onNext, onToday, onAdd }: HeaderProps) {
  const isCurrent = monthKey === currentMonthKey();

  return (
    <header className="sticky top-0 z-40 border-b border-pine-700/70 bg-pine-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <div className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-mint-400/25 bg-pine-800 shadow-[0_0_20px_-6px_rgba(87,227,155,0.55)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-bold tracking-tight text-moss-100">
              Ledgerline
            </span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-[0.24em] text-moss-500">
              money, kept honest
            </span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-pine-700 bg-pine-850 px-3 py-1.5 lg:flex">
            <Wallet size={14} className="text-moss-500" aria-hidden />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-moss-500">
              All-time net
            </span>
            <span
              className={`font-mono text-[13px] font-semibold tabular-nums ${
                allTimeNet >= 0 ? "text-mint-400" : "text-coral-400"
              }`}
            >
              {fmtUSD(allTimeNet)}
            </span>
          </div>

          <div className="flex items-center rounded-[10px] border border-pine-700 bg-pine-850 p-1">
            <button onClick={onPrev} aria-label="Previous month" className="icon-btn">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={onToday}
              title={isCurrent ? "Viewing the current month" : "Jump back to the current month"}
              className="min-w-[112px] px-1.5 py-1 transition-colors hover:text-mint-300 sm:min-w-[128px]"
            >
              <span className="flex items-center justify-center gap-1.5 font-display text-[13.5px] font-semibold text-moss-100">
                {!isCurrent && (
                  <span className="pulse-dot h-1.5 w-1.5 flex-none rounded-full bg-gold-400" />
                )}
                {monthLabel(monthKey)}
              </span>
            </button>
            <button onClick={onNext} aria-label="Next month" className="icon-btn">
              <ChevronRight size={16} />
            </button>
          </div>

          <button onClick={onAdd} className="btn-primary px-3.5 py-2 text-[13.5px]">
            <Plus size={16} strokeWidth={2.6} aria-hidden />
            <span className="hidden sm:inline">Add transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
}
