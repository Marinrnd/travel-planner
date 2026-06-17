# Travel OS

A high-end, interactive travel planning project with **two deliverables**:

1. **Explorer OS — The Travel Planner** · a premium, fillable, printable **PDF**
   (the actual product you can sell on Etsy). See [`dist/`](dist/).
2. **A Next.js web app** · a free interactive demo/landing page to attract buyers.

> Plan every trip for the rest of your life.

## 📕 The product — Explorer OS planner (PDF)

A 17-page, **fillable + printable** travel planner with an editorial, slow-travel
aesthetic (warm cream paper, an elegant serif display, muted terracotta/sage/blue
accents). 297 interactive form fields and checkboxes.

- **Pages:** cover · how-to · trip overview · pre-trip checklist · daily itinerary
  (×5) · budget planner · expense log · packing list · reservations · journal (×2)
  · bucket list
- **Editions:** US Letter **and** A4 — `dist/Explorer-OS-Travel-Planner-*.pdf`
- **Etsy mockups:** ready-to-use listing images in `dist/etsy-mockups/`
- **Fonts:** Italiana (display), Lora (serif), Outfit (sans) — bundled in
  `assets/fonts/`, all SIL OFL licensed (free for commercial use)

Regenerate both editions any time:

```bash
npm run planner
```

The generator is `scripts/generate-planner.mjs` (built with `pdf-lib`).

## ✨ The web app

**Marketing site** (`/`)
- Glassmorphic hero with an animated planner preview
- "How it works" feature grid (itinerary, budget, packing, vault, notes, sharing)
- Trip templates (Romantic Getaway, Adventure Trek, Family Vacation)
- Testimonials and a purchase / download call-to-action

**Interactive planner** (`/planner`)
- **Overview** — editable trip details + live stats
- **Itinerary builder** — drag-and-drop activities across days, with a map preview
- **Budget tracker** — categorized expenses with a live progress ring and breakdown
- **Packing list** — checkable items, progress bar, and suggested items
- **Notes & journal** — free-form space, saved as you type
- **Download planner** — exports the whole trip as a JSON file

Everything you edit **saves automatically** to your browser's local storage, so
the demo persists between visits with zero backend setup.

## 🧱 Tech stack

- **Next.js 14** (App Router, SSR/SSG, SEO metadata, sitemap & robots)
- **React 18** + **TypeScript**
- **Tailwind CSS** — design system with glassmorphism, iridescent gradients,
  noise texture, and soft glow
- **Framer Motion** — page, hover, and micro-interaction animations
- **Jotai** — lightweight client state, persisted to `localStorage`
- **Geist Sans** (headings) + **Inter** (body)

Accessibility: semantic landmarks, ARIA roles on tabs/checkboxes, a skip link,
and visible focus styles (targeting WCAG 2.1 AA).

## 🚀 Run it locally

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

To build for production:

```bash
npm run build
npm start
```

## 🔌 Adding a real backend (Supabase)

State currently lives in `lib/state.ts` behind a single `tripAtom` that
persists to `localStorage`. To move to **Supabase** (Postgres + auth + realtime)
without touching any UI:

1. Create a Supabase project and a `trips` table matching `lib/types.ts`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
   `.env.local`.
3. Replace the storage atom in `lib/state.ts` with one that reads/writes through
   a secure API route. The components consume `tripAtom`, so they keep working.

## 📁 Project structure

```
app/
  layout.tsx        # fonts, global SEO metadata, skip link
  page.tsx          # marketing landing page
  planner/          # interactive planner (tabbed workspace)
  robots.ts, sitemap.ts
components/          # landing sections + planner modules
lib/
  types.ts          # shared trip data model
  state.ts          # Jotai atoms + sample trip + helpers
```

---

*This is a demo experience; the document vault, map, and collaboration features
are intentionally presented as placeholders.*
