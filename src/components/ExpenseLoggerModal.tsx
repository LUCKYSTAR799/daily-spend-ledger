import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Coins, NotePencil, X } from "@phosphor-icons/react";
import {
  CATEGORIES,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
  DEFAULT_CURRENCY,
  formatMoney,
} from "../constants";
import type { CategoryId, Currency, Transaction } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (tx: Transaction) => void;
  editing?: Transaction | null;
  defaultCurrency: Currency;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toLocalTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExpenseLoggerModal({
  open,
  onClose,
  onSubmit,
  editing,
  defaultCurrency,
}: Props) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [category, setCategory] = useState<CategoryId>("food");
  const [date, setDate] = useState(toLocalInput(new Date()));
  const [time, setTime] = useState(toLocalTime(new Date()));
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const d = new Date(editing.timestamp);
      setAmount(String(editing.amount));
      setCurrency(editing.currency);
      setCategory(editing.category);
      setDate(toLocalInput(d));
      setTime(toLocalTime(d));
      setNote(editing.note);
      setMerchant(editing.merchant ?? "");
      setTags((editing.tags ?? []).join(", "));
    } else {
      const now = new Date();
      setAmount("");
      setCurrency(defaultCurrency);
      setCategory("food");
      setDate(toLocalInput(now));
      setTime(toLocalTime(now));
      setNote("");
      setMerchant("");
      setTags("");
    }
    setError(null);
  }, [open, editing, defaultCurrency]);

  const preview = useMemo(() => {
    const n = parseFloat(amount);
    if (!isFinite(n) || n <= 0) return null;
    return formatMoney(n, currency);
  }, [amount, currency]);

  function submit() {
    const n = parseFloat(amount);
    if (!isFinite(n) || n <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!note.trim()) {
      setError("A short description is required for the ledger.");
      return;
    }
    const when = new Date(`${date}T${time || "00:00"}`);
    if (isNaN(when.getTime())) {
      setError("Invalid date or time.");
      return;
    }
    const tx: Transaction = {
      id: editing ? editing.id : `user-${Date.now()}`,
      amount: Math.round(n * 100) / 100,
      currency,
      category,
      timestamp: when.toISOString(),
      note: note.trim(),
      merchant: merchant.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isSimulated: editing ? editing.isSimulated : false,
      receiptRef: editing?.receiptRef ?? `RC-${String(Date.now()).slice(-5)}`,
    };
    onSubmit(tx);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1626]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg border-2 border-stone-300 bg-[#fbf8f1] shadow-2xl sm:rounded-lg"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-300 bg-[#10203b] px-5 py-4 text-stone-100">
              <div className="flex items-center gap-2">
                <NotePencil size={20} weight="duotone" className="text-amber-300" />
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {editing ? "Amend Ledger Entry" : "Record Expenditure"}
                  </h2>
                  <p className="text-[11px] uppercase tracking-widest text-stone-300/70">
                    Double-entry style record
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-sm p-1.5 text-stone-300 hover:bg-stone-700/60 active:scale-95">
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Amount */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Amount
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex flex-1 items-center rounded-sm border-2 border-stone-300 bg-white focus-within:border-[#10203b]">
                    <span className="tabular px-3 font-display text-2xl text-stone-400">
                      {CURRENCY_SYMBOL[currency]}
                    </span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder="0.00"
                      className="tabular w-full bg-transparent py-2.5 pr-3 font-display text-2xl outline-none"
                    />
                  </div>
                  <div className="flex rounded-sm border-2 border-stone-300 bg-white p-1">
                    {(["NGN", "USD", "EUR"] as Currency[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`flex w-12 flex-col items-center justify-center rounded-sm text-xs font-semibold transition ${
                          currency === c ? "bg-[#10203b] text-amber-300" : "text-stone-500 hover:bg-stone-100"
                        }`}
                      >
                        <span className="text-base leading-none">{CURRENCY_SYMBOL[c]}</span>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {preview && (
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-emerald-700">
                    <Coins size={14} weight="bold" /> Posting <strong className="tabular">{preview}</strong>{" "}
                    ({CURRENCY_LABEL[currency]})
                  </p>
                )}
              </div>

              {/* Category chips */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
                          active ? "border-[#10203b] bg-[#10203b] text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                        }`}
                      >
                        <Icon size={15} weight={active ? "fill" : "regular"} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-sm border-2 border-stone-300 bg-white px-3 py-2 outline-none focus:border-[#10203b]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-sm border-2 border-stone-300 bg-white px-3 py-2 outline-none focus:border-[#10203b]" />
                </div>
              </div>

              {/* Note & merchant */}
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">Description</label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Morning roast &amp; bread"
                    className="w-full rounded-sm border-2 border-stone-300 bg-white px-3 py-2 outline-none focus:border-[#10203b]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">Merchant / Payee</label>
                    <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Optional"
                      className="w-full rounded-sm border-2 border-stone-300 bg-white px-3 py-2 outline-none focus:border-[#10203b]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-stone-500">Tags</label>
                    <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="commute, bill"
                      className="w-full rounded-sm border-2 border-stone-300 bg-white px-3 py-2 outline-none focus:border-[#10203b]" />
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-sm border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-stone-300 pt-4">
                <button onClick={onClose} className="rounded-sm px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200 active:scale-95">
                  Cancel
                </button>
                <button onClick={submit} className="flex items-center gap-2 rounded-sm bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95">
                  <Check size={16} weight="bold" />
                  {editing ? "Save Changes" : "Post to Ledger"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
