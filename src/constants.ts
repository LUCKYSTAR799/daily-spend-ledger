import {
  Briefcase,
  Car,
  FilmSlate,
  FirstAid,
  ForkKnife,
  GraduationCap,
  Lightning,
  ShoppingBag,
  ShoppingCart,
  Tag,
} from "@phosphor-icons/react";
import type { CategoryId, Currency, Transaction } from "./types";

export const BRAND_NAME = "The Daily Ledger";
export const BRAND_SUB = "Compendium of Personal Accounts";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  NGN: "Naira",
  USD: "Dollar",
  EUR: "Euro",
};

/** Indicative FX rates expressed as units per 1 NGN (for preview conversion). */
export const FX_TO_NGN: Record<Currency, number> = {
  NGN: 1,
  USD: 1580,
  EUR: 1710,
};

/** Convert an amount in `from` currency to `to` currency (preview only). */
export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const inNgn = amount * FX_TO_NGN[from];
  return inNgn / FX_TO_NGN[to];
}

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency];
  const decimals = currency === "NGN" ? 0 : 2;
  const rounded = Math.round(amount * 10 ** decimals) / 10 ** decimals;
  return (
    symbol +
    rounded.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: typeof ForkKnife;
  /** tailwind classes for the badge tint */
  tint: string;
  dot: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "food", label: "Food & Dining", icon: ForkKnife, tint: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-500" },
  { id: "transport", label: "Transport", icon: Car, tint: "bg-sky-50 text-sky-900 border-sky-200", dot: "bg-sky-500" },
  { id: "utilities", label: "Utilities & Bills", icon: Lightning, tint: "bg-yellow-50 text-yellow-900 border-yellow-200", dot: "bg-yellow-500" },
  { id: "entertainment", label: "Entertainment & Leisure", icon: FilmSlate, tint: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200", dot: "bg-fuchsia-500" },
  { id: "healthcare", label: "Healthcare", icon: FirstAid, tint: "bg-rose-50 text-rose-900 border-rose-200", dot: "bg-rose-500" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, tint: "bg-violet-50 text-violet-900 border-violet-200", dot: "bg-violet-500" },
  { id: "business", label: "Business & Work", icon: Briefcase, tint: "bg-slate-100 text-slate-900 border-slate-300", dot: "bg-slate-600" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, tint: "bg-emerald-50 text-emerald-900 border-emerald-200", dot: "bg-emerald-600" },
  { id: "education", label: "Education", icon: GraduationCap, tint: "bg-indigo-50 text-indigo-900 border-indigo-200", dot: "bg-indigo-500" },
  { id: "misc", label: "Miscellaneous", icon: Tag, tint: "bg-stone-100 text-stone-800 border-stone-300", dot: "bg-stone-500" },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>
);

export const DEFAULT_CURRENCY: Currency = "NGN";
export const DEFAULT_BUDGET_NGN = 1200000;

let seedCounter = 0;
function iso(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function mk(
  amount: number,
  currency: Currency,
  category: CategoryId,
  daysAgo: number,
  hour: number,
  minute: number,
  note: string,
  merchant: string,
  tags: string[] = []
): Transaction {
  seedCounter += 1;
  return {
    id: `seed-${seedCounter}`,
    amount,
    currency,
    category,
    timestamp: iso(daysAgo, hour, minute),
    note,
    merchant,
    tags,
    isSimulated: false,
    receiptRef: `RC-${String(1000 + seedCounter)}`,
  };
}

export const SEED_TRANSACTIONS: Transaction[] = [
  mk(2400, "NGN", "food", 0, 8, 15, "Morning roast & bread", "Artisan Bakery", ["breakfast"]),
  mk(18500, "NGN", "groceries", 0, 11, 40, "Weekly market run", "Oja Fresh Market", ["household"]),
  mk(4500, "NGN", "transport", 0, 13, 5, "Ride to the office", "MetroRide", ["commute"]),
  mk(4.5, "USD", "entertainment", 1, 20, 30, "Streaming subscription", "CinePlus", ["recurring"]),
  mk(68.2, "EUR", "utilities", 1, 9, 12, "Electric utility debit", "VoltGrid EU", ["bill"]),
  mk(52000, "NGN", "healthcare", 2, 10, 0, "Pharmacy & consultation", "WellCare Clinic", ["health"]),
  mk(15800, "NGN", "shopping", 2, 16, 45, "Linen shirt", "Tailored & Co", ["apparel"]),
  mk(320, "USD", "business", 3, 14, 20, "Cloud hosting invoice", "NimbusCloud", ["work", "recurring"]),
  mk(75000, "NGN", "education", 3, 18, 10, "Online course module", "Scholaris", ["learning"]),
  mk(9800, "NGN", "food", 4, 21, 0, "Dinner with colleagues", "The Copper Pot", ["social"]),
  mk(12000, "NGN", "transport", 4, 7, 30, "Inter-city fuel", "PumpStation", ["travel"]),
  mk(145.0, "EUR", "shopping", 5, 12, 15, "Leather notebook & pen", "Atelier Nord", ["stationery"]),
  mk(60000, "NGN", "utilities", 6, 9, 45, "Internet bundle renewal", "FiberLink", ["bill", "recurring"]),
  mk(3400, "NGN", "misc", 6, 19, 20, "Parking & tolls", "CityGate", []),
  mk(22000, "NGN", "groceries", 7, 10, 30, "Provisions top-up", "BulkBasket", ["household"]),
  mk(9.99, "USD", "entertainment", 8, 22, 0, "Music membership", "WaveTune", ["recurring"]),
  mk(41000, "NGN", "healthcare", 9, 11, 0, "Dental checkup", "BrightSmile Dental", ["health"]),
  mk(18500, "NGN", "food", 10, 13, 10, "Catered team lunch", "GreenLeaf Kitchen", ["work"]),
  mk(1200, "EUR", "business", 11, 15, 0, "Software licence", "ForgeTools", ["work", "recurring"]),
  mk(27500, "NGN", "shopping", 12, 17, 40, "Running shoes", "StrideStore", ["fitness"]),
  mk(5600, "NGN", "transport", 13, 8, 50, "Airport transfer", "SwiftCab", ["travel"]),
  mk(88000, "NGN", "education", 14, 19, 30, "Certification exam fee", "ProExam Board", ["learning"]),
];

export interface SimTemplate {
  note: string;
  merchant: string;
  category: CategoryId;
  currency: Currency;
  min: number;
  max: number;
}

export const SIM_TEMPLATES: SimTemplate[] = [
  { note: "Espresso & pastry", merchant: "Corner Roasters", category: "food", currency: "NGN", min: 1800, max: 4200 },
  { note: "Rapid transit fare", merchant: "CityMetro", category: "transport", currency: "NGN", min: 800, max: 2500 },
  { note: "Fresh produce", merchant: "GreenCart", category: "groceries", currency: "NGN", min: 6000, max: 24000 },
  { note: "Mobile data top-up", merchant: "PulseNet", category: "utilities", currency: "NGN", min: 3000, max: 9000 },
  { note: "Movie ticket", merchant: "SilverScreen", category: "entertainment", currency: "NGN", min: 4000, max: 8500 },
  { note: "Coffee & snacks", merchant: "Bean & Leaf", category: "food", currency: "USD", min: 4, max: 14 },
  { note: "Rideshare trip", merchant: "GlideRide", category: "transport", currency: "USD", min: 6, max: 22 },
  { note: "Pharmacy essentials", merchant: "MediMart", category: "healthcare", currency: "NGN", min: 5000, max: 18000 },
  { note: "Bakery goods", merchant: "Patisserie Lumière", category: "food", currency: "EUR", min: 5, max: 18 },
  { note: "Tram day pass", merchant: "StadtBahn", category: "transport", currency: "EUR", min: 3, max: 9 },
  { note: "Office supplies", merchant: "PaperHouse", category: "business", currency: "NGN", min: 4500, max: 15000 },
  { note: "Weekend read", merchant: "Bindery Books", category: "education", currency: "NGN", min: 6000, max: 16000 },
];

export function buildSimulatedTransaction(): Transaction {
  const t = SIM_TEMPLATES[Math.floor(Math.random() * SIM_TEMPLATES.length)];
  const raw = t.min + Math.random() * (t.max - t.min);
  const amount = t.currency === "NGN" ? Math.round(raw / 50) * 50 : Math.round(raw * 100) / 100;
  const now = new Date();
  return {
    id: `sim-${now.getTime()}-${Math.floor(Math.random() * 999)}`,
    amount,
    currency: t.currency,
    category: t.category,
    timestamp: now.toISOString(),
    note: t.note,
    merchant: t.merchant,
    tags: ["auto"],
    isSimulated: true,
    receiptRef: `SIM-${String(now.getTime()).slice(-5)}`,
  };
}
