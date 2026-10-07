import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarBlank,
  Clock,
  Copy,
  Download,
  MagnifyingGlass,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import {
  CATEGORIES,
  CATEGORY_MAP,
  CURRENCY_SYMBOL,
  formatMoney,
} from "../constants";
import type {
  CategoryId,
  Currency,
  LedgerFilterState,
  Transaction,
} from "../types";

interface Props {
  transactions: Transaction[];
  currency: Currency;
  filter: LedgerFilterState;
  onFilter: (f: LedgerFilterState) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: Transaction) => void;
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function DailyLedgerDashboard({
  transactions,
  currency,
  filter,
  onFilter,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    let list = transactions.filter((t) => {
      if (filter.category !== "all" && t.category !== filter.category) return false;
      if (filter.currency !== "all" && t.currency !== filter.currency) return false;
      if (filter.source === "manual" && t.isSimulated) return false;
      if (filter.source === "simulated" && !t.isSimulated) return false;
      if (q) {
        const hay = `${t.note} ${t.merchant ?? ""} ${(t.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      if (filter.sort === "largest") return b.amount - a.amount;
      if (filter.sort === "oldest") return +new Date(a.timestamp) - +new Date(b.timestamp);
      return +new Date(b.timestamp) - +new Date(a.timestamp);
    });
    return list;
  }, [transactions, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((t) => {
      const k = dayKey(t.timestamp);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return [...map.entries()];
  }, [filtered]);

  function exportCsv() {
    const header = ["Date", "Time", "Category", "Note", "Merchant", "Amount", "Currency", "Source"];
    const rows = filtered.map((t) => [
      new Date(t.timestamp).toISOString().slice(0, 10),
      timeOf(t.timestamp),
      CATEGORY_MAP[t.category]?.label ?? t.category,
      t.note.replace(/,/g, " "),
      (t.merchant ?? "").replace(/,/g, " "),
      t.amount,
      t.currency,
      t.isSimulated ? "Auto" : "Manual",
    ]);
    const NL = String.fromCharCode(10);
    const csv = [header, ...rows].map((r) => r.join(",")).join(NL);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const set = (patch: Partial<LedgerFilterState>) => onFilter({ ...filter, ...patch });

  return (
    <section className="overflow-hidden rounded-md border-2 border-stone-300 bg-[#fbf8f1] shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 bg-[#10203b] px-5 py-4 text-stone-100">
        <div className="flex items-center gap-2">
          <CalendarBlank size={20} weight="duotone" className="text-amber-300" />
          <div>
            <h2 className="font-display text-lg font-semibold">Daily Ledger</h2>
            <p className="text-[11px] uppercase tracking-widest text-stone-300/70">Chronological Feed of Debits</p>
          </div>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-sm border border-stone-600 bg-stone-900/40 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:bg-stone-700/60 active:scale-95">
          <Download size={14} weight="bold" /> Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-300 bg-stone-50 px-5 py-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-sm border border-stone-300 bg-white px-3 py-1.5">
          <MagnifyingGlass size={16} className="text-stone-400" />
          <input
            value={filter.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search notes, merchants, tags…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select value={filter.category} onChange={(e) => set({ category: e.target.value as CategoryId | "all" })}
          className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filter.currency} onChange={(e) => set({ currency: e.target.value as Currency | "all" })}
          className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none">
          <option value="all">All currencies</option>
          <option value="NGN">₦ NGN</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
        <select value={filter.source} onChange={(e) => set({ source: e.target.value as LedgerFilterState["source"] })}
          className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none">
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="simulated">Auto</option>
        </select>
        <select value={filter.sort} onChange={(e) => set({ sort: e.target.value as LedgerFilterState["sort"] })}
          className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="largest">Largest amount</option>
        </select>
      </div>

      {/* Feed */}
      <div className="max-h-[70vh] overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-lg text-stone-500">No entries match your ledger query.</p>
            <p className="mt-1 text-sm text-stone-400">Adjust the filters above or record a new expenditure.</p>
          </div>
        ) : (
          groups.map(([key, items]) => {
            const dayTotal = items.reduce((s, t) => s + t.amount * (t.currency === currency ? 1 : 1), 0);
            const open = expanded[key] ?? true;
            return (
              <div key={key} className="border-b border-stone-200 last:border-0">
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [key]: !open }))}
                  className="flex w-full items-center justify-between bg-stone-100/70 px-5 py-2.5 text-left transition hover:bg-stone-200/70"
                >
                  <span className="font-display text-sm font-semibold text-[#10203b]">
                    {dayLabel(items[0].timestamp)}
                  </span>
                  <span className="tabular text-sm font-semibold text-rose-800">
                    {formatMoney(dayTotal, currency)} · {items.length} entr{items.length === 1 ? "y" : "ies"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {items.map((t) => (
                        <LedgerRow
                          key={t.id}
                          tx={t}
                          currency={currency}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onDuplicate={onDuplicate}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function LedgerRow({
  tx,
  currency,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  tx: Transaction;
  currency: Currency;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: Transaction) => void;
}) {
  const meta = CATEGORY_MAP[tx.category];
  const Icon = meta?.icon ?? CalendarBlank;
  const shown = tx.currency === currency ? tx.amount : tx.amount;
  return (
    <div className="group flex items-center gap-3 border-t border-dashed border-stone-200 bg-white px-5 py-2.5 transition hover:bg-amber-50/40">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${meta?.tint ?? "bg-stone-100 text-stone-600 border-stone-300"}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-[15px] font-medium text-[#1a2b45]">{tx.note}</p>
          {tx.isSimulated && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Auto</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Clock size={11} weight="bold" />
          <span className="tabular">{timeOf(tx.timestamp)}</span>
          {tx.merchant && <><span className="text-stone-300">·</span><span className="truncate">{tx.merchant}</span></>}
          {meta && <><span className="text-stone-300">·</span><span>{meta.label}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={() => onEdit(tx)} title="Edit" className="rounded-sm p-1.5 text-stone-500 hover:bg-stone-200 hover:text-[#10203b] active:scale-90">
          <PencilSimple size={15} weight="bold" />
        </button>
        <button onClick={() => onDuplicate(tx)} title="Duplicate" className="rounded-sm p-1.5 text-stone-500 hover:bg-stone-200 hover:text-[#10203b] active:scale-90">
          <Copy size={15} weight="bold" />
        </button>
        <button onClick={() => onDelete(tx.id)} title="Delete" className="rounded-sm p-1.5 text-stone-500 hover:bg-rose-100 hover:text-rose-700 active:scale-90">
          <Trash size={15} weight="bold" />
        </button>
      </div>
      <div className="tabular w-28 shrink-0 text-right font-display text-lg font-semibold text-rose-800">
        <span className="mr-0.5 text-sm text-stone-400">{CURRENCY_SYMBOL[tx.currency]}</span>
        {formatMoney(shown, tx.currency).replace(CURRENCY_SYMBOL[tx.currency], "")}
      </div>
    </div>
  );
}