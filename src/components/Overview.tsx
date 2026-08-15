import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useCountUp } from "../lib/hooks";
import { monthSeries, txInMonth } from "../lib/selectors";
import { fmtUSD, fmtUSD0, monthShortLabel } from "../lib/format";

function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (prev <= 0 && cur <= 0)
    return <span className="text-[11px] font-medium text-moss-500">no prior activity</span>;
  if (prev <= 0)
    return <span className="text-[11px] font-medium text-moss-400">new this month</span>;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invert ? !up : up;
  const color =
    Math.abs(pct) < 0.05 ? "text-moss-400" : good ? "text-mint-400" : "text-coral-400";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums ${color}`}>
      <Icon size={12} strokeWidth={2.6} aria-hidden />
      {Math.abs(pct).toFixed(1)}%
      <span className="font-sans font-medium tracking-normal text-moss-500">vs last mo</span>
    </span>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 168;
  const h = 46;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = (w - pad * 2) / Math.max(1, points.length - 1);
  const coords = points.map((v, i) => [
    pad + i * step,
    pad + (h - pad * 2) * (1 - (v - min) / span),
  ]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;
  const last = coords[coords.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#57e39b" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#57e39b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkfill)" />
      <path
        d={line}
        fill="none"
        stroke="#57e39b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.4" fill="#0d1812" stroke="#57e39b" strokeWidth="2" />
    </svg>
  );
}

export function Overview({ monthKey }: { monthKey: string }) {
  const { state } = useFinance();
  const series = monthSeries(state, monthKey, 6);
  const cur = series[series.length - 1];
  const prev = series[series.length - 2];

  const monthTx = txInMonth(state, monthKey);
  const incomeCount = monthTx.filter((t) => t.type === "income").length;
  const expenseCount = monthTx.filter((t) => t.type === "expense").length;

  const netAnim = useCountUp(cur.net);
  const incomeAnim = useCountUp(cur.income);
  const expenseAnim = useCountUp(cur.expenses);

  const savingsRate = cur.income > 0 ? (cur.net / cur.income) * 100 : null;
  const rateAnim = useCountUp(savingsRate ?? 0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-12" aria-label="Monthly overview">
      {/* Net balance — the headline figure */}
      <div className="card card-hover relative overflow-hidden p-5 sm:p-6 lg:col-span-5">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #2e7d57, transparent 70%)" }}
        />
        <p className="label flex items-center gap-2">
          <span className="tick bg-mint-400" />
          Net balance · {monthShortLabel(monthKey)}
        </p>
        <p
          className={`mt-2.5 font-mono text-[34px] font-bold leading-none tracking-tight tabular-nums sm:text-[42px] ${
            cur.net >= 0 ? "text-moss-100" : "text-coral-400"
          }`}
        >
          {fmtUSD(netAnim)}
        </p>
        <div className="mt-2.5">
          <Delta cur={cur.net} prev={prev.net} />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-mint-400/20 bg-mint-400/10 px-2 py-1 font-mono text-[11.5px] font-semibold tabular-nums text-mint-400">
              +{fmtUSD0(cur.income)} in
            </span>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-coral-400/20 bg-coral-400/10 px-2 py-1 font-mono text-[11.5px] font-semibold tabular-nums text-coral-400">
              &minus;{fmtUSD0(cur.expenses)} out
            </span>
          </div>
          <div className="text-right">
            <Sparkline points={series.map((s) => s.net)} />
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-moss-500">
              6-month net trend
            </p>
          </div>
        </div>
      </div>

      {/* Income */}
      <div className="card card-hover flex flex-col p-5 sm:p-6">
        <p className="label flex items-center gap-2">
          <span className="tick bg-mint-400" />
          Income
        </p>
        <p className="mt-2.5 font-mono text-[26px] font-bold leading-none tabular-nums text-moss-100">
          {fmtUSD(incomeAnim)}
        </p>
        <div className="mt-2.5">
          <Delta cur={cur.income} prev={prev.income} />
        </div>
        <p className="mt-auto pt-4 text-[12px] text-moss-500">
          {incomeCount === 0
            ? "Nothing earned yet"
            : `${incomeCount} deposit${incomeCount === 1 ? "" : "s"} this month`}
        </p>
      </div>

      {/* Spending */}
      <div className="card card-hover flex flex-col p-5 sm:p-6">
        <p className="label flex items-center gap-2">
          <span className="tick bg-coral-400" />
          Spending
        </p>
        <p className="mt-2.5 font-mono text-[26px] font-bold leading-none tabular-nums text-moss-100">
          {fmtUSD(expenseAnim)}
        </p>
        <div className="mt-2.5">
          <Delta cur={cur.expenses} prev={prev.expenses} invert />
        </div>
        <p className="mt-auto pt-4 text-[12px] text-moss-500">
          {expenseCount === 0
            ? "Nothing spent yet"
            : `${expenseCount} payment${expenseCount === 1 ? "" : "s"} this month`}
        </p>
      </div>

      {/* Savings rate */}
      <div className="card card-hover flex flex-col p-5 sm:p-6">
        <p className="label flex items-center gap-2">
          <span className="tick bg-gold-400" />
          Savings rate
        </p>
        <p className="mt-2.5 font-mono text-[26px] font-bold leading-none tabular-nums text-moss-100">
          {savingsRate === null ? "—" : `${rateAnim.toFixed(1)}%`}
        </p>
        <div className="mt-2.5">
          <span className="text-[11px] font-medium text-moss-500">of income kept</span>
        </div>
        <div className="mt-auto pt-4">
          <div className="relative h-[6px] w-full overflow-hidden rounded-full border border-pine-700/60 bg-pine-950/80">
            <div
              className="bar-fill h-full rounded-full bg-gold-400"
              style={{
                width: `${mounted ? Math.max(0, Math.min(100, ((savingsRate ?? 0) / 20) * 100)) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-moss-500">
            goal: keep <span className="font-mono font-semibold text-gold-400">20%</span> of income
          </p>
        </div>
      </div>
    </section>
  );
}
