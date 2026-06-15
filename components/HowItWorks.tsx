"use client";

import Reveal from "./Reveal";

const features = [
  {
    icon: "🗺️",
    title: "Interactive Itinerary Builder",
    desc: "Drag-and-drop your daily schedule, add activity details, and keep every day perfectly organized. Map integration keeps locations in view.",
    accent: "#7aa6ff",
  },
  {
    icon: "💸",
    title: "Budget Tracker",
    desc: "Log expenses by category, set a spending limit, and watch a live progress ring tell you exactly where your money is going.",
    accent: "#ff9ed2",
  },
  {
    icon: "🧳",
    title: "Packing List Organizer",
    desc: "Build customizable checklists, tick items off as you pack, and start from smart suggested items so nothing is forgotten.",
    accent: "#b794ff",
  },
  {
    icon: "🔐",
    title: "Document Vault",
    desc: "Keep reservations, tickets, and passport scans in one secure place, ready the moment you need them at the gate.",
    accent: "#7ee0c0",
    badge: "Demo placeholder",
  },
  {
    icon: "📓",
    title: "Notes & Journal",
    desc: "A dedicated space for the little ideas, recommendations, and memories that make a trip yours.",
    accent: "#ffd27a",
  },
  {
    icon: "🤝",
    title: "Sharing & Collaboration",
    desc: "Plan together in real time and share a polished itinerary with travel companions.",
    accent: "#9aa0b5",
    badge: "Coming soon",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-5 font-sans text-4xl font-semibold sm:text-5xl">
            Everything a great trip needs,{" "}
            <span className="text-iridescent">in one place.</span>
          </h2>
          <p className="mt-5 text-lg text-white/60">
            Six connected modules that turn scattered notes and browser tabs
            into a calm, single source of truth.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <article className="glass noise group h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    background: `${f.accent}22`,
                    boxShadow: `0 0 24px -6px ${f.accent}66`,
                  }}
                  aria-hidden
                >
                  {f.icon}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <h3 className="font-sans text-lg font-semibold">{f.title}</h3>
                  {f.badge && (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {f.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
