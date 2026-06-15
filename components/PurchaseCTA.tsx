"use client";

import Link from "next/link";
import Reveal from "./Reveal";

const includes = [
  "Interactive itinerary builder",
  "Live budget tracker",
  "Smart packing lists",
  "Notes & journal",
  "Lifetime free updates",
  "Works offline after download",
];

export default function PurchaseCTA() {
  return (
    <section id="get" className="relative px-4 py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="glass-strong noise relative overflow-hidden p-8 text-center sm:p-12">
            <div className="absolute -inset-10 -z-10 bg-iridescent-soft blur-3xl" />
            <span className="eyebrow">Instant digital download</span>
            <h2 className="mx-auto mt-5 max-w-2xl font-sans text-4xl font-semibold sm:text-5xl">
              Your next trip starts{" "}
              <span className="text-iridescent">today.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/65">
              One beautiful planner. Yours forever. Try the full experience
              first — no signup required.
            </p>

            <div className="mt-8 flex items-baseline justify-center gap-3">
              <span className="font-sans text-5xl font-semibold">$24</span>
              <span className="text-white/40 line-through">$39</span>
              <span className="rounded-full bg-iridescent px-2.5 py-1 text-xs font-semibold text-ink">
                Launch price
              </span>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/planner" className="btn-primary">
                Start planning free →
              </Link>
              <a
                href="https://www.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Buy & download on Etsy
              </a>
            </div>

            <ul className="mx-auto mt-9 grid max-w-lg grid-cols-1 gap-x-6 gap-y-2 text-left text-sm text-white/70 sm:grid-cols-2">
              {includes.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#7ee0c0]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
