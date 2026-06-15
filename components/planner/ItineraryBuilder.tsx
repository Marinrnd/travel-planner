"use client";

import { useAtom } from "jotai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { tripAtom, uid, emptyDay } from "@/lib/state";
import type { ItineraryItem } from "@/lib/types";

export default function ItineraryBuilder() {
  const [trip, setTrip] = useAtom(tripAtom);
  const [dragging, setDragging] = useState<{
    dayId: string;
    itemId: string;
  } | null>(null);

  const addItem = (dayId: string) => {
    setTrip((t) => ({
      ...t,
      days: t.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              items: [
                ...d.items,
                {
                  id: uid(),
                  time: "12:00",
                  title: "New activity",
                  location: "",
                },
              ],
            }
          : d
      ),
    }));
  };

  const updateItem = (
    dayId: string,
    itemId: string,
    patch: Partial<ItineraryItem>
  ) => {
    setTrip((t) => ({
      ...t,
      days: t.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              items: d.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
          : d
      ),
    }));
  };

  const removeItem = (dayId: string, itemId: string) => {
    setTrip((t) => ({
      ...t,
      days: t.days.map((d) =>
        d.id === dayId
          ? { ...d, items: d.items.filter((it) => it.id !== itemId) }
          : d
      ),
    }));
  };

  const addDay = () => {
    setTrip((t) => ({ ...t, days: [...t.days, emptyDay(t.days.length + 1)] }));
  };

  // Reorder within a day via native drag-and-drop.
  const onDrop = (dayId: string, targetItemId: string) => {
    if (!dragging || dragging.dayId !== dayId) return;
    setTrip((t) => ({
      ...t,
      days: t.days.map((d) => {
        if (d.id !== dayId) return d;
        const items = [...d.items];
        const from = items.findIndex((i) => i.id === dragging.itemId);
        const to = items.findIndex((i) => i.id === targetItemId);
        if (from === -1 || to === -1) return d;
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        return { ...d, items };
      }),
    }));
    setDragging(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/55">
          Drag the <span aria-hidden>⠿</span> handle to reorder activities.
        </p>
        <button onClick={addDay} className="btn-ghost !px-4 !py-2 text-xs">
          + Add day
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {trip.days.map((day) => (
          <div key={day.id} className="glass noise p-5">
            <input
              value={day.label}
              onChange={(e) =>
                setTrip((t) => ({
                  ...t,
                  days: t.days.map((d) =>
                    d.id === day.id ? { ...d, label: e.target.value } : d
                  ),
                }))
              }
              aria-label="Day name"
              className="w-full bg-transparent font-sans text-lg font-semibold outline-none focus:text-iridescent"
            />

            <ul className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {day.items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    draggable
                    onDragStart={() =>
                      setDragging({ dayId: day.id, itemId: item.id })
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(day.id, item.id)}
                    className={`group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2.5 py-2 transition-colors ${
                      dragging?.itemId === item.id ? "opacity-50" : ""
                    }`}
                  >
                    <span
                      className="cursor-grab select-none px-1 text-white/30 active:cursor-grabbing"
                      aria-hidden
                    >
                      ⠿
                    </span>
                    <input
                      value={item.time}
                      onChange={(e) =>
                        updateItem(day.id, item.id, { time: e.target.value })
                      }
                      aria-label="Time"
                      className="w-14 rounded-md bg-transparent text-xs tabular-nums text-white/60 outline-none focus:bg-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        value={item.title}
                        onChange={(e) =>
                          updateItem(day.id, item.id, { title: e.target.value })
                        }
                        aria-label="Activity"
                        className="w-full truncate bg-transparent text-sm outline-none focus:text-iridescent"
                      />
                      <input
                        value={item.location}
                        placeholder="Add location…"
                        onChange={(e) =>
                          updateItem(day.id, item.id, {
                            location: e.target.value,
                          })
                        }
                        aria-label="Location"
                        className="w-full truncate bg-transparent text-xs text-white/45 outline-none placeholder:text-white/25"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(day.id, item.id)}
                      aria-label="Remove activity"
                      className="rounded-full px-2 py-1 text-white/30 opacity-0 transition hover:text-[#ff9ed2] group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {/* dummy map strip */}
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/40">
              <span aria-hidden>📍</span>
              {day.items.filter((i) => i.location).length} mapped stops · map
              preview
            </div>

            <button
              onClick={() => addItem(day.id)}
              className="mt-3 w-full rounded-2xl border border-white/10 py-2 text-sm text-white/60 transition hover:bg-white/[0.05] hover:text-white"
            >
              + Add activity
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
