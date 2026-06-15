"use client";

import Link from "next/link";
import Reveal from "./Reveal";

const templates = [
  {
    name: "Romantic Getaway",
    blurb: "Slow mornings, candlelit dinners, and just-for-two viewpoints.",
    tags: ["2 travelers", "4 days", "City + coast"],
    gradient: "from-[#ff9ed2]/30 to-[#b794ff]/20",
    emoji: "🥂",
  },
  {
    name: "Adventure Trek",
    blurb: "Trailheads, gear checklists, and altitude-aware day plans.",
    tags: ["Solo / group", "7 days", "Mountains"],
    gradient: "from-[#7ee0c0]/30 to-[#7aa6ff]/20",
    emoji: "🏔️",
  },
  {
    name: "Family Vacation",
    blurb: "Kid-friendly pacing, snack budgets, and shared packing lists.",
    tags: ["4+ travelers", "6 days", "Resort"],
    gradient: "from-[#ffd27a]/30 to-[#ff9ed2]/20",
    emoji: "🧸",
  },
];

export default function Templates() {
  return (
    <section id="templates" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Examples & templates</span>
          <h2 className="mt-5 font-sans text-4xl font-semibold sm:text-5xl">
            Start from a template,{" "}
            <span className="text-iridescent">make it yours.</span>
          </h2>
          <p className="mt-5 text-lg text-white/60">
            Hand-crafted starting points for every kind of trip. Open one as an
            interactive demo and edit everything.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {templates.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <Link
                href="/planner"
                className="glass noise group block h-full overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div
                  className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${t.gradient}`}
                >
                  <span className="text-5xl drop-shadow-lg">{t.emoji}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-sans text-xl font-semibold">{t.name}</h3>
                  <p className="mt-2 text-sm text-white/60">{t.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-iridescent">
                    Open interactive demo
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
