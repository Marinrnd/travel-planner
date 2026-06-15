"use client";

import { useAtom } from "jotai";
import { tripAtom } from "@/lib/state";

export default function Notes() {
  const [trip, setTrip] = useAtom(tripAtom);
  return (
    <div className="glass noise p-5">
      <label
        htmlFor="trip-notes"
        className="font-sans text-sm font-semibold text-white/80"
      >
        Notes & journal
      </label>
      <p className="mt-1 text-xs text-white/45">
        Ideas, recommendations, and memories — saved as you type.
      </p>
      <textarea
        id="trip-notes"
        value={trip.notes}
        onChange={(e) => setTrip((t) => ({ ...t, notes: e.target.value }))}
        rows={10}
        placeholder="Start writing…"
        className="scroll-thin mt-4 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/30"
      />
    </div>
  );
}
