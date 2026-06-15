# Explorer OS™ — The Travel Command Center

**A complete Notion build blueprint.**
Everything needed to assemble a premium, SaaS-grade Notion travel template you can
sell on Etsy. Follow it top to bottom and you'll have a fully connected Travel
Operating System: 11 linked databases, a live dashboard, formulas, rollups,
buttons, and reusable templates.

> **Brand:** **Explorer OS** — "Your entire travel life, in one workspace."
> Tagline options for the listing: *"Plan every trip for the rest of your life."* /
> *"From bucket list to boarding pass."*

---

## 0. How to read this document

Each database section gives you, in order:

1. **Purpose** — what it's for and what it connects to.
2. **Properties table** — exact property **name**, **Notion type**, and config
   (select options, relation target, rollup settings, or formula code).
3. **Views** — each view's type, filter, sort, and grouping.
4. **Templates / buttons** — repeatable page templates and automation buttons.

Formula code is written in **Notion's formula syntax** and can be pasted directly
into a formula property. Where a formula references another property, that property
must already exist (build order in §13 handles this).

Legend for property types: `Text`, `Number`, `Select`, `Multi-select`, `Date`,
`Checkbox`, `URL`, `Phone`, `Email`, `Person`, `Files`, `Relation`, `Rollup`,
`Formula`, `Created time`, `Last edited time`.

---

## 1. System architecture (the database map)

Explorer OS is built on **11 databases**. The **Trips** database is the hub;
almost everything relates back to it.

```
                          ┌──────────────────┐
                          │   🌍 TRIPS       │  ← master hub
                          └────────┬─────────┘
        ┌──────────────┬───────────┼───────────┬──────────────┬─────────────┐
        ▼              ▼           ▼            ▼              ▼             ▼
 ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ 🗓 ITINERARY│ │ 💸 BUDGET  │ │ 🛎 RESERV.│ │ 🧳 PACKING│ │ 📓 JOURNAL│ │ 🚗 ROAD   │
 │  (days/acts)│ │ (expenses) │ │ (bookings)│ │ (items)  │ │ (entries)│ │  TRIP     │
 └────────────┘ └────────────┘ └──────────┘ └──────────┘ └──────────┘ └────┬─────┘
                                                                            │
 ┌────────────┐ ┌────────────┐ ┌──────────────┐                       ┌────▼─────┐
 │ 🥾 ADVENTURE│ │ ✨ BUCKET  │ │ 📦 PACKING    │                       │ ⛽ FUEL/  │
 │  (hikes)    │ │  LIST      │ │  TEMPLATES    │ (master item lists)   │  TOLLS    │
 └────────────┘ └────────────┘ └──────────────┘                       └──────────┘
```

**The 11 databases:**

| # | Database | Role | Relates to |
|---|----------|------|-----------|
| 1 | 🌍 **Trips** | Master hub — one row per trip | everything |
| 2 | 🗓 **Itinerary** | Daily activities & time blocks | Trips |
| 3 | 💸 **Budget / Expenses** | Every cost line | Trips |
| 4 | 🛎 **Reservations** | Flights, hotels, cars, etc. | Trips |
| 5 | 🧳 **Packing Items** | Items to pack per trip | Trips, Packing Templates |
| 6 | 📦 **Packing Templates** | Reusable master item lists | Packing Items |
| 7 | 📓 **Journal** | Daily memories & photos | Trips |
| 8 | 🚗 **Road Trips** | Route + stops + mileage | Trips, Fuel/Tolls |
| 9 | ⛽ **Fuel & Tolls** | Road-trip cost lines | Road Trips |
| 10 | 🥾 **Adventures** | Hikes/treks with stats | Trips |
| 11 | ✨ **Bucket List** | Dream destinations & experiences | Trips (optional) |

---

## 2. 🌍 Trips (master database)

**Purpose:** the single source of truth. Every other database rolls its totals up
into a Trip row, and the Dashboard reads from here.

### Properties

