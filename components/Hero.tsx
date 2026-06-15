"use client";

import Link from "next/link";
import { motion } from "framer-motion";

function MockPlanner() {
  return (
    <div className="glass-strong noise relative w-full overflow-hidden p-5 sm:p-6">
      {/* faux window controls */}
      <div className="mb-5 flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff9ed2]" />
        <span className="h-3 w-3 rounded-full bg-[#ffd27a]" />
        <span className="h-3 w-3 rounded-full bg-[#7ee0c0]" />
        <span className="ml-3 text-xs text-white/45">Lisbon Long Weekend</span>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* itinerary column */}
        <div className="col-span-3 space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-white/45">
            Today
          </p>
          {[
            { t: "10:00", a: "Tram 28 ride", c: "#7aa6ff" },
            { t: "13:00", a: "Pastéis de Belém", c: "#ff9ed2" },
            { t: "18:30", a: "Sunset viewpoint", c: "#b794ff" },
          ].map((row, i) => (
            <motion.div
              key={row.a}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12 }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <span
                className="h-8 w-1 rounded-full"
                style={{ background: row.c }}
              />
              <span className="w-12 text-xs tabular-nums text-white/55">
                {row.t}
              </span>
              <span className="text-sm text-white/90">{row.a}</span>
            </motion.div>
          ))}
        </div>

        {/* budget ring */}
        <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
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
                stroke="url(#g)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="97"
                initial={{ strokeDashoffset: 97 }}
                animate={{ strokeDashoffset: 33 }}
                transition={{ delay: 0.6, duration: 1.1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7aa6ff" />
                  <stop offset="100%" stopColor="#ff9ed2" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-sans text-lg font-semibold">66%</span>
              <span className="text-[10px] text-white/45">of budget</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-white/55">
            €654 of €1,200
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative px-4 pt-32 sm:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow">✦ The interactive travel planner</span>
          <h1 className="mt-5 font-sans text-5xl font-semibold leading-[1.05] sm:text-6xl">
            Plan your dream trip,{" "}
            <span className="text-iridescent">effortlessly.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
            A beautiful, all-in-one workspace to build your itinerary, track
            every euro, and pack with confidence — then download it and take it
            anywhere.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/planner" className="btn-primary">
              See the live demo →
            </Link>
            <a href="#how" className="btn-ghost">
              Learn more
            </a>
          </div>
          <div className="mt-8 flex items-center gap-5 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <span className="text-[#ffd27a]">★★★★★</span> 1,200+ happy travelers
            </span>
            <span aria-hidden>·</span>
            <span>Instant download</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-iridescent-soft blur-2xl" />
          <div className="animate-floaty">
            <MockPlanner />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
