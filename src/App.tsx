import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { motion } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import LedgerHeader from "./components/LedgerHeader";
import MonthlyAnalysisWidget from "./components/MonthlyAnalysisWidget";
import DailyLedgerDashboard from "./components/DailyLedgerDashboard";
import ExpenseLoggerModal from "./components/ExpenseLoggerModal";
import { BRAND_NAME, BRAND_SUB, buildSimulatedTransaction, convert } from "./constants";
import {
  loadBudget,
  loadCurrency,
  loadSim,
  loadTransactions,
  saveBudget,
  saveCurrency,
  saveSim,
  saveTransactions,
} from "./lib/storage";
import type {
  Currency,
  LedgerFilterState,
  MonthlyBudget,
  SimState,
  Transaction,
} from "./types";

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [currency, setCurrency] = useState<Currency>(() => loadCurrency());
  const [budget, setBudget] = useState<MonthlyBudget>(() => loadBudget());
  const [sim, setSim] = useState<SimState>(() => loadSim());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<LedgerFilterState>({
    search: "",
    category: "all",
    currency: "all",
    source: "all",
    sort: "newest",
  });

  // persistence
  useEffect(() => saveTransactions(transactions), [transactions]);
  useEffect(() => saveCurrency(currency), [currency]);
  useEffect(() => saveBudget(budget), [budget]);
  useEffect(() => saveSim(sim), [sim]);

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
  }, []);

  const handleSubmit = useCallback(
    (tx: Transaction) => {
      setTransactions((prev) => {
        const exists = prev.some((p) => p.id === tx.id);
        return exists ? prev.map((p) => (p.id === tx.id ? tx : p)) : [tx, ...prev];
      });
      toast.success(editing ? "Ledger entry amended." : "Expenditure recorded to the ledger.", {
        description: `${tx.note}`,
      });
      setEditing(null);
    },
    [editing]
  );

  const openNew = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((t: Transaction) => {
    setEditing(t);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((p) => p.id !== id));
    toast.error("Entry removed from the ledger.");
  }, []);

  const handleDuplicate = useCallback((t: Transaction) => {
    const copy: Transaction = {
      ...t,
      id: `user-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSimulated: false,
      receiptRef: `RC-${String(Date.now()).slice(-5)}`,
    };
    setTransactions((prev) => [copy, ...prev]);
    toast.success("Entry duplicated to today.");
  }, []);

  const tick = useCallback(() => {
    const tx = buildSimulatedTransaction();
    setTransactions((prev) => [tx, ...prev]);
    setSim((prev) => ({ ...prev, lastRun: Date.now(), count: prev.count + 1 }));
    toast.info(`Auto-Ledger: ${tx.merchant} · ${tx.note}`, { duration: 2200 });
  }, []);

  // simulation interval
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!sim.active) return;
    const id = setInterval(() => tickRef.current(), sim.speedMs);
    return () => clearInterval(id);
  }, [sim.active, sim.speedMs]);

  // keyboard shortcut N
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNew]);

  const { todayTotal, monthTotal, count } = useMemo(() => {
    const now = new Date();
    let today = 0;
    let month = 0;
    transactions.forEach((t) => {
      const d = new Date(t.timestamp);
      const val = convert(t.amount, t.currency, currency);
      if (d.toDateString() === now.toDateString()) today += val;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) month += val;
    });
    return { todayTotal: today, monthTotal: month, count: transactions.length };
  }, [transactions, currency]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LedgerHeader
        currency={currency}
        onCurrency={setCurrency}
        sim={sim}
        onToggleSim={() => setSim((p) => ({ ...p, active: !p.active }))}
        onTickNow={tick}
        todayTotal={todayTotal}
        monthTotal={monthTotal}
        count={count}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <MonthlyAnalysisWidget
            transactions={transactions}
            currency={currency}
            budget={budget}
            onBudget={setBudget}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <DailyLedgerDashboard
            transactions={transactions}
            currency={currency}
            filter={filter}
            onFilter={setFilter}
            onEdit={openEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </motion.div>

        <footer className="border-t border-stone-300 py-6 text-center text-xs text-stone-500">
          <p className="font-display text-sm text-stone-600">{BRAND_NAME} · {BRAND_SUB}</p>
          <p className="mt-1">Records stored locally in your browser. Press <kbd className="rounded border border-stone-300 bg-white px-1">N</kbd> to record a new entry.</p>
        </footer>
      </main>

      {/* Floating record button */}
      <motion.button
        onClick={openNew}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-4 font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-800"
      >
        <Plus size={22} weight="bold" />
        <span className="hidden sm:inline">New Entry</span>
      </motion.button>

      <ExpenseLoggerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        editing={editing}
        defaultCurrency={currency}
      />

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}