| Property | Type | Config |
|----------|------|--------|
| Trip Name | Title | e.g. "Lisbon Long Weekend" |
| Destination | Text | City/region |
| Country | Select | one option per country (used by statistics) |
| Cover Photo | Files | for Gallery view |
| Start Date | Date | |
| End Date | Date | |
| Duration | Formula | see below |
| Status | Select | `Idea`, `Planning`, `Booked`, `Active`, `Completed`, `Archived` |
| Travel Type | Multi-select | `City`, `Beach`, `Road Trip`, `Hiking`, `Business`, `Backpacking`, `Family` |
| Priority | Select | `Low`, `Medium`, `High`, `Dream` |
| Participants | Person | (or Text if sharing externally) |
| Planned Budget | Number | format: currency |
| Actual Cost | Rollup | from Budget relation — `Sum` of `Amount` |
| Remaining | Formula | see below |
| Budget Health | Formula | see below |
| Cost / Day | Formula | see below |
| Cost / Traveler | Formula | see below |
| Countdown | Formula | days until start |
| Itinerary | Relation | → Itinerary |
| Expenses | Relation | → Budget |
| Reservations | Relation | → Reservations |
| Packing | Relation | → Packing Items |
| Journal Entries | Relation | → Journal |
| Adventures | Relation | → Adventures |
| Road Trip | Relation | → Road Trips |
| Packing % | Rollup | from Packing — `Percent checked` of `Packed` |
| Notes | Text | |

### Formulas (paste into the formula property)

**Duration** (nights):
```
if(empty(prop("Start Date")) or empty(prop("End Date")), 0,
  dateBetween(prop("End Date"), prop("Start Date"), "days"))
```

**Remaining** budget:
```
prop("Planned Budget") - prop("Actual Cost")
```

**Budget Health** (emoji status):
```
if(prop("Planned Budget") == 0, "—",
 if(prop("Actual Cost") > prop("Planned Budget"), "🔴 Over",
  if(prop("Actual Cost") > prop("Planned Budget") * 0.9, "🟠 Close",
   "🟢 On track")))
```

**Cost / Day:**
```
if(prop("Duration") == 0, prop("Actual Cost"),
  round(prop("Actual Cost") / prop("Duration")))
```

**Cost / Traveler** (Participants is a Person property; `length` counts them):
```
if(length(prop("Participants")) == 0, prop("Actual Cost"),
  round(prop("Actual Cost") / length(prop("Participants"))))
```

**Countdown** (days to departure; friendly text):
```
if(empty(prop("Start Date")), "",
 if(now() > prop("End Date"), "✅ Trip complete",
  if(now() > prop("Start Date"), "✈️ On the trip!",
   format(dateBetween(prop("Start Date"), now(), "days")) + " days to go")))
```

### Views

| View | Type | Filter / Sort |
|------|------|---------------|
| 🖼 Gallery | Gallery | card preview = Cover Photo; sort Start Date ↑ |
| 🗓 Calendar | Calendar | by Start Date |
| 📊 Timeline | Timeline | Start → End Date |
| ⚡ Active | Table | Status is `Active` or `Booked` |
| ✅ Completed | Table | Status is `Completed` |
| 📋 All Trips | Table | group by Status |

---

## 3. 🗓 Itinerary

**Purpose:** every activity, meal, transfer, and accommodation block, linked to its
trip and dated so it shows on calendars.

### Properties

| Property | Type | Config |
|----------|------|--------|
| Activity | Title | "Tram 28 ride" |
| Trip | Relation | → Trips (this is the link that makes everything connect) |
| Date | Date | include time → enables time blocks |
| Day # | Formula | `dateBetween(prop("Date"), prop("Trip Start"), "days") + 1` (needs rollup below) |
| Trip Start | Rollup | from Trip → Start Date (`Show original`) |
| Category | Select | `Activity`, `Food`, `Transport`, `Accommodation`, `Sightseeing`, `Rest` |
| Start Time | Date | (time on) |
| Duration (min) | Number | |
| Location | Text | |
| Map Link | URL | paste a Google Maps URL |
| Booked? | Checkbox | |
| Linked Reservation | Relation | → Reservations (optional) |
| Notes | Text | |

**Day #** formula:
```
if(empty(prop("Date")) or empty(prop("Trip Start")), 0,
  dateBetween(prop("Date"), prop("Trip Start"), "days") + 1)
```

### Views

| View | Type | Config |
|------|------|--------|
| 📆 Daily | Table | group by Day #; sort Start Time ↑ |
| 🗓 Calendar | Calendar | by Date |
| 📊 Timeline | Timeline | by Date, group by Category |
| 🍽 By Category | Board | group by Category |

### Page template: "Activity"
Pre-fill Category = `Activity`, Booked = unchecked. Add a body with headings:
*Details*, *Tickets*, *Notes*.

---

## 4. 💸 Budget / Expenses

**Purpose:** one row per cost. Rolls up into Trips → Actual Cost and powers the
budget dashboard.

### Properties

