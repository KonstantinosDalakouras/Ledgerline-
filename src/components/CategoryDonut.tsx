import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useFinance } from "../context/FinanceContext";
import { useCountUp, useReducedMotion } from "../lib/hooks";
import { expensesByCategory, txInMonth } from "../lib/selectors";
import { getCategory } from "../lib/categories";
import { fmtUSD, monthLabel, round2 } from "../lib/format";

interface SliceDatum {
  name: string;
  value: number;
  color: string;
}

function DonutTooltip(props: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: SliceDatum }>;
}) {
  const { active, payload } = props;
  const d = payload?.[0];
  if (!active || !d) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] border border-pine-600 bg-pine-900/95 px-3.5 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.payload?.color }} />
      <span className="text-[12.5px] font-medium text-moss-300">{d.name}</span>
      <span className="font-mono text-[12.5px] font-semibold tabular-nums text-moss-100">
        {fmtUSD(d.value ?? 0)}
      </span>
    </div>
  );
}

export function CategoryDonut({ monthKey }: { monthKey: string }) {
  const { state } = useFinance();
  const reduced = useReducedMotion();

  const slices = expensesByCategory(txInMonth(state, monthKey));
  const total = round2(slices.reduce((acc, s) => acc + s.value, 0));
  const totalAnim = useCountUp(total);

  const data: SliceDatum[] = slices.map((s) => {
    const cat = getCategory(s.id);
    return { name: cat.label, value: s.value, color: cat.color };
  });

  return (
    <div className="card h-full p-5 sm:p-6">
      <header className="mb-5">
        <p className="label flex items-center gap-2">
          <span className="tick bg-gold-400" />
          Breakdown
        </p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-moss-100">
          Where the money went
        </h2>
      </header>

      {data.length === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
          <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden>
            <circle
              cx="46"
              cy="46"
              r="36"
              fill="none"
              stroke="rgba(139,163,146,0.28)"
              strokeWidth="10"
              strokeDasharray="5 8"
              strokeLinecap="round"
            />
          </svg>
          <p className="max-w-[240px] text-[13px] leading-relaxed text-moss-500">
            No spending recorded in {monthLabel(monthKey)}. Enjoy it while it lasts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
          <div className="relative h-[196px] w-[196px] flex-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={2.5}
                  cornerRadius={5}
                  stroke="none"
                  isAnimationActive={!reduced}
                  animationDuration={800}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-moss-500">
                  Spent
                </p>
                <p className="font-mono text-[17px] font-bold tabular-nums text-moss-100">
                  {fmtUSD(totalAnim)}
                </p>
              </div>
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 self-center">
            {data.map((d, i) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <li
                  key={d.name}
                  className="row-in group flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition-colors hover:bg-pine-800/70"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-[3px]"
                    style={{ background: d.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-moss-300 transition-colors group-hover:text-moss-100">
                    {d.name}
                  </span>
                  <span className="font-mono text-[12.5px] tabular-nums text-moss-200">
                    {fmtUSD(d.value)}
                  </span>
                  <span className="w-10 text-right font-mono text-[11px] tabular-nums text-moss-500">
                    {pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
