"use client";

import Link from "next/link";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEFAULT_TRIP,
  packingProgressAtom,
  totalSpentAtom,
  tripAtom,
} from "@/lib/state";
import ItineraryBuilder from "@/components/planner/ItineraryBuilder";
import BudgetTracker from "@/components/planner/BudgetTracker";
import PackingList from "@/components/planner/PackingList";
import Notes from "@/components/planner/Notes";

const TABS = [
  { id: "overview", label: "Overview", icon: "✦" },
  { id: "itinerary", label: "Itinerary", icon: "🗺️" },
  { id: "budget", label: "Budget", icon: "💸" },
  { id: "packing", label: "Packing", icon: "🧳" },
  { id: "notes", label: "Notes", icon: "📓" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      role="status"
      className="glass-strong fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 text-sm font-medium glow-ring"
    >
      <span className="text-[#7ee0c0]">✓</span> {message}
    </motion.div>
  );
}

function Overview() {
  const [trip, setTrip] = useAtom(tripAtom);
  const spent = useAtomValue(totalSpentAtom);
  const progress = useAtomValue(packingProgressAtom);
  const stops = trip.days.reduce((n, d) => n + d.items.length, 0);

  const field = (
    label: string,
    value: string,
    key: "tripName" | "destination" | "startDate" | "endDate",
    type = "text"
  ) => (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-white/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => setTrip((t) => ({ ...t, [key]: e.target.value }))}
        className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30"
      />
    </label>
  );

  const stats = [
    { label: "Days planned", value: trip.days.length, color: "#7aa6ff" },
    { label: "Activities", value: stops, color: "#b794ff" },
    { label: "Budget spent", value: `€${spent.toLocaleString()}`, color: "#ff9ed2" },
    { label: "Packed", value: `${progress}%`, color: "#7ee0c0" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass noise p-5">
            <span
              className="text-2xl font-semibold"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
            <p className="mt-1 text-xs text-white/55">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass noise grid gap-4 p-6 sm:grid-cols-2">
        {field("Trip name", trip.tripName, "tripName")}
        {field("Destination", trip.destination, "destination")}
        {field("Start date", trip.startDate, "startDate", "date")}
        {field("End date", trip.endDate, "endDate", "date")}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const [tab, setTab] = useState<TabId>("overview");
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const trip = useAtomValue(tripAtom);
  const setTrip = useSetAtom(tripAtom);

  // Avoid hydration mismatch: localStorage values resolve on the client.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const exportTrip = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.tripName.replace(/\s+/g, "-").toLowerCase() || "trip"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Planner downloaded");
  };

  const reset = () => {
    setTrip(DEFAULT_TRIP);
    setToast("Demo reset to the sample trip");
  };

  return (
    <main id="main" className="min-h-screen px-4 pb-24 pt-8">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
            >
              ← Back
            </Link>
            <span className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-iridescent shadow-glow" aria-hidden />
              <span className="font-sans font-semibold">
                Travel<span className="text-iridescent">OS</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="btn-ghost !px-4 !py-2 text-xs">
              Reset demo
            </button>
            <button onClick={exportTrip} className="btn-primary !px-4 !py-2 text-xs">
              ↓ Download planner
            </button>
          </div>
        </div>

        <header className="mt-8">
          <h1 className="font-sans text-3xl font-semibold sm:text-4xl">
            {mounted ? trip.tripName : DEFAULT_TRIP.tripName}
          </h1>
          <p className="mt-1 text-white/55">
            {mounted ? trip.destination : DEFAULT_TRIP.destination} · Your
            changes save automatically.
          </p>
        </header>

        {/* tabs */}
        <div
          role="tablist"
          aria-label="Planner sections"
          className="scroll-thin mt-6 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "text-ink" : "text-white/60 hover:text-white"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-iridescent shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="mr-1.5" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* panels */}
        <div className="mt-8">
          {!mounted ? (
            <div className="glass noise h-64 animate-pulse" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "overview" && <Overview />}
                {tab === "itinerary" && <ItineraryBuilder />}
                {tab === "budget" && <BudgetTracker />}
                {tab === "packing" && <PackingList />}
                {tab === "notes" && <Notes />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
    </main>
  );
}
