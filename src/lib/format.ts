const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const fmtUSD = (n: number) => usd2.format(n);
export const fmtUSD0 = (n: number) => usd0.format(n);
export const fmtCompactUSD = (n: number) => `$${compact.format(n)}`;

export const fmtSigned = (type: "income" | "expense", amount: number) =>
  type === "income" ? `+${usd2.format(amount)}` : `\u2212${usd2.format(amount)}`;

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/* ---------------- dates ---------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const parseISO = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
};

export const monthKeyOf = (iso: string) => iso.slice(0, 7);

export const currentMonthKey = () => monthKeyOf(todayISO());

export const shiftMonth = (key: string, delta: number): string => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y ?? 2026, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export const monthShortLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

/** Month keys old -> new, ending at endKey (inclusive). */
export const lastNMonthKeys = (endKey: string, n: number): string[] => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(shiftMonth(endKey, -i));
  return out;
};

export const dayLabel = (iso: string): string => {
  const today = todayISO();
  if (iso === today) return "Today";
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  if (iso === toISO(yd)) return "Yesterday";
  return parseISO(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/* ---------------- export ---------------- */

export function buildCSV(
  transactions: { date: string; type: string; categoryId: string; note: string; amount: number }[],
  labelOf: (id: string) => string,
): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Type", "Category", "Note", "Amount"].join(","),
    ...[...transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) =>
        [
          t.date,
          t.type,
          esc(labelOf(t.categoryId)),
          esc(t.note),
          (t.type === "expense" ? -t.amount : t.amount).toFixed(2),
        ].join(","),
      ),
  ];
  return rows.join("\n");
}

export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
