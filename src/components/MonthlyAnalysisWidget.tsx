import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChartBar,
  Gauge,
  Printer,
  Receipt,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react";
import {
  CATEGORIES,
  CATEGORY_MAP,
  convert,
  formatMoney,
} from "../constants";
import type { Currency, MonthlyBudget, Transaction } from "../types";

interface Props {
  transactions: Transaction[];
  currency: Currency;
  budget: MonthlyBudget;
  onBudget: (b: MonthlyBudget) => void;
}

export default function MonthlyAnalysisWidget({
  transactions,
  currency,
  budget,
  onBudget,
}: Props) {
  const [lastDayMode, setLastDayMode] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const effectiveDay = lastDayMode ? daysInMonth : dayOfMonth;

  const monthly = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [transactions, year, month]);

  const totalInCurrency = (list: Transaction[]) =>
    list.reduce((s, t) => s + convert(t.amount, t.currency, currency), 0);

  const monthTotal = totalInCurrency(monthly);
  const budgetInCurrency = convert(budget.amount, budget.currency, currency);
  const dailyAvg = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0;
  const projected = dailyAvg * daysInMonth;
  const remaining = budgetInCurrency - monthTotal;
  const pct = budgetInCurrency > 0 ? Math.min(100, (monthTotal / budgetInCurrency) * 100) : 0;
  const onTrack = projected <= budgetInCurrency;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthly.forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + convert(t.amount, t.currency, currency));
    });
    return [...map.entries()]
      .map(([id, amt]) => ({ meta: CATEGORY_MAP[id as keyof typeof CATEGORY_MAP], amt }))
      .filter((r) => r.meta)
      .sort((a, b) => b.amt - a.amt);
  }, [monthly]);

  const topCategory = byCategory[0];

  const busiestDay = useMemo(() => {
    const map = new Map<string, number>();
    monthly.forEach((t) => {
      const key = new Date(t.timestamp).toDateString();
      map.set(key, (map.get(key) ?? 0) + convert(t.amount, t.currency, currency));
    });
    let best = { label: "—", amt: 0 };
    map.forEach((amt, label) => {
      if (amt > best.amt) best = { label, amt };
    });
    return best;
  }, [monthly]);

  const statusLabel = lastDayMode
    ? onTrack
      ? "Ledger Balance On Track"
      : "Budget Warning"
    : pct > 80
      ? "Approaching Limit"
      : pct > 50
        ? "Mid-Month Pace"
        : "Comfortable Margin";

  return (
    <section className="overflow-hidden rounded-md border-2 border-stone-300 bg-[#fbf8f1] shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 bg-[#10203b] px-5 py-4 text-stone-100">
        <div className="flex items-center gap-2">
          <ChartBar size={20} weight="duotone" className="text-amber-300" />
          <div>
            <h2 className="font-display text-lg font-semibold">Monthly Analysis</h2>
            <p className="text-[11px] uppercase tracking-widest text-stone-300/70">
              {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Statement of Accounts
            </p>
          </div>
        </div>
        <button
          onClick={() => setLastDayMode((v) => !v)}
          className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
            lastDayMode
              ? "border-amber-300 bg-amber-400 text-[#10203b]"
              : "border-stone-600 bg-stone-900/40 text-stone-200 hover:bg-stone-700/60"
          }`}
        >
          <Sparkle size={14} weight="fill" />
          Last-Day-of-Month Projection
        </button>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-5">
        {/* Left: budget gauge */}
        <div className="lg:col-span-2">
          <div className="rounded-sm border border-stone-300 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                {lastDayMode ? "Projected Month-End" : "Spent This Month"}
              </span>
              <Gauge size={16} className="text-stone-400" />
            </div>
            <div className="tabular font-display mt-1 text-3xl font-semibold text-[#10203b]">
              {formatMoney(lastDayMode ? projected : monthTotal, currency)}
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full border border-stone-300 bg-stone-100">
              <motion.div
                className={`h-full ${onTrack ? "bg-emerald-600" : "bg-rose-700"}`}
                initial={{ width: 0 }}
                animate={{ width: `${lastDayMode ? Math.min(100, (projected / budgetInCurrency) * 100) : pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
              <span>Budget: {formatMoney(budgetInCurrency, currency)}</span>
              <span className={remaining >= 0 ? "text-emerald-700" : "text-rose-700"}>
                {remaining >= 0 ? "Buffer" : "Overrun"} {formatMoney(Math.abs(remaining), currency)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-sm bg-stone-50 px-3 py-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${onTrack ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {statusLabel}
              </span>
              <button onClick={() => window.print()} className="ml-auto flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-[#10203b]">
                <Printer size={14} weight="bold" /> Print
              </button>
            </div>

            {/* budget editor */}
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-stone-500">Set budget</label>
              <div className="flex flex-1 items-center rounded-sm border border-stone-300 bg-white px-2">
                <span className="tabular text-stone-400">{budget.currency === "NGN" ? "₦" : budget.currency === "USD" ? "$": "€"}</span>
                <input
                  inputMode="numeric"
                  value={budget.amount}
                  onChange={(e) =>
                    onBudget({ amount: Math.max(0, Math.round(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)), currency: budget.currency })
                  }
                  className="tabular w-full bg-transparent px-1 py-1 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Daily Average" value={formatMoney(dailyAvg, currency)} icon={<TrendUp size={15} />} />
            <MiniStat label="Entries" value={String(monthly.length)} icon={<Receipt size={15} />} />
          </div>
        </div>

        {/* Right: category breakdown */}
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500">Category Distribution</h3>
            {topCategory && (
              <span className="text-xs text-stone-500">
                Top: <strong className="text-[#10203b]">{topCategory.meta.label}</strong>
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {byCategory.length === 0 && (
              <p className="rounded-sm border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-400">
                No entries recorded this month yet.
              </p>
            )}
            {byCategory.map((row, i) => {
              const share = monthTotal > 0 ? (row.amt / monthTotal) * 100 : 0;
              const Icon = row.meta.icon;
              return (
                <div key={row.meta.id} className="rounded-sm border border-stone-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${row.meta.tint} border`}>
                      <Icon size={13} />
                    </span>
                    <span className="font-medium text-stone-700">{row.meta.label}</span>
                    <span className="tabular ml-auto font-semibold text-[#10203b]">{formatMoney(row.amt, currency)}</span>
                    <span className="tabular w-12 text-right text-xs text-stone-400">{share.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <motion.div
                      className={`h-full ${row.meta.dot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {busiestDay.amt > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <Sparkle size={16} weight="fill" />
              <span>
                Highest spending day: <strong>{busiestDay.label}</strong> at{" "}
                <strong className="tabular">{formatMoney(busiestDay.amt, currency)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-stone-300 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-stone-500">
        <span className="text-stone-400">{icon}</span>
        {label}
      </div>
      <div className="tabular font-display mt-0.5 text-lg font-semibold text-[#10203b]">{value}</div>
    </div>
  );
}
