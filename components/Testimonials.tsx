"use client";

import Reveal from "./Reveal";

const reviews = [
  {
    name: "Amélie R.",
    role: "Booked a 3-week Japan trip",
    initials: "AR",
    color: "#ff9ed2",
    quote:
      "I replaced four apps and a messy spreadsheet with this. The budget ring alone saved me from overspending in Tokyo.",
  },
  {
    name: "Marcus T.",
    role: "Solo trekker",
    initials: "MT",
    color: "#7aa6ff",
    quote:
      "Genuinely the most beautiful planner I've used. The packing checklist is so satisfying I packed two days early.",
  },
  {
    name: "The Okafor Family",
    role: "Family of five",
    initials: "OF",
    color: "#7ee0c0",
    quote:
      "We planned our whole Portugal trip at the kitchen table. The kids picked activities and it just… worked.",
  },
  {
    name: "Priya N.",
    role: "Honeymoon in Santorini",
    initials: "PN",
    color: "#b794ff",
    quote:
      "Downloaded it, opened it offline on the plane, and everything was right there. Worth every cent.",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Loved by travelers</span>
          <h2 className="mt-5 font-sans text-4xl font-semibold sm:text-5xl">
            Trips planned without the{" "}
            <span className="text-iridescent">stress.</span>
          </h2>
        </Reveal>

        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-2">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.06}>
              <figure className="glass noise mb-5 break-inside-avoid p-6">
                <div className="mb-4 text-[#ffd27a]" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <blockquote className="text-[15px] leading-relaxed text-white/80">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-ink"
                    style={{ background: r.color }}
                    aria-hidden
                  >
                    {r.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{r.name}</span>
                    <span className="block text-xs text-white/50">{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
