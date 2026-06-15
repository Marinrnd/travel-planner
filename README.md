# Travel OS

A high-end, interactive digital travel planner — built to be sold as a premium
download (e.g. on Etsy) while actually *working* as a real planning tool, not a
static template.

> Plan your dream trip, effortlessly.

## ✨ What's inside

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