| Property | Type | Config |
|----------|------|--------|
| Expense | Title | "Round-trip flights" |
| Trip | Relation | → Trips |
| Category | Select | `Flights`, `Hotels`, `Food`, `Activities`, `Shopping`, `Transport`, `Misc` |
| Amount | Number | currency format |
| Currency | Select | `EUR`, `USD`, `GBP`, … (display only) |
| Paid? | Checkbox | |
| Payment Method | Select | `Card`, `Cash`, `Points` |
| Date | Date | |
| Receipt | Files | |
| Notes | Text | |

### Views

| View | Type | Config |
|------|------|--------|
| 📋 All Expenses | Table | sort Date ↓ |
| 🧮 By Category | Board | group by Category; show `Sum` of Amount per column |
| 🔴 Unpaid | Table | Paid? is unchecked |
| 📊 By Trip | Table | group by Trip |

> **Dashboard tip:** add a linked view of Budget grouped by Category with the
> Amount column set to **Sum** + **bar** calculation to get a visual breakdown.

---

## 5. 🛎 Reservations

**Purpose:** every booking with confirmation details, linked to the trip.

### Properties

| Property | Type | Config |
|----------|------|--------|
| Reservation | Title | "TAP Air — LIS outbound" |
| Trip | Relation | → Trips |
| Type | Select | `Flight`, `Train`, `Ferry`, `Hotel`, `Airbnb`, `Rental Car` |
| Provider | Text | airline / hotel name |
| Confirmation # | Text | |
| Booking Link | URL | |
| Contact Phone | Phone | |
| Contact Email | Email | |
| Check-in | Date | (time on) |
| Check-out | Date | (time on) |
| Cost | Number | currency |
| Linked Expense | Relation | → Budget (optional, to avoid double counting) |
| Status | Select | `Researching`, `Booked`, `Confirmed`, `Cancelled` |
| Documents | Files | tickets, vouchers |

### Views

| View | Type | Config |
|------|------|--------|
| 🗓 Timeline | Timeline | Check-in → Check-out |
| ✈️ By Type | Board | group by Type |
| 📋 By Trip | Table | group by Trip; sort Check-in ↑ |
| ⏰ Upcoming | Table | Check-in is on-or-after Today; sort ↑ |

---

## 6. 🧳 Packing Items + 📦 Packing Templates

Two databases working together so packing lists are **reusable across trips**.

### 6a. 📦 Packing Templates (master lists)

| Property | Type | Config |
|----------|------|--------|
| Item | Title | "Universal adapter" |
| List Type | Multi-select | `City Trip`, `Beach`, `Business`, `Camping`, `Road Trip`, `Hiking`, `Backpacking` |
| Category | Select | `Clothing`, `Tech`, `Documents`, `Toiletries`, `Gear`, `Misc` |
| Essential? | Checkbox | |

Seed it once with ~80–120 items tagged by List Type. This is your library.

### 6b. 🧳 Packing Items (per trip)

| Property | Type | Config |
|----------|------|--------|
| Item | Title | |
| Trip | Relation | → Trips |
| Category | Select | same options as above |
| Packed | Checkbox | |
| Quantity | Number | default 1 |
| From Template | Relation | → Packing Templates (optional provenance) |

**Progress bar:** On the **Trips** database, the `Packing %` rollup (from Packing
Items, `Percent checked` of `Packed`) — set its display to **Bar** to get a packing
progress bar on every trip and the dashboard.

### Views (Packing Items)

| View | Type | Config |
|------|------|--------|
| ✅ Checklist | Table | group by Category; show Packed checkbox |
| 🧳 By Trip | Board | group by Trip |
| ❗ To Pack | Table | Packed is unchecked |

### Button: "Load packing template"
See §11 — copies the right master list into the current trip.

---

## 7. 📓 Journal

**Purpose:** daily memories, photos, and reflections, in a gallery.

| Property | Type | Config |
|----------|------|--------|
| Entry | Title | "Day 2 — Belém" |
| Trip | Relation | → Trips |
| Date | Date | |
| Mood | Select | `🤩 Amazing`, `😊 Good`, `😐 Okay`, `😩 Tough` |
| Photos | Files | |
| Favorite Moment | Text | |
| Lessons Learned | Text | |
| Restaurants Visited | Text | |
| Places Discovered | Text | |
| Rating | Select | `⭐`…`⭐⭐⭐⭐⭐` |

### Views

| View | Type | Config |
|------|------|--------|
| 🖼 Gallery | Gallery | card preview = Photos; sort Date ↑ |
| 📅 Calendar | Calendar | by Date |
| 📋 By Trip | Table | group by Trip |

Page template "Journal Day" body: headings *Highlights*, *Photos*, *Notes to self*.

---

## 8. 🚗 Road Trips + ⛽ Fuel & Tolls

