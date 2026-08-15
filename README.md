# Ledgerline · Personal Finance Dashboard

A local-first personal finance dashboard. Track income and expenses, visualize spending habits, and set monthly budget goals — all data stays in your browser.

![Built with](https://img.shields.io/badge/React-18-57e39b) ![TypeScript](https://img.shields.io/badge/TypeScript-5-56c9dd) ![Vite](https://img.shields.io/badge/Vite-6-ffc25e) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-8fd3ff) ![Recharts](https://img.shields.io/badge/Recharts-2-ff7a6c)

## Features

- **Income & expense tracking** — add, edit, and delete transactions with categories, notes, and dates. Deletes are undoable.
- **Month navigation** — scrub through any month; every panel (stats, charts, budgets, ledger) follows.
- **Cashflow chart** — six months of income vs. spending as grouped bars with rich tooltips.
- **Category breakdown** — animated donut of where the money went, with a live legend.
- **Monthly budget goals** — per-category budgets with animated usage bars, over-budget warnings (`+ $ over`), inline editing (Enter to save, Esc to cancel), and one-click budgeting for untracked categories.
- **Overview tiles** — net balance with a 6-month sparkline, income, spending, and savings rate (with a 20% goal marker), each with deltas vs. the previous month.
- **Searchable ledger** — full-text search, category filter, day-grouped entries with daily net.
- **CSV export** — take your whole ledger with you.
- **Starts at zero** — no seed data, ever. First launch greets you with a guided "day zero" panel; a realistic five-month sample ledger can be loaded (and replaced or wiped) anytime from the footer.
- **Local-first persistence** — everything is stored in `localStorage` and nowhere else.
- **Accessible motion** — count-ups, scroll reveals, and chart animations all respect `prefers-reduced-motion`.

## Tech stack

| Layer      | Tool                                    |
| ---------- | --------------------------------------- |
| UI         | React + TypeScript                      |
| Build      | Vite 6                                  |
| Styling    | Tailwind CSS 4 (custom design tokens)   |
| Charts     | Recharts                                |
| Icons      | lucide-react (inline SVG)               |
| State      | Context + `useReducer`, localStorage    |

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build → dist/
npm run typecheck # strict TypeScript check
```

## Project structure

```
├── index.html                 # fonts, favicon, meta
├── package.json               # scripts & deps
├── vite.config.js             # Vite + React + Tailwind v4
├── tsconfig.json              # strict TypeScript
├── .gitignore
└── src/
    ├── main.tsx               # React entry point
    ├── App.tsx                # shell: ticker, header, onboarding, sections, footer, modal
    ├── index.css              # Tailwind v4 theme tokens + design system
    ├── types.ts               # Transaction, Budgets, FinanceState
    ├── context/
    │   └── FinanceContext.tsx # reducer + localStorage persistence (starts at $0.00)
    ├── lib/
    │   ├── categories.tsx     # 14 categories: colors, labels, inline SVG icons
    │   ├── seed.ts            # deterministic 5-month sample-data generator (opt-in)
    │   ├── selectors.ts       # monthly aggregates, series, category slices
    │   ├── format.ts          # currency/date formatters, CSV builder, download
    │   └── hooks.ts           # useCountUp, useReducedMotion, body scroll lock
    └── components/
        ├── Header.tsx         # brand, all-time net, month navigator, add CTA
        ├── Overview.tsx       # net tile + sparkline, income, spending, savings rate
        ├── CashflowChart.tsx  # 6-month income vs. spending (Recharts bars)
        ├── CategoryDonut.tsx  # spending donut + live legend
        ├── BudgetPanel.tsx    # inline budget goals, usage bars, over-budget states
        ├── TransactionList.tsx# search, filter, day-grouped ledger, edit/delete + undo
        ├── TransactionModal.tsx# add/edit form with validation
        ├── Toasts.tsx         # toast system with undo actions
        └── Reveal.tsx         # IntersectionObserver scroll reveal
```

```


