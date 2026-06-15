"use client";

import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  emptyPackingItem,
  packingProgressAtom,
  tripAtom,
} from "@/lib/state";

const SUGGESTIONS = [
  "Sunscreen",
  "Phone charger",
  "Reusable water bottle",
  "Travel insurance docs",
  "Headphones",
  "First-aid kit",
];

export default function PackingList() {
  const [trip, setTrip] = useAtom(tripAtom);
  const progress = useAtomValue(packingProgressAtom);
  const [draft, setDraft] = useState("");

  const add = (label: string) => {
    const value = label.trim();
    if (!value) return;
    setTrip((t) => ({ ...t, packing: [...t.packing, emptyPackingItem(value)] }));
    setDraft("");
  };

  const toggle = (id: string) =>
    setTrip((t) => ({
      ...t,
      packing: t.packing.map((p) =>
        p.id === id ? { ...p, packed: !p.packed } : p
      ),
    }));

  const remove = (id: string) =>
    setTrip((t) => ({
      ...t,
      packing: t.packing.filter((p) => p.id !== id),
    }));

  const suggestionsLeft = SUGGESTIONS.filter(
    (s) => !trip.packing.some((p) => p.label.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr,260px]">
      <div className="glass noise p-5">
        {/* progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/55">Packed</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-iridescent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {trip.packing.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <button
                  onClick={() => toggle(item.id)}
                  role="checkbox"
                  aria-checked={item.packed}
                  aria-label={`Mark ${item.label} as packed`}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition ${
                    item.packed
                      ? "border-transparent bg-iridescent text-ink"
                      : "border-white/25 text-transparent hover:border-white/50"
                  }`}
                >
                  ✓
                </button>
                <span
                  className={`flex-1 text-sm transition ${
                    item.packed ? "text-white/40 line-through" : "text-white/90"
                  }`}
                >
                  {item.label}
                </span>
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.label}`}
                  className="rounded-full px-2 text-white/30 opacity-0 transition hover:text-[#ff9ed2] group-hover:opacity-100"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an item…"
            aria-label="New packing item"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/30"
          />
          <button type="submit" className="btn-primary !px-4 !py-2 text-xs">
            Add
          </button>
        </form>
      </div>

      {/* suggestions */}
      <div className="glass noise h-fit p-5">
        <h3 className="font-sans text-sm font-semibold text-white/80">
          Suggested items
        </h3>
        <p className="mt-1 text-xs text-white/45">
          Tap to add to your list.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestionsLeft.length === 0 && (
            <span className="text-xs text-white/40">All added ✓</span>
          )}
          {suggestionsLeft.map((s) => (
            <button
              key={s}
              onClick={() => add(s)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