### 8a. 🚗 Road Trips

| Property | Type | Config |
|----------|------|--------|
| Route | Title | "Pacific Coast Highway" |
| Trip | Relation | → Trips |
| Start Location | Text | |
| End Location | Text | |
| Stops | Text | or relation to Itinerary |
| Total Distance (km) | Number | |
| Fuel Cost | Rollup | from Fuel & Tolls — `Sum` of Amount where Type = Fuel |
| Toll Cost | Rollup | from Fuel & Tolls — `Sum` of Amount where Type = Toll |
| Total Road Cost | Formula | `prop("Fuel Cost") + prop("Toll Cost")` |
| Cost / km | Formula | `if(prop("Total Distance (km)") == 0, 0, round(prop("Total Road Cost") / prop("Total Distance (km)") * 100) / 100)` |
| Vehicle Checklist | Text | (or a checkbox group via a related DB) |
| Road Journal | Text | |

### 8b. ⛽ Fuel & Tolls

| Property | Type | Config |
|----------|------|--------|
| Entry | Title | "Fill-up — Coimbra" |
| Road Trip | Relation | → Road Trips |
| Type | Select | `Fuel`, `Toll` |
| Amount | Number | currency |
| Liters | Number | (fuel only) |
| Date | Date | |
| Odometer (km) | Number | optional |

Two rollups on Road Trips use a **filter on the Type select** to split fuel vs toll.

---

## 9. 🥾 Adventures (Hiking & Outdoor)

| Property | Type | Config |
|----------|------|--------|
| Adventure | Title | "Rota Vicentina — Day 1" |
| Trip | Relation | → Trips |
| Type | Select | `Hike`, `Trek`, `Climb`, `Kayak`, `Bike` |
| Trail | Text | |
| Distance (km) | Number | |
| Elevation Gain (m) | Number | |
| Difficulty | Select | `Easy`, `Moderate`, `Hard`, `Expert` |
| Est. Duration (h) | Number | |
| Water Needed (L) | Formula | `round(prop("Distance (km)") * 0.5 * 10) / 10` (≈0.5 L/km, tune as needed) |
| Nutrition Plan | Text | |
| Equipment | Multi-select | `Boots`, `Poles`, `Headlamp`, `Rain shell`, `Map/GPS`, `First aid` |
| Safety Checks | Checkbox | "Told someone my route" etc. (use several checkboxes) |
| Completed | Checkbox | |
| Adventure Journal | Text | |

### Views: Board by Difficulty; Table by Trip; Gallery for completed adventures.

---

## 10. ✨ Bucket List + 📈 Statistics

### 10a. ✨ Bucket List

| Property | Type | Config |
|----------|------|--------|
| Dream | Title | "See the Northern Lights" |
| Type | Select | `Country`, `City`, `Landmark`, `Experience` |
| Region | Select | continent/region |
| Status | Select | `Someday`, `Planned`, `Done` |
| Target Year | Number | |
| Linked Trip | Relation | → Trips (set when it becomes real) |
| Priority | Select | `Low`, `Medium`, `High`, `Dream` |

**Progress:** add a Status board (`Someday` / `Planned` / `Done`) and a number
callout using the formula in §10b for "% of bucket list done."

### 10b. 📈 Travel Statistics (dashboard formulas)

Statistics are computed with **rollups on a single "Stats" helper** or directly via
linked-database calculations. The simplest robust approach: create one **Stats**
page with a self-relation to all Trips, then use these rollups/formulas.

Create a one-row **Stats** database (or use Notion's calculation bar on a Trips
view). Rollups from a relation to **all Trips**:

| Stat | How |
|------|-----|
| Total Trips | Rollup → `Count all` of Trips |
| Completed Trips | Trips view filtered `Status = Completed`, calculation `Count` |
| Countries Visited | Trips → rollup `Country` → `Count unique values` |
| Total Travel Days | Rollup → `Sum` of `Duration` |
| Total Spent | Rollup → `Sum` of `Actual Cost` |
| Avg Trip Cost | Formula: `if(prop("Total Trips") == 0, 0, round(prop("Total Spent") / prop("Total Trips")))` |
| Avg Trip Duration | Formula: `if(prop("Total Trips") == 0, 0, round(prop("Total Travel Days") / prop("Total Trips")))` |

> The fastest no-extra-DB method: on any **Trips table view**, click the bottom
> calculation bar under each column — `Sum` on Actual Cost, `Sum` on Duration,
> `Count unique` on Country. Surface these via **linked database** blocks on the
> Dashboard.

---

## 11. Buttons & automations

