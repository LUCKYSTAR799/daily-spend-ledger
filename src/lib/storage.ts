import {
  DEFAULT_BUDGET_NGN,
  DEFAULT_CURRENCY,
  SEED_TRANSACTIONS,
} from "../constants";
import type { Currency, MonthlyBudget, SimState, Transaction } from "../types";

const K = {
  tx: "ledger.transactions.v1",
  currency: "ledger.currency.v1",
  budget: "ledger.budget.v1",
  sim: "ledger.sim.v1",
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTransactions(): Transaction[] {
  const raw = localStorage.getItem(K.tx);
  if (raw === null) {
    localStorage.setItem(K.tx, JSON.stringify(SEED_TRANSACTIONS));
    return [...SEED_TRANSACTIONS];
  }
  return safeParse<Transaction[]>(raw, []);
}

export function saveTransactions(list: Transaction[]): void {
  localStorage.setItem(K.tx, JSON.stringify(list));
}

export function loadCurrency(): Currency {
  return safeParse<Currency>(localStorage.getItem(K.currency), DEFAULT_CURRENCY);
}

export function saveCurrency(c: Currency): void {
  localStorage.setItem(K.currency, JSON.stringify(c));
}

export function loadBudget(): MonthlyBudget {
  const stored = safeParse<MonthlyBudget | null>(
    localStorage.getItem(K.budget),
    null
  );
  if (stored && typeof stored.amount === "number") return stored;
  return { amount: DEFAULT_BUDGET_NGN, currency: "NGN" };
}

export function saveBudget(b: MonthlyBudget): void {
  localStorage.setItem(K.budget, JSON.stringify(b));
}

export function loadSim(): SimState {
  return safeParse<SimState>(localStorage.getItem(K.sim), {
    active: false,
    speedMs: 8000,
    lastRun: null,
    count: 0,
  });
}

export function saveSim(s: SimState): void {
  localStorage.setItem(K.sim, JSON.stringify(s));
}
