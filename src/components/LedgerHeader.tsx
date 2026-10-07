import { motion } from "framer-motion";
import {
  ArrowClockwise,
  CalendarBlank,
  Coins,
  FastForward,
  Pause,
  Play,
  Wallet,
} from "@phosphor-icons/react";
import type { Currency, SimState } from "../types";
import {
  BRAND_NAME,
  BRAND_SUB,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
  formatMoney,
} from "../constants";

interface Props {
  currency: Currency;
  onCurrency: (c: Currency) => void;
  sim: SimState;
  onToggleSim: () => void;
  onTickNow: () => void;
  todayTotal: number;
  monthTotal: number;
  count: number;
}

const CURRENCIES: Currency[] = ["NGN", "USD", "EUR"];

export default function LedgerHeader({
  currency,
  onCurrency,
  sim,
  onToggleSim,
  onTickNow,
  todayTotal,
  monthTotal,
  count,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="border-b-2 border-stone-300 bg-[#10203b] text-stone-100 shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-sm border border-amber-300/40 bg-amber-400/10 text-amber-300">
              <Wallet size={26} weight="duotone" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {BRAND_NAME}
              </h1>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-300/80">
                {BRAND_SUB}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-sm border border-stone-600/60 bg-stone-900/40 p-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onCurrency(c)}
                  className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                    currency === c
                      ? "bg-amber-400 text-[#10203b] shadow-sm"
                      : "text-stone-300 hover:bg-stone-700/60"
                  }`}
                >
                  <span className="tabular text-base leading-none">{CURRENCY_SYMBOL[c]}</span>
                  <span className="hidden sm:inline">{CURRENCY_LABEL[c]}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-stone-600/60 bg-stone-900/40 px-3 py-2 text-sm text-stone-300">
              <CalendarBlank size={16} weight="bold" />
              <span className="hidden sm:inline">{today}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Statistics ribbon */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-stone-600/50 bg-stone-600/50 sm:grid-cols-4">
          <Stat label="Today&apos;s Outlay" value={formatMoney(todayTotal, currency)} accent="text-amber-300" />
          <Stat label="Monthly Total" value={formatMoney(monthTotal, currency)} accent="text-rose-300" />
          <Stat label="Entries Recorded" value={String(count)} accent="text-emerald-300" />
          <div className="flex flex-col justify-center bg-[#13264a] px-3 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400">
              <Coins size={12} weight="bold" /> Auto-Ledger
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleSim}
                className={`flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold transition active:scale-95 ${
                  sim.active
                    ? "bg-emerald-500 text-[#0c1c14]"
                    : "bg-stone-700 text-stone-200 hover:bg-stone-600"
                }`}
              >
                {sim.active ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
                {sim.active ? "Active" : "Paused"}
              </button>
              <button
                onClick={onTickNow}
                title="Simulate one transaction now"
                className="flex items-center gap-1 rounded-sm bg-stone-700 px-2 py-1 text-xs font-semibold text-stone-200 transition hover:bg-stone-600 active:scale-95"
              >
                <FastForward size={13} weight="bold" />
                <span className="hidden sm:inline">Tick</span>
              </button>
              <motion.span
                animate={sim.active ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
                transition={{ duration: 1.6, repeat: sim.active ? Infinity : 0 }}
                className="ml-auto flex items-center gap-1 text-[10px] text-stone-400"
              >
                <ArrowClockwise size={11} weight="bold" />
                {Math.round(sim.speedMs / 1000)}s
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-[#13264a] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-stone-400">{label}</div>
      <div className={`tabular font-display mt-0.5 text-lg font-semibold sm:text-xl ${accent}`}>{value}</div>
    </div>
  );
}