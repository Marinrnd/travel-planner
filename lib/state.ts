"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  BudgetCategory,
  Expense,
  ItineraryDay,
  PackingItem,
  TripState,
} from "./types";

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  "Flights",
  "Stay",
  "Food",
  "Activities",
  "Transport",
  "Other",
];

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  Flights: "#7aa6ff",
  Stay: "#b794ff",
  Food: "#ff9ed2",
  Activities: "#7ee0c0",
  Transport: "#ffd27a",
  Other: "#9aa0b5",
};

// A small, friendly default trip so the demo never feels empty.
export const DEFAULT_TRIP: TripState = {
  tripName: "Lisbon Long Weekend",
  destination: "Lisbon, Portugal",
  startDate: "2026-09-18",
  endDate: "2026-09-21",
  budgetLimit: 1200,
  days: [
    {
      id: "day-1",
      label: "Day 1 · Arrival",
      items: [
        {
          id: "i-1",
          time: "14:00",
          title: "Check in at Alfama guesthouse",
          location: "Alfama",
        },
        {
          id: "i-2",
          time: "18:30",
          title: "Sunset at Miradouro da Senhora do Monte",
          location: "Graça",
          note: "Arrive early for a bench.",
        },
      ],
    },
    {
      id: "day-2",
      label: "Day 2 · Explore",
      items: [
        {
          id: "i-3",
          time: "10:00",
          title: "Tram 28 ride",
          location: "Martim Moniz",
        },
        {
          id: "i-4",
          time: "13:00",
          title: "Pastéis de Belém",
          location: "Belém",
        },
      ],
    },
  ],
  expenses: [
    { id: "e-1", label: "Round-trip flights", category: "Flights", amount: 320 },
    { id: "e-2", label: "Guesthouse · 3 nights", category: "Stay", amount: 270 },
    { id: "e-3", label: "Dinner — seafood", category: "Food", amount: 64 },
  ],
  packing: [
    { id: "p-1", label: "Passport", packed: true },
    { id: "p-2", label: "Comfortable walking shoes", packed: false },
    { id: "p-3", label: "Universal adapter", packed: false },
    { id: "p-4", label: "Light rain jacket", packed: false },
  ],
  notes:
    "Remember to book the Sintra day trip and try a glass of Ginjinha in a chocolate cup.",
};

// Persisted to localStorage — real persistence with zero backend setup.
// Swap this atom for a Supabase-backed source later without touching the UI.
export const tripAtom = atomWithStorage<TripState>(
  "travel-os.trip.v1",
  DEFAULT_TRIP
);

// ---- Derived atoms ----

export const totalSpentAtom = atom((get) =>
  get(tripAtom).expenses.reduce((sum, e) => sum + e.amount, 0)
);

export const spentByCategoryAtom = atom((get) => {
  const expenses = get(tripAtom).expenses;
  const map = new Map<BudgetCategory, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return map;
});

export const packingProgressAtom = atom((get) => {
  const packing = get(tripAtom).packing;
  if (packing.length === 0) return 0;
  const done = packing.filter((p) => p.packed).length;
  return Math.round((done / packing.length) * 100);
});

// ---- Helpers (pure) ----

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const emptyExpense = (): Expense => ({
  id: uid(),
  label: "",
  category: "Other",
  amount: 0,
});

export const emptyPackingItem = (label: string): PackingItem => ({
  id: uid(),
  label,
  packed: false,
});

export const emptyDay = (index: number): ItineraryDay => ({
  id: uid(),
  label: `Day ${index} · New day`,
  items: [],
});
