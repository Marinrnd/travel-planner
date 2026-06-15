"use client";

import { useAtom, useAtomValue } from "jotai";
import { motion } from "framer-motion";
import {
  BUDGET_CATEGORIES,
  CATEGORY_COLORS,
  emptyExpense,
  spentByCategoryAtom,
  totalSpentAtom,
  tripAtom,
} from "@/lib/state";
import type { BudgetCategory, Expense } from "@/lib/types";

function ProgressRing({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const offset = 97 - (97 * clamped) / 100;
  const over = pct > 100;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 36 36" className="h-36 w-36 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        <motion.circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={over ? "#ff7a7a" : "url(#budgetGrad)"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="97"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="budgetGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7aa6ff" />
            <stop offset="100%" stopColor="#ff9ed2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-2xl font-semibold">
          {Math.round(pct)}%
        </span>
        <span className="text-[10px] uppercase tracking-wide text-white/45">
          {over ? "over budget" : "of budget"}
        </span>
      </div>
    </div>
  );
}

export default function BudgetTracker() {
  const [trip, setTrip] = useAtom(tripAtom);
  const totalSpent = useAtomValue(totalSpentAtom);
  const byCategory = useAtomValue(spentByCategoryAtom);

  const pct =
    trip.budgetLimit > 0 ? (totalSpent / trip.budgetLimit) * 100 : 0;
  const remaining = trip.budgetLimit - totalSpent;

  const updateExpense = (id: string, patch: Partial<Expense>) =>
    setTrip((t) => ({
      ...t,
      expenses: t.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const addExpense = () =>
    setTrip((t) => ({ ...t, expenses: [...t.expenses, emptyExpense()] }));

  const removeExpense = (id: string) =>
    setTrip((t) => ({
      ...t,
      expenses: t.expenses.filter((e) => e.id !== id),
    }));

  return (
    <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
      {/* summary */}
      <div className="glass noise flex flex-col items-center p-6">
        <ProgressRing pct={pct} />
        <div className="mt-5 w-full space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/55">Spent</span>
            <span className="font-semibold">€{totalSpent.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/55">Remaining</span>
            <span
              className={`font-semibold ${
                remaining < 0 ? "text-[#ff7a7a]" : "text-[#7ee0c0]"
              }`}
            >
              €{remaining.toLocaleString()}
            </span>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-white/55">Budget limit</span>
            <span className="flex items-center gap-1">
              <span className="text-white/40">€</span>
              <input
                type="number"
                min={0}
                value={trip.budgetLimit}
                onChange={(e) =>
                  setTrip((t) => ({
                    ...t,
                    budgetLimit: Number(e.target.value) || 0,
                  }))
                }
                className="w-24 rounded-md bg-white/[0.06] px-2 py-1 text-right font-semibold outline-none focus:ring-1 focus:ring-white/30"
              />
            </span>
          </label>
        </div>

        {/* category breakdown */}
        <div className="mt-5 w-full space-y-2">
          {BUDGET_CATEGORIES.map((cat) => {
            const amount = byCategory.get(cat) ?? 0;
            const share = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
            if (amount === 0) return null;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs text-white/55">
                  <span>{cat}</span>
                  <span>€{amount.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: CATEGORY_COLORS[cat] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${share}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* expense list */}
      <div className="glass noise p-5">
        <div className="space-y-2">
          {trip.expenses.map((e) => (
            <div
              key={e.id}
              className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ background: CATEGORY_COLORS[e.category] }}
                aria-hidden
              />
              <input
                value={e.label}
                placeholder="What was it?"
                onChange={(ev) => updateExpense(e.id, { label: ev.target.value })}
                aria-label="Expense label"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              />
              <select
                value={e.category}
                onChange={(ev) =>
                  updateExpense(e.id, {
                    category: ev.target.value as BudgetCategory,
                  })
                }
                aria-label="Category"
                className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-white/80 outline-none"
              >
                {BUDGET_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-ink">
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex items-center">
                <span className="text-white/40">€</span>
                <input
                  type="number"
                  min={0}
                  value={e.amount}
                  onChange={(ev) =>
                    updateExpense(e.id, { amount: Number(ev.target.value) || 0 })
                  }
                  aria-label="Amount"
                  className="w-20 bg-transparent text-right text-sm font-semibold tabular-nums outline-none"
                />
              </div>
              <button
                onClick={() => removeExpense(e.id)}
                aria-label="Remove expense"
                className="rounded-full px-2 py-1 text-white/30 opacity-0 transition hover:text-[#ff9ed2] group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addExpense}
          className="mt-3 w-full rounded-2xl border border-white/10 py-2 text-sm text-white/60 transition hover:bg-white/[0.05] hover:text-white"
        >
          + Add expense
        </button>
      </div>
    </div>
  );
}