Notion **Button** property/blocks automate the repetitive actions. Configure each
button (Dashboard → `/button`) with these steps:

| Button | Steps |
|--------|-------|
| **➕ New Trip** | *Add page to* **Trips**, with **edit property** Status = `Planning`; *Open page*. |
| **💸 New Expense** | *Add page to* **Budget**, prefilled Date = `Now`; then *Open page*. |
| **🧳 New Packing Item** | *Add page to* **Packing Items**. |
| **🛎 New Reservation** | *Add page to* **Reservations**, Status = `Researching`. |
| **📓 New Journal Entry** | *Add page to* **Journal**, Date = `Now`, Mood = `😊 Good`. |
| **📦 Load Packing Template** | For each item in **Packing Templates** where `List Type` contains <trip type>, *Add page to* **Packing Items** copying Item + Category. *(Notion buttons can "add page" but can't loop over a filtered DB natively — see note.)* |
| **🗄 Archive Trip** | *Edit pages* (current trip) Status → `Archived`. |
| **♻️ Reset Trip** | Duplicate the trip's template structure into a new blank trip. |

> **Honest note on Notion's limits:** a single Button can add a *fixed* set of pages
> but cannot iterate over a filtered database (so "load 30 packing items at once"
> isn't a one-click native action). The standard template-shop pattern is:
> ship **pre-built "Trip Templates"** (a Trip page whose sub-databases already
> contain a starter itinerary + packing list), and the **New Trip** button
> duplicates that template. That gives the one-click feel buyers expect.

---

## 12. 🏠 Home Dashboard layout

Build this as the workspace's top page. Use columns and toggle headings.

```
# ✈️ Explorer OS — Travel Command Center
> Welcome back, {name}. Here's your travel life at a glance.

[ ➕ New Trip ] [ 💸 New Expense ] [ 🧳 New Packing ] [ 🛎 New Reservation ] [ 📓 New Journal ]

## ⏳ Next Trip
( Linked view of Trips → filter Status=Booked/Active, sort Start Date ↑, limit 1 )
→ shows Countdown formula big via a callout

## 📊 Travel Stats            ## 💸 Budget Overview
( Stats callouts §10b )       ( Budget linked view, By Category, Sum bar )

## 🗓 Upcoming Reservations
( Reservations → Upcoming view )

## 🧭 Active Trips (Gallery)
( Trips → Active view, Gallery )

## 📓 Recent Journal          ## ✨ Bucket List Progress
( Journal Gallery, 4 latest )  ( Bucket List board )
```

Style with Notion's column blocks, colored callouts, emoji headers, and a cover
image for the SaaS feel.

---

## 13. Recommended build order

Relations must point at databases that already exist, so build in this order:

1. **Trips** (properties without rollups/relations first).
2. **Budget**, **Reservations**, **Itinerary**, **Packing Items**, **Journal**,
   **Adventures**, **Road Trips** — create each with a **Trip** relation back to
   Trips.
3. **Packing Templates**, **Fuel & Tolls**, **Bucket List**.
4. Go back to **Trips** and add the **rollups** (Actual Cost, Packing %, etc.) now
   that the related DBs exist.
5. Add **formulas** in Trips (they reference the rollups).
6. Build **views** on every database.
7. Create **page templates** inside each database.
8. Build the **Dashboard** with linked views + buttons.
9. Make 2–3 **starter "Trip Templates"** (City / Beach / Road Trip) with pre-filled
   sub-content for the duplicate-to-start experience.

---

## 14. Packaging & selling on Etsy

- **Deliverable:** a Notion page set to *Share → Publish → "Allow duplicate as
  template."* Buyers receive a link and click **Duplicate** to copy it into their
  own workspace.
- **What the Etsy listing should include:** a PDF with the duplicate link + a
  3-step setup guide, 5–8 mockup images (use the web app screenshots as hero
  mockups), and a short Loom-style walkthrough.
- **Price anchoring:** comparable "Travel OS" Notion templates sell for **$15–$39**.
  Launch at an intro price, raise after the first reviews.
- **Listing keywords:** *notion travel planner, travel itinerary template, trip
  budget tracker, packing list notion, digital travel planner, vacation planner.*
- **Demo:** link the React web app (this repo) as a free interactive preview to
  drive conversions — buyers try the feel, then buy the full Notion OS.

---

*Built as the companion blueprint to the Explorer OS web experience in this repo.*
*Assemble it in Notion by hand, or connect a Notion integration token and have it
created via the API (databases, properties, relations, and formulas can be
automated; buttons, some view types, and automations are added manually after).*
