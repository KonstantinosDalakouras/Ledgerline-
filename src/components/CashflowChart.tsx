import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinance } from "../context/FinanceContext";
import { useReducedMotion } from "../lib/hooks";
import { monthSeries, type MonthPoint } from "../lib/selectors";
import { fmtCompactUSD, fmtUSD, monthLabel } from "../lib/format";

function CashflowTooltip(props: { active?: boolean; payload?: Array<{ payload?: MonthPoint }> }) {
  const { active, payload } = props;
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-[10px] border border-pine-600 bg-pine-900/95 px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm">
      <p className="mb-2 font-display text-[12.5px] font-semibold text-moss-200">
        {monthLabel(point.key)}
      </p>
      <div className="space-y-1 font-mono text-[12px] tabular-nums">
        <p className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 font-sans text-moss-400">
            <span className="h-2 w-2 rounded-[2.5px] bg-mint-400" /> Income
          </span>
          <span className="font-semibold text-mint-400">{fmtUSD(point.income)}</span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 font-sans text-moss-400">
            <span className="h-2 w-2 rounded-[2.5px] bg-coral-400" /> Spending
          </span>
          <span className="font-semibold text-coral-400">{fmtUSD(point.expenses)}</span>
        </p>
        <p className="mt-1.5 flex items-center justify-between gap-6 border-t border-pine-700 pt-1.5">
          <span className="font-sans text-moss-400">Net</span>
          <span className={`font-semibold ${point.net >= 0 ? "text-moss-100" : "text-coral-400"}`}>
            {fmtUSD(point.net)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function CashflowChart({ monthKey }: { monthKey: string }) {
  const { state } = useFinance();
  const reduced = useReducedMotion();
  const data = monthSeries(state, monthKey, 6);
  const hasActivity = data.some((d) => d.income > 0 || d.expenses > 0);

  return (
    <div className="card h-full p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label flex items-center gap-2">
            <span className="tick bg-sky-400" />
            Cashflow
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-moss-100">
            Income vs spending
          </h2>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-moss-400">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-mint-400" /> Income
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-moss-400">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-coral-400" /> Spending
          </span>
          <span className="hidden rounded-md border border-pine-700 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider text-moss-500 sm:inline">
            6 mo
          </span>
        </div>
      </header>

      <div className="relative h-[264px]">
        {!hasActivity && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <p className="rounded-lg border border-pine-700 bg-pine-900/80 px-4 py-2 text-[13px] text-moss-400">
              No cashflow in this window yet — add a transaction to light it up.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, left: -6, bottom: 0 }} barGap={5}>
            <CartesianGrid strokeDasharray="3 5" stroke="rgba(139,163,146,0.13)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "rgba(139,163,146,0.18)" }}
              tick={{ fill: "#8ba392", fontSize: 11.5, fontFamily: "JetBrains Mono, monospace" }}
              dy={6}
            />
            <YAxis
              tickFormatter={(v: number) => fmtCompactUSD(v)}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "#64796b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            />
            <Tooltip content={<CashflowTooltip />} cursor={{ fill: "rgba(139,163,146,0.07)" }} />
            <Bar
              dataKey="income"
              name="Income"
              fill="#57e39b"
              radius={[5, 5, 0, 0]}
              maxBarSize={26}
              isAnimationActive={!reduced}
              animationDuration={750}
            />
            <Bar
              dataKey="expenses"
              name="Spending"
              fill="#ff7a6c"
              radius={[5, 5, 0, 0]}
              maxBarSize={26}
              isAnimationActive={!reduced}
              animationDuration={750}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
