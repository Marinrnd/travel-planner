/**
 * The Slow Atlas — Thailand Road Trip Atlas (Deluxe Edition)
 * A comprehensive, densely-packed travel ebook (PDF): full practical guide,
 * four detailed road-trip routes, a day-by-day Mae Hong Son Loop, phrasebook,
 * dish glossary, festivals, responsible travel, and many fillable planning
 * pages. Generates US Letter + A4 editions.
 *
 * Run: npm run thailand
 */
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FDIR = join(ROOT, "assets", "fonts");
const fb = {
  display: readFileSync(join(FDIR, "Italiana-Regular.ttf")),
  serif: readFileSync(join(FDIR, "Lora-Regular.ttf")),
  serifB: readFileSync(join(FDIR, "Lora-Bold.ttf")),
  serifI: readFileSync(join(FDIR, "Lora-Italic.ttf")),
  sans: readFileSync(join(FDIR, "Outfit-Regular.ttf")),
  sansB: readFileSync(join(FDIR, "Outfit-Bold.ttf")),
};

const paper = rgb(0.984, 0.969, 0.945), ink = rgb(0.176, 0.165, 0.141);
const sub = rgb(0.5, 0.475, 0.43), hair = rgb(0.866, 0.835, 0.788);
const panel = rgb(0.953, 0.933, 0.898), terra = rgb(0.725, 0.376, 0.247);
const sage = rgb(0.443, 0.498, 0.376), blue = rgb(0.357, 0.471, 0.529);
const ochre = rgb(0.78, 0.6, 0.27), white = rgb(1, 1, 1);

let doc, W, H, M, CW, form, PAGE, D, SF, SB, SI, SN, NB;
let nameCounter = 0;
const uid = (b) => `${b}_${nameCounter++}`;

const text = (p, s, x, y, { size = 11, font = SN, color = ink, opacity = 1 } = {}) =>
  p.drawText(s, { x, y, size, font, color, opacity });
function tracked(p, s, x, y, { size = 9, font = NB, color = sub, tracking = 1.5 } = {}) {
  let cx = x; for (const ch of s) { p.drawText(ch, { x: cx, y, size, font, color }); cx += font.widthOfTextAtSize(ch, size) + tracking; } return cx - x - tracking;
}
const trackedW = (s, { size = 9, font = NB, tracking = 1.5 } = {}) => { let w = 0; for (const ch of s) w += font.widthOfTextAtSize(ch, size) + tracking; return w - tracking; };
const center = (p, s, y, { size = 11, font = SN, color = ink } = {}) => p.drawText(s, { x: (W - font.widthOfTextAtSize(s, size)) / 2, y, size, font, color });
const trackedCenter = (p, s, y, o = {}) => tracked(p, s, (W - trackedW(s, o)) / 2, y, o);

function para(p, s, x, y, w, { size = 10, font = SF, color = ink, leading = 14 } = {}) {
  let line = "", yy = y;
  for (const word of s.split(" ")) {
    const t = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(t, size) > w) { text(p, line, x, yy, { size, font, color }); yy -= leading; line = word; }
    else line = t;
  }
  if (line) { text(p, line, x, yy, { size, font, color }); yy -= leading; }
  return yy;
}
function bullets(p, items, x, y, w, { accent = terra, gap = 4, size = 10, leading = 13.5 } = {}) {
  let yy = y;
  for (const it of items) { p.drawCircle({ x: x + 2.2, y: yy + 3.2, size: 1.7, color: accent }); yy = para(p, it, x + 11, yy, w - 11, { size, leading }) - gap; }
  return yy;
}
// inline "term desc" with wrapping — great for glossaries, phrases, dish lists
function entry(p, term, desc, x, y, w, { size = 10, leading = 14 } = {}) {
  let cx = x, yy = y;
  p.drawText(term, { x: cx, y: yy, size, font: SB, color: ink });
  cx += SB.widthOfTextAtSize(term, size) + 5;
  for (const word of desc.split(" ")) {
    const ww = SF.widthOfTextAtSize(word + " ", size);
    if (cx + ww > x + w) { yy -= leading; cx = x; }
    p.drawText(word, { x: cx, y: yy, size, font: SF, color: sub }); cx += ww;
  }
  return yy - leading;
}
function subhead(p, s, x, y, accent = terra) { tracked(p, s.toUpperCase(), x, y, { size: 8.5, font: NB, color: accent, tracking: 1.8 }); return y - 18; }

const hline = (p, x1, x2, y, { thickness = 0.7, color = hair } = {}) => p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
const paperBg = (p) => p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });
function globe(p, cx, cy, r, color = terra, w = 1) {
  p.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: w, color: undefined });
  p.drawEllipse({ x: cx, y: cy, xScale: r * 0.421, yScale: r, borderColor: color, borderWidth: w, color: undefined });
  hline(p, cx - r, cx + r, cy, { thickness: w, color });
  const dy = r * 0.447, hw = r * 0.724;
  hline(p, cx - hw, cx + hw, cy + dy, { thickness: w, color }); hline(p, cx - hw, cx + hw, cy - dy, { thickness: w, color });
}
function header(p, num, tag, title, accent = terra) {
  text(p, num, W - M - D.widthOfTextAtSize(num, 60), H - M - 54, { size: 60, font: D, color: accent, opacity: 0.15 });
  tracked(p, tag.toUpperCase(), M, H - M - 13, { size: 8.5, font: NB, color: accent, tracking: 2.2 });
  text(p, title, M, H - M - 44, { size: 25, font: D, color: ink });
  hline(p, M, W - M, H - M - 58, { thickness: 0.8 });
}
function footer(p, label) {
  hline(p, M, W - M, 44, { thickness: 0.6 });
  tracked(p, "THE SLOW ATLAS", M, 31, { size: 7.5, font: NB, color: sub, tracking: 2 });
  const r = label.toUpperCase(), rw = trackedW(r, { size: 7.5, font: NB, tracking: 2 });
  tracked(p, r, W - M - rw, 31, { size: 7.5, font: NB, color: sub, tracking: 2 });
  center(p, `— ${String(PAGE).padStart(2, "0")} —`, 31, { size: 8, font: SN, color: sub });
  PAGE++;
}
function field(p, x, y, w, { label = null, size = 11 } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + 16, { size: 7.5, font: NB, color: sub, tracking: 1.5 });
  hline(p, x, x + w, y - 2, { thickness: 0.8, color: hair });
  const tf = form.createTextField(uid("f")); tf.addToPage(p, { x: x + 2, y, width: w - 4, height: 15, borderWidth: 0, backgroundColor: paper, font: SN }); tf.setFontSize(size);
}
function panelField(p, x, y, w, h, { label = null } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + h + 6, { size: 7.5, font: NB, color: sub, tracking: 1.5 });
  p.drawRectangle({ x, y, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  const tf = form.createTextField(uid("f")); tf.enableMultiline(); tf.addToPage(p, { x: x + 8, y: y + 6, width: w - 16, height: h - 12, borderWidth: 0, backgroundColor: panel, font: SN }); tf.setFontSize(11);
}
function checkRow(p, x, y, label, w, accent = terra) {
  const cb = form.createCheckBox(uid("c")); cb.addToPage(p, { x, y, width: 11, height: 11, borderWidth: 1, borderColor: accent });
  if (label) text(p, label, x + 21, y, { size: 10, font: SF, color: ink });
  hline(p, x + 21, x + w, y - 4, { thickness: 0.5 });
}
// generic table
function table(p, x, y, cols, rows, { headerColor = terra, rowH = 20, fontSize = 9.5 } = {}) {
  let cx = x;
  cols.forEach((c) => { tracked(p, c.h.toUpperCase(), cx, y, { size: 7.5, font: NB, color: headerColor, tracking: 1.2 }); cx += c.w; });
  let yy = y - 8; hline(p, x, x + cols.reduce((a, c) => a + c.w, 0), yy, { thickness: 0.8 }); yy -= 16;
  for (const row of rows) {
    cx = x;
    row.forEach((cell, i) => { para(p, cell, cx, yy, cols[i].w - 8, { size: fontSize, font: i === 0 ? SB : SF, color: i === 0 ? ink : sub, leading: 12 }); cx += cols[i].w; });
    yy -= rowH; hline(p, x, x + cols.reduce((a, c) => a + c.w, 0), yy + 8, { thickness: 0.4 });
  }
  return yy;
}
const newPage = () => { const p = doc.addPage([W, H]); paperBg(p); return p; };
function pageW(num, tag, title, accent, render, label) { const p = newPage(); header(p, num, tag, title, accent); render(p, H - M - 88); footer(p, label || title); }

function drawMap(p, bx, by, bw, bh, nodes, routes) {
  const px = (nx) => bx + nx * bw, py = (ny) => by + ny * bh;
  for (const r of routes) {
    const pts = r.keys.map((k) => nodes.find((n) => n.key === k)).filter(Boolean);
    for (let i = 0; i < pts.length - 1; i++) p.drawLine({ start: { x: px(pts[i].x), y: py(pts[i].y) }, end: { x: px(pts[i + 1].x), y: py(pts[i + 1].y) }, thickness: 1.6, color: r.color });
    if (r.loop && pts.length > 1) p.drawLine({ start: { x: px(pts.at(-1).x), y: py(pts.at(-1).y) }, end: { x: px(pts[0].x), y: py(pts[0].y) }, thickness: 1.6, color: r.color });
  }
  for (const n of nodes) { p.drawCircle({ x: px(n.x), y: py(n.y), size: n.big ? 4 : 2.6, color: n.big ? terra : ink }); text(p, n.name, px(n.x) + (n.lx ?? 7), py(n.y) + (n.ly ?? -3), { size: n.big ? 9 : 8, font: n.big ? NB : SN, color: ink }); }
}

// ============================ PAGES ============================
function cover() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  trackedCenter(p, "THE SLOW ATLAS", H - 138, { size: 9, font: NB, color: terra, tracking: 5 });
  globe(p, W / 2, H - 232, 30, terra, 1);
  center(p, "Thailand", H / 2 + 40, { size: 70, font: D, color: ink });
  center(p, "Road Trip Atlas", H / 2 - 14, { size: 40, font: D, color: terra });
  hline(p, W / 2 - 66, W / 2 + 66, H / 2 - 40, { thickness: 0.8, color: ink });
  center(p, "The complete guide & planner — legendary routes, slowly travelled.", H / 2 - 70, { size: 13, font: SI, color: sub });
  trackedCenter(p, "4 ROUTES  ·  ITINERARIES  ·  PHRASEBOOK  ·  FOOD  ·  PLANNING PAGES", 232, { size: 8, font: NB, color: sub, tracking: 2 });
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME I", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}

function contents() {
  pageW("00", "Welcome", "What's inside", sage, (p, y0) => {
    let y = para(p, "This is a road-tripper's companion to Thailand — written for travellers who'd rather wind through mountain villages and roadside noodle stalls than rush between airports. It is two books in one: a practical guide to doing Thailand well, and a planner to make the trip your own.", M, y0, CW, { leading: 15 });
    y -= 10;
    const colW = CW / 2 - 14;
    const left = [
      ["The Guide", terra],
      ["Thailand in brief", ""], ["The four regions", ""], ["When to go & festivals", ""],
      ["Visas, money & costs", ""], ["Driving in Thailand", ""], ["Renting a scooter or car", ""],
      ["Staying safe & healthy", ""], ["Connectivity & apps", ""], ["Culture & etiquette", ""],
      ["A Thai phrasebook", ""], ["Eating in Thailand", ""], ["A glossary of dishes", ""],
    ];
    const right = [
      ["The Routes & Planner", terra],
      ["The four great routes", ""], ["Mae Hong Son Loop (7 days)", ""], ["The Andaman Coast", ""],
      ["Isaan & the North-East", ""], ["Bangkok – Kanchanaburi", ""], ["Responsible travel", ""],
      ["Inspiration & reading", ""],
      ["— Fillable —", sage], ["Bucket list · Trip overview", ""], ["Budget · Itinerary grid", ""],
      ["Stays · Packing · Daily plan", ""], ["Journal & notes", ""],
    ];
    const render = (col, x) => {
      let yy = y - 6;
      for (const [t, c] of col) {
        if (c) { yy = subhead(p, t, x, yy, c) - 2; }
        else { p.drawCircle({ x: x + 2, y: yy + 3, size: 1.6, color: hair }); text(p, t, x + 11, yy, { size: 10.5, font: SF, color: ink }); yy -= 17; }
      }
    };
    render(left, M); render(right, M + CW / 2 + 14);
  }, "Contents");
}

function inBrief() {
  pageW("01", "Orientation", "Thailand in brief", terra, (p, y0) => {
    const colW = CW / 2 - 16; let yl = y0, yr = y0;
    yl = subhead(p, "The land", M, yl);
    yl = para(p, "Thailand sits at the heart of mainland South-East Asia — roughly the size of France, and shaped a little like an elephant's head. From the cool, folded mountains of the north it stretches 1,650 km south down a slender peninsula of jungle and islands between two seas: the Gulf of Thailand to the east, the Andaman to the west.", M, yl, colW, { leading: 13.5 }) - 8;
    yl = subhead(p, "A quick history", M, yl);
    yl = para(p, "The kingdom of Siam was never colonised — a point of deep national pride. The Thai monarchy is revered (and protected by law), Theravada Buddhism shapes daily life, and the result is a culture that is at once relaxed and quietly formal.", M, yl, colW, { leading: 13.5 }) - 8;
    yl = subhead(p, "Why drive it", M, yl);
    yl = bullets(p, ["Freedom to reach villages, viewpoints and waterfalls the buses skip.", "Roads are good, fuel is cheap, and the scenery is the attraction.", "You set the pace — the essence of slow travel."], M, yl, colW, { accent: terra });

    const x2 = M + CW / 2 + 16;
    yr = subhead(p, "The essentials", x2, yr);
    const facts = [["Capital", "Bangkok (Krung Thep)"], ["Population", "≈71 million"], ["Language", "Thai (English widely used in tourism)"], ["Religion", "Theravada Buddhism (≈93%)"], ["Currency", "Thai baht (THB)"], ["Drives on", "The LEFT"], ["Plugs", "Type A / B / C · 230V"], ["Time zone", "GMT +7 (no daylight saving)"], ["Calling code", "+66"], ["Best months", "November – February"]];
    for (const [k, v] of facts) { text(p, k, x2, yr, { size: 9.5, font: NB, color: ink }); text(p, v, x2 + 92, yr, { size: 9.5, font: SF, color: sub }); hline(p, x2, x2 + colW, yr - 6, { thickness: 0.4 }); yr -= 21; }
    yr -= 8; yr = subhead(p, "Five quick wins", x2, yr, sage);
    yr = bullets(p, ["Carry cash in small notes.", "Learn 'sawatdee' and 'khop khun'.", "Always agree taxi/tuk-tuk prices first.", "Dress modestly at temples.", "Smile — it's the national language."], x2, yr, colW, { accent: sage });
  }, "In Brief");
}

function regions1() {
  pageW("02", "The country", "The four regions · I", blue, (p, y0) => {
    const blocks = [
      ["The North", terra, "Chiang Mai · Chiang Rai · Pai · Mae Hong Son", "Cool mountains, hill-tribe cultures, ornate Lanna temples and the country's best road trips. Slower, greener and gentler than the south — and the spiritual home of this atlas. Don't miss: khao soi, the Mae Hong Son Loop, and the Yi Peng lantern festival.", ["Cooler climate, especially Nov–Feb", "Lanna culture & Burmese influence", "Trekking, waterfalls, coffee country"]],
      ["The Centre", blue, "Bangkok · Ayutthaya · Kanchanaburi · Hua Hin", "The flat, fertile rice bowl and the beating heart of the kingdom. Frenetic Bangkok, the romantic ruins of old Ayutthaya, the River Kwai, and easy weekend escapes. The gateway most journeys begin from.", ["Thailand's transport hub", "Ancient capitals & royal history", "Floating markets & big-city energy"]],
    ];
    let y = y0;
    for (const [name, accent, places, desc, tags] of blocks) {
      p.drawRectangle({ x: M, y: y - 96, width: 3, height: 108, color: accent });
      text(p, name, M + 16, y, { size: 18, font: D, color: ink });
      tracked(p, places.toUpperCase(), M + 16, y - 18, { size: 7.5, font: NB, color: accent, tracking: 1.2 });
      const ey = para(p, desc, M + 16, y - 36, CW * 0.62 - 16, { leading: 13.5 });
      let ty = y - 36;
      for (const t of tags) { p.drawCircle({ x: M + CW * 0.66, y: ty + 3, size: 1.6, color: accent }); text(p, t, M + CW * 0.66 + 9, ty, { size: 9, font: SF, color: sub }); ty -= 15; }
      y = Math.min(ey, ty) - 24;
    }
  }, "Regions");
}
function regions2() {
  pageW("02", "The country", "The four regions · II", sage, (p, y0) => {
    const blocks = [
      ["Isaan (North-East)", sage, "Khorat · Phimai · Ubon · Nong Khai · the Mekong", "The vast plateau few visitors see — and all the richer for it. Khmer temples older than Angkor, silk-weaving villages, the mighty Mekong, fiery food and the warmest welcome in Thailand. Wonderfully cheap and gloriously authentic.", ["Khmer ruins & Lao-influenced culture", "Som tam, larb & sticky rice", "Big skies, slow villages"]],
      ["The South", ochre, "Phuket · Krabi · Khao Sok · Koh Lanta · the islands", "Postcard Thailand: limestone karsts rising from turquoise seas, rainforest national parks, and beaches for every mood. Two coasts mean there's almost always somewhere dry — when one side rains, cross to the other.", ["Andaman & Gulf coasts", "Diving, kayaking, island-hopping", "Richer, spicier southern curries"]],
    ];
    let y = y0;
    for (const [name, accent, places, desc, tags] of blocks) {
      p.drawRectangle({ x: M, y: y - 96, width: 3, height: 108, color: accent });
      text(p, name, M + 16, y, { size: 18, font: D, color: ink });
      tracked(p, places.toUpperCase(), M + 16, y - 18, { size: 7.5, font: NB, color: accent, tracking: 1.2 });
      const ey = para(p, desc, M + 16, y - 36, CW * 0.62 - 16, { leading: 13.5 });
      let ty = y - 36;
      for (const t of tags) { p.drawCircle({ x: M + CW * 0.66, y: ty + 3, size: 1.6, color: accent }); text(p, t, M + CW * 0.66 + 9, ty, { size: 9, font: SF, color: sub }); ty -= 15; }
      y = Math.min(ey, ty) - 24;
    }
    y -= 4;
    p.drawRectangle({ x: M, y: y - 30, width: CW, height: 42, color: panel, borderColor: hair, borderWidth: 0.8 });
    tracked(p, "SLOW ATLAS TIP", M + 12, y, { size: 8, font: NB, color: terra, tracking: 1.8 });
    para(p, "Don't try to 'do' all four regions in one trip. Pick one or two and travel them slowly — Thailand rewards depth far more than distance.", M + 12, y - 15, CW - 24, { size: 9.5, font: SI, color: ink, leading: 13 });
  }, "Regions");
}

function whenToGo() {
  pageW("03", "Timing", "When to go & festivals", ochre, (p, y0) => {
    let y = para(p, "Choosing the right window matters more in Thailand than almost anywhere. There are three broad seasons — and the north and south often run on different clocks.", M, y0, CW, { leading: 14 }) - 6;
    const seasons = [["Cool & dry", "Nov – Feb", sage, "The sweet spot: comfortable days, clear skies, cool hill evenings. Peak season — book ahead."], ["Hot", "Mar – May", ochre, "Fierce heat; Mar–Apr brings haze to the north. Songkran (mid-Apr) is a joyous water-fight new year."], ["Green & wet", "Jun – Oct", blue, "Warm monsoon — short, heavy afternoon bursts. Lush, quiet and cheap. The south's Andaman side is wettest."]];
    for (const [n, w, a, d] of seasons) {
      p.drawRectangle({ x: M, y: y - 30, width: 3, height: 42, color: a });
      text(p, n, M + 14, y, { size: 12, font: SB, color: ink }); tracked(p, w.toUpperCase(), M + 14, y - 16, { size: 8, font: NB, color: a, tracking: 1.3 });
      para(p, d, M + 150, y + 1, CW - 150, { size: 9.5, leading: 13 }); y -= 50;
    }
    y -= 6; y = subhead(p, "A month-by-month almanac", M, y, terra);
    const half = CW / 2 - 10;
    const rowsL = [["Jan", "Cool, dry, perfect", "Peak season"], ["Feb", "Warm, dry", "Chiang Mai Flower Fest."], ["Mar", "Hot, northern haze", "—"], ["Apr", "Hottest month", "Songkran (water new year)"], ["May", "Hot, first rains", "Low season begins"], ["Jun", "Warm, wet spells", "Green & cheap"]];
    const rowsR = [["Jul", "Monsoon", "Asalha Puja / Buddhist Lent"], ["Aug", "Wettest in places", "Quiet, lush"], ["Sep", "Heavy rains", "Lowest prices"], ["Oct", "Rains ease", "Vegetarian Festival"], ["Nov", "Cool & dry returns", "Loy Krathong / Yi Peng"], ["Dec", "Cool, dry, busy", "High season"]];
    const cols = [{ h: "Month", w: half * 0.22 }, { h: "Weather", w: half * 0.42 }, { h: "Don't miss", w: half * 0.36 }];
    table(p, M, y, cols, rowsL, { rowH: 18, fontSize: 9 });
    table(p, M + CW / 2 + 10, y, cols.map(c => ({ ...c })), rowsR, { rowH: 18, fontSize: 9 });
  }, "When to Go");
}

function visasMoney() {
  pageW("04", "Practical", "Visas, money & costs", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Entry & visas", M, yl);
    yl = bullets(p, ["Many nationalities (incl. EU, UK, US, Australia) enter visa-free for short stays — the exact length changes, so confirm the current rule before you fly.", "Your passport must be valid 6+ months beyond arrival.", "You may be asked for proof of onward travel and funds.", "Overstaying carries a daily fine — don't risk it."], M, yl, colW, { accent: terra }) - 6;
    yl = subhead(p, "Money basics", M, yl);
    yl = bullets(p, ["The baht (THB) is cash-first outside cities — carry small notes.", "ATMs are everywhere but charge ≈THB 220 per foreign withdrawal; take larger amounts, less often.", "Cards work in malls, hotels and chains; markets and stalls are cash only.", "Tell your bank you're travelling; carry a backup card."], M, yl, colW, { accent: terra });

    yr = subhead(p, "What it costs (per day, per person)", x2, yr, sage);
    const cols = [{ h: "Style", w: colW * 0.34 }, { h: "Approx / day", w: colW * 0.34 }, { h: "Looks like", w: colW * 0.32 }];
    const rows = [["Backpacker", "THB 900–1,500", "Hostels, street food, scooters"], ["Comfort", "THB 2,500–4,500", "Nice guesthouses, some flights"], ["Boutique", "THB 6,000+", "Design hotels, drivers, spas"]];
    yr = table(p, x2, yr, cols, rows, { rowH: 22, fontSize: 9 }) - 8;
    yr = subhead(p, "Rough prices to anchor on", x2, yr, sage);
    yr = bullets(p, ["Street meal: THB 50–80", "Local beer: THB 70–100", "Scooter hire: THB 200–300/day", "Litre of petrol: ≈THB 40", "Guesthouse double: THB 600–1,200", "Long-distance train: THB 200–900"], x2, yr, colW, { accent: sage });
    yr -= 6; tracked(p, "TIPPING", x2, yr, { size: 8, font: NB, color: terra, tracking: 1.6 });
    para(p, "Not expected, but rounding up or leaving THB 20–50 is a kind gesture.", x2, yr - 14, colW, { size: 9.5, font: SI, color: sub, leading: 12.5 });
  }, "Visas & Money");
}

function driving() {
  pageW("05", "On the road", "Driving in Thailand", blue, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "The non-negotiables", M, yl);
    yl = bullets(p, ["Carry an International Driving Permit (IDP) plus your home licence — police checkpoints are common and your insurance depends on it.", "Drive on the LEFT. The unwritten rule is 'give way to bigger' — buses and trucks rule.", "Helmets are mandatory on scooters (and life-saving). Wear closed shoes.", "Avoid night driving: unlit vehicles, animals and potholes."], M, yl, colW, { accent: blue }) - 6;
    yl = subhead(p, "Checkpoints & police", M, yl);
    yl = bullets(p, ["Routine stops are normal — be calm and polite, show IDP + licence.", "Small on-the-spot fines for minor infractions happen; ask for a receipt.", "Keep digital and paper copies of your documents."], M, yl, colW, { accent: blue });

    yr = subhead(p, "Roads & navigation", x2, yr, sage);
    yr = bullets(p, ["Highways are good; mountain roads are narrow and twisty but paved.", "Fuel stations (PTT, Bangchak) are frequent — but fill up before remote stretches.", "Download offline maps (Google offline or Maps.me); signal drops in the hills.", "Petrol stops often have clean toilets, Café Amazon coffee and a 7-Eleven."], x2, yr, colW, { accent: sage }) - 6;
    yr = subhead(p, "If something goes wrong", x2, yr, terra);
    yr = bullets(p, ["Stay at the scene; call 1669 (ambulance) or 191 (police) if needed.", "Photograph everything for insurance before moving vehicles.", "Tourist Police (English): 1155.", "Your travel insurance must explicitly cover motorbikes."], x2, yr, colW, { accent: terra });
    yr -= 4; p.drawRectangle({ x: x2, y: yr - 26, width: colW, height: 38, color: panel, borderColor: hair, borderWidth: 0.8 });
    para(p, "Confidence on two wheels? The north is bliss. Not sure? Hire a small car — air-con is a gift in the heat.", x2 + 10, yr - 4, colW - 20, { size: 9, font: SI, color: ink, leading: 12 });
  }, "Driving");
}

function renting() {
  pageW("06", "On the road", "Renting a scooter or car", sage, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Scooter / motorbike", M, yl, terra);
    yl = para(p, "The classic way to ride the northern loops — cheap (≈THB 200–300/day) and freeing. For mountains, choose a 150cc+ (semi-) automatic; a 125cc struggles on steep grades two-up.", M, yl, colW, { leading: 13 }) - 6;
    yl = subhead(p, "Before you ride off — check", M, yl);
    yl = bullets(p, ["Brakes, tyres, lights and horn all work.", "Photograph every existing scratch with the owner.", "A helmet that actually fits (bring your own if fussy).", "Never hand over your passport as deposit — pay cash instead.", "Fuel level — return it as you got it."], M, yl, colW, { accent: sage });

    yr = subhead(p, "Car hire", x2, yr, blue);
    yr = para(p, "Safer for families and the rainy season. From ≈THB 900–1,400/day. International desks (Avis, Budget, local firms) sit at every major airport. Book ahead in high season.", x2, yr, colW, { leading: 13 }) - 6;
    yr = subhead(p, "Insurance — read this", x2, yr, terra);
    yr = bullets(p, ["Take the fullest cover offered; understand the excess.", "Photograph the car all round before leaving the lot.", "Your home/credit-card insurance rarely covers Thailand — check.", "For scooters, most travel policies need a valid motorcycle licence + IDP to pay out."], x2, yr, colW, { accent: terra });
    yr -= 6; yr = subhead(p, "Apps that help", x2, yr, sage);
    yr = bullets(p, ["Grab — taxis & food when you'd rather not drive.", "Google Maps (download offline regions).", "Bolt — ride-hailing in big cities."], x2, yr, colW, { accent: sage });
  }, "Renting");
}

function safety() {
  pageW("07", "Look after yourself", "Staying safe & healthy", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Health", M, yl, sage);
    yl = bullets(p, ["Tap water isn't drinkable — buy big bottles or carry a filter. Ice in cafés is generally fine.", "Eat where locals queue and food is cooked fresh and hot.", "Pack rehydration salts, plasters, antiseptic, anti-diarrhoeals and your own meds.", "Mosquito repellent (DEET) dusk & dawn; consider it for dengue, not just comfort.", "Check vaccination advice with a travel clinic 6–8 weeks ahead."], M, yl, colW, { accent: sage }) - 6;
    yl = subhead(p, "Emergency numbers", M, yl, terra);
    yl = bullets(p, ["Police 191 · Ambulance 1669", "Tourist Police (English) 1155", "Tourist info (TAT) 1672"], M, yl, colW, { accent: terra });

    yr = subhead(p, "Common scams — smile & decline", x2, yr, ochre);
    yr = bullets(p, ["'The temple/palace is closed today' — it isn't; the tout has a gem shop to show you.", "Tuk-tuk 'tours' for almost nothing — they detour to commission stops.", "Rigged taxi meters — insist on the meter or agree a price first.", "Jet-ski / scooter 'damage' claims — photograph everything at pickup.", "Over-friendly strangers with card games or 'free' drinks."], x2, yr, colW, { accent: ochre }) - 6;
    yr = subhead(p, "Sensible & safe", x2, yr, blue);
    yr = bullets(p, ["Thailand is generally very safe; petty theft is the main risk.", "Use hotel safes; keep a card and some cash separate.", "Women travel widely and easily — usual night-time common sense applies.", "Respect the sea: heed red flags and rip-current warnings."], x2, yr, colW, { accent: blue });
  }, "Safety & Health");
}

function connectivity() {
  pageW("08", "Stay connected", "Connectivity & apps", blue, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Getting online", M, yl);
    yl = bullets(p, ["Buy a tourist SIM (AIS, TrueMove, dtac) at the airport, or load an eSIM before you fly.", "Data is fast, generous and cheap (tourist packs from ≈THB 200).", "4G/5G coverage is excellent — except deep in the mountains, hence offline maps.", "Most cafés and guesthouses have free Wi-Fi."], M, yl, colW, { accent: blue });

    yr = subhead(p, "Apps worth installing", x2, yr, sage);
    const apps = [["Grab", "rides + food delivery"], ["Google Maps", "with offline regions saved"], ["Google Translate", "Thai pack + camera mode"], ["Bolt", "ride-hailing in cities"], ["XE / a currency app", "quick baht conversions"], ["Klook", "tickets & day tours"], ["12Go", "trains, buses, ferries"], ["LINE", "how Thais message"]];
    let yy = yr; for (const [a, d] of apps) { yy = entry(p, a, "— " + d, x2, yy, colW, { size: 10, leading: 15 }); }
  }, "Connectivity");
}

function culture() {
  pageW("09", "Respect", "Culture & etiquette", sage, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Do", M, yl, sage);
    yl = bullets(p, ["Return a 'wai' (palms together) with a smile.", "Dress modestly at temples — shoulders and knees covered.", "Remove shoes before entering homes and temples.", "Keep calm; a smile defuses almost anything.", "Use your right hand (or both) to give and receive."], M, yl, colW, { accent: sage }) - 6;
    yl = subhead(p, "Don't", M, yl, terra);
    yl = bullets(p, ["Touch anyone's head — even a child's.", "Point your feet at people or Buddha images.", "Raise your voice or show anger ('losing face').", "Disrespect the monarchy — it's against the law.", "Step over food or people sitting on the floor."], M, yl, colW, { accent: terra });

    yr = subhead(p, "At the temple (wat)", x2, yr, blue);
    yr = bullets(p, ["Cover up, remove shoes and hat, lower your voice.", "Women should not touch monks or hand things directly to them.", "Sit with feet tucked behind you, not pointing at the Buddha.", "A small donation for upkeep is welcome."], x2, yr, colW, { accent: blue }) - 6;
    yr = subhead(p, "Good to understand", x2, yr, ochre);
    yr = para(p, "'Sanuk' (fun) and 'jai yen' (a cool heart) are guiding ideas: Thais value good humour and composure. 'Mai pen rai' — never mind, it's fine — is a whole philosophy. Match the easy warmth you're shown and doors open everywhere.", x2, yr, colW, { leading: 13.5 });
  }, "Culture");
}

function phrasebook() {
  pageW("10", "Language", "A Thai phrasebook", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Essentials", M, y0);
    const ess = [["Hello", "sawatdee (khrap/kha)"], ["Thank you", "khop khun (khrap/kha)"], ["Yes / No", "chai / mai chai"], ["Please", "karuna"], ["Sorry / excuse me", "khor thot"], ["You're welcome", "mai pen rai"], ["Do you speak English?", "phut angkrit dai mai?"], ["I don't understand", "mai khao jai"]];
    for (const [a, b] of ess) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14 });
    yl -= 4; yl = subhead(p, "Getting around", M, yl, blue);
    const go = [["Where is…?", "…yu thi nai?"], ["How much?", "tao rai?"], ["Too expensive", "phaeng pai"], ["Turn left / right", "liao sai / liao khwa"], ["Stop here", "jort thi ni"], ["Petrol station", "pam nam man"]];
    for (const [a, b] of go) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14 });

    let yr = subhead(p, "Numbers", x2, y0, sage);
    const nums = "1 nung · 2 song · 3 sam · 4 si · 5 ha · 6 hok · 7 jet · 8 paet · 9 kao · 10 sip · 20 yi-sip · 100 nung roi · 1,000 nung phan";
    yr = para(p, nums, x2, yr, colW, { size: 9.5, leading: 14 }) - 6;
    yr = subhead(p, "At the table", x2, yr, ochre);
    const food = [["Delicious!", "aroi!"], ["Not spicy, please", "mai phet"], ["A little spicy", "phet nit noi"], ["Vegetarian", "mangsawirat / jay"], ["No fish sauce", "mai sai nam pla"], ["The bill, please", "check bin"], ["Water", "nam plao"], ["Cheers!", "chon kaew!"]];
    for (const [a, b] of food) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14 });
    yr -= 4; yr = subhead(p, "Emergencies", x2, yr, terra);
    const em = [["Help!", "chuay duay!"], ["Hospital", "rong phayaban"], ["Police", "tamruat"], ["I'm lost", "chan long thang"]];
    for (const [a, b] of em) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14 });
    hline(p, M, W - M, 70); text(p, "Men end sentences politely with 'khrap', women with 'kha'. Thai is tonal — say it with a smile and you'll be understood.", M, 58, { size: 9, font: SI, color: sub });
  }, "Phrasebook");
}

function eating() {
  pageW("11", "Eat well", "Eating in Thailand", ochre, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "How street food works", M, yl);
    yl = bullets(p, ["The best meals come from carts and tiny shophouses — follow the crowds of locals.", "Many stalls cook one dish brilliantly; point if you can't pronounce it.", "Sit, eat, pay after. A bowl of noodles is THB 50–80.", "Markets cluster at dawn and dusk — go hungry."], M, yl, colW, { accent: ochre }) - 6;
    yl = subhead(p, "Spice & how to order", M, yl, terra);
    yl = bullets(p, ["'Mai phet' = not spicy; 'phet nit noi' = a little. Thai 'a little' is still a lot.", "Condiments on the table: fish sauce, chilli, sugar, vinegar — season to taste.", "Rice ('khao') is the centre of every meal."], M, yl, colW, { accent: terra });

    yr = subhead(p, "Vegetarian & allergies", x2, yr, sage);
    yr = bullets(p, ["'Mangsawirat' = vegetarian; 'jay' = strict vegan (no garlic/onion), look for the yellow-red 'เจ' flag.", "Fish sauce and shrimp paste hide everywhere — say 'mai sai nam pla / mai sai kapi'.", "Peanuts are common; carry a translation card for serious allergies."], x2, yr, colW, { accent: sage }) - 6;
    yr = subhead(p, "Drinks to try", x2, yr, blue);
    yr = bullets(p, ["Cha yen — sweet orange iced tea.", "Nam manao — fresh lime soda.", "Fresh fruit shakes (ask 'mai sai nam tan' for no sugar).", "Singha, Chang & Leo — the local beers, served very cold.", "Roadside coffee — Café Amazon is everywhere."], x2, yr, colW, { accent: blue });
    text(p, "Turn the page for a region-by-region glossary of what to order.", M, 58, { size: 9.5, font: SI, color: sub });
  }, "Eating");
}

function dishes() {
  pageW("11", "Eat well", "A glossary of dishes", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "The North", M, y0, terra);
    const north = [["Khao soi", "the crowning dish — egg noodles in a coconut-curry broth, crisp noodles on top"], ["Sai ua", "herby grilled Chiang Mai sausage"], ["Nam prik num", "smoky green-chilli dip with sticky rice & veg"], ["Gaeng hang lay", "rich Burmese-style pork curry"], ["Khanom jeen", "fermented rice noodles with curry"]];
    for (const [a, b] of north) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    yl -= 4; yl = subhead(p, "Central & Bangkok", M, yl, blue);
    const central = [["Pad krapow", "holy-basil stir-fry with a fried egg — the nation's comfort food"], ["Tom yum goong", "hot-and-sour prawn soup"], ["Pad thai", "the famous wok noodles"], ["Khao man gai", "Hainanese chicken & rice"], ["Massaman", "mild, fragrant curry of Persian roots"]];
    for (const [a, b] of central) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;

    let yr = subhead(p, "Isaan (North-East)", x2, y0, sage);
    const isaan = [["Som tam", "pounded green-papaya salad — order 'nit noi phet'!"], ["Larb", "zingy minced-meat salad with herbs & toasted rice"], ["Gai yang", "marinated grilled chicken"], ["Sai krok Isan", "sour fermented pork sausage"], ["Khao niao", "sticky rice — eaten by hand with everything"]];
    for (const [a, b] of isaan) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    yr -= 4; yr = subhead(p, "The South & sweets", x2, yr, ochre);
    const south = [["Gaeng tai pla", "intense southern fish-curry — for the brave"], ["Khao yam", "herbal rice salad"], ["Massaman / seafood", "coconut-rich curries, fresh from the sea"], ["Mango sticky rice", "khao niao mamuang — the dessert"], ["Roti", "griddled banana-and-egg pancake, street-side"]];
    for (const [a, b] of south) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
  }, "Dishes");
}

function routesOverview() {
  pageW("12", "The journeys", "The four great routes", blue, (p, y0) => {
    // map left
    const nodes = [
      { key: "cnx", name: "Chiang Mai", x: 0.45, y: 0.93, big: true }, { key: "pai", name: "Pai", x: 0.34, y: 0.99 },
      { key: "mhs", name: "Mae Hong Son", x: 0.16, y: 0.9, lx: -78, ly: 4 }, { key: "bkk", name: "Bangkok", x: 0.5, y: 0.5, big: true },
      { key: "kan", name: "Kanchanaburi", x: 0.33, y: 0.53, lx: -86 }, { key: "kyai", name: "Khao Yai", x: 0.62, y: 0.56 },
      { key: "isn", name: "Isaan", x: 0.78, y: 0.66, lx: 6 }, { key: "krabi", name: "Krabi", x: 0.42, y: 0.13 },
      { key: "phuket", name: "Phuket", x: 0.34, y: 0.1, lx: -44 },
    ];
    const routes = [{ color: terra, keys: ["cnx", "pai", "mhs", "cnx"], loop: false }, { color: blue, keys: ["bkk", "krabi", "phuket"] }, { color: sage, keys: ["bkk", "kyai", "isn"] }, { color: ochre, keys: ["bkk", "kan"] }];
    drawMap(p, M + 30, 150, CW * 0.42, H - M - 110 - 150, nodes, routes);
    text(p, "Schematic — not to scale", M + 30, 132, { size: 8, font: SI, color: sub });
    // table right
    const x2 = M + CW * 0.5; const tw = CW * 0.5;
    let y = y0;
    const cols = [{ h: "Route", w: tw * 0.34 }, { h: "Days", w: tw * 0.16 }, { h: "Best for", w: tw * 0.5 }];
    const rows = [["1 · Mae Hong Son Loop", "5–7", "Mountains, villages, the classic ride"], ["2 · Andaman Coast", "5–8", "Beaches, karsts, island-hopping"], ["3 · Isaan & Mekong", "6–9", "Khmer ruins, food, the road less travelled"], ["4 · Bangkok–Kanchanaburi", "3–4", "Waterfalls, history, an easy first trip"]];
    y = table(p, x2, y, cols, rows, { rowH: 30, fontSize: 9 }) - 10;
    y = subhead(p, "Pick your pace", x2, y, sage);
    para(p, "Short on time? Combine route 4 with a few Bangkok days. Two weeks? The Mae Hong Son Loop plus the north. A month? Link the north to the islands by an internal flight and drive both ends.", x2, y, tw - 6, { leading: 13.5 });
  }, "Routes");
}

function loopIntro() {
  pageW("13", "Route 1", "The Mae Hong Son Loop", terra, (p, y0) => {
    const nodes = [
      { key: "cnx", name: "Chiang Mai", x: 0.62, y: 0.5, big: true, lx: 9 }, { key: "pai", name: "Pai", x: 0.4, y: 0.86, big: true },
      { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.66, big: true, lx: -94 }, { key: "khun", name: "Khun Yuam", x: 0.18, y: 0.4 },
      { key: "sariang", name: "Mae Sariang", x: 0.26, y: 0.16, lx: -76 }, { key: "chaem", name: "Mae Chaem", x: 0.52, y: 0.2 }, { key: "inth", name: "Doi Inthanon", x: 0.66, y: 0.3, lx: 9 },
    ];
    drawMap(p, M + CW * 0.5, 150, CW * 0.5, H - M - 96 - 150, nodes, [{ color: terra, keys: ["cnx", "pai", "mhs", "khun", "sariang", "chaem", "inth", "cnx"], loop: true }]);
    const tx = M, tw = CW * 0.46;
    let y = para(p, "Thailand's most loved drive traces a great circle through the north-western mountains from Chiang Mai — famous for its 1,864 marked curves (there's a sticker to prove you survived them).", tx, y0, tw, { leading: 14 }) - 8;
    y = para(p, "But the joy is in going slowly: dawn mist pooling in the valleys, roadside coffee, waterfalls, hot springs, and Shan-culture towns that feel a world away from Bangkok.", tx, y, tw, { leading: 14 }) - 10;
    y = subhead(p, "At a glance", tx, y);
    const facts = [["Distance", "≈600 km"], ["Duration", "5–7 days (we suggest 7)"], ["Start / end", "Chiang Mai"], ["Direction", "Anti-clockwise (Pai first)"], ["Vehicle", "Scooter 150cc+ or small car"], ["Season", "Nov – Feb"], ["Don't miss", "Tham Lod cave, Doi Inthanon"]];
    for (const [k, v] of facts) { text(p, k, tx, y, { size: 9.5, font: NB, color: ink }); text(p, v, tx + 86, y, { size: 9.5, font: SF, color: sub }); hline(p, tx, tx + tw, y - 6, { thickness: 0.4 }); y -= 21; }
  }, "Mae Hong Son Loop");
}

function dayCard(p, x, y, w, day, accent) {
  p.drawRectangle({ x, y: y - day.h, width: w, height: day.h + 14, color: white, borderColor: hair, borderWidth: 0.8 });
  p.drawRectangle({ x, y: y - day.h, width: 3, height: day.h + 14, color: accent });
  tracked(p, day.no.toUpperCase(), x + 14, y - 2, { size: 8, font: NB, color: accent, tracking: 1.6 });
  text(p, day.title, x + 14, y - 20, { size: 13, font: SB, color: ink });
  text(p, day.leg, x + w - 14 - SN.widthOfTextAtSize(day.leg, 9), y - 18, { size: 9, font: SN, color: sub });
  let yy = para(p, day.body, x + 14, y - 38, w - 28, { size: 9.5, font: SF, color: ink, leading: 13 });
  if (day.eat) { text(p, "Eat — ", x + 14, yy - 2, { size: 9, font: NB, color: terra }); para(p, day.eat, x + 14 + 32, yy - 2, w - 28 - 32, { size: 9, font: SF, color: sub, leading: 12 }); yy -= 15; }
  if (day.stay) { text(p, "Stay — ", x + 14, yy - 2, { size: 9, font: NB, color: sage }); para(p, day.stay, x + 14 + 36, yy - 2, w - 28 - 36, { size: 9, font: SF, color: sub, leading: 12 }); }
}
function loopDays(list, label, tail) {
  const p = newPage(); header(p, "13", "Route 1 · Day by day", "The Mae Hong Son Loop", terra);
  let y = H - M - 84;
  for (const d of list) { dayCard(p, M, y, CW, d, terra); y -= d.h + 26; }
  if (tail) { y -= 2; tracked(p, tail.h.toUpperCase(), M, y, { size: 8.5, font: NB, color: sage, tracking: 1.8 }); bullets(p, tail.items, M, y - 18, CW, { accent: sage }); }
  footer(p, label);
}

function simpleRoute(num, tag, title, accent, intro, nodes, routeKeys, days, label) {
  const p = newPage(); header(p, num, tag, title, accent);
  let y = para(p, intro, M, H - M - 88, CW * 0.54, { leading: 14 });
  drawMap(p, M + CW * 0.58, 150, CW * 0.42, H - M - 96 - 150, nodes, [{ color: accent, keys: routeKeys }]);
  y -= 8; y = subhead(p, "The drive, day by day", M, y, accent);
  for (const [d, t, body] of days) {
    text(p, d, M, y, { size: 10, font: NB, color: accent }); text(p, t, M + 52, y, { size: 11, font: SB, color: ink });
    y = para(p, body, M, y - 15, CW * 0.54, { size: 9.5, leading: 13 }) - 8;
  }
  footer(p, label);
}

function responsible() {
  pageW("15", "Travel kindly", "Responsible travel", sage, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Animals", M, yl, terra);
    yl = bullets(p, ["Don't ride elephants or visit shows. Choose genuine sanctuaries where elephants roam and are never ridden — research before you book.", "Avoid tiger selfies and any 'photo with a drugged animal'.", "Don't feed wild monkeys; secure your food and shiny things."], M, yl, colW, { accent: terra }) - 6;
    yl = subhead(p, "Communities", M, yl, sage);
    yl = bullets(p, ["Buy from local markets, family kitchens and village artisans.", "Ask before photographing people, especially hill-tribe elders.", "Learn a few Thai words — it's met with real warmth.", "Hire local guides; spread your spending beyond the resorts."], M, yl, colW, { accent: sage });

    yr = subhead(p, "The planet", x2, yr, blue);
    yr = bullets(p, ["Refill a bottle — plastic waste is a real problem here.", "Reef-safe sunscreen when you snorkel or dive.", "Never touch or stand on coral; keep your distance from marine life.", "Take tuk-tuks and songthaews; combine errands to cut trips.", "Carry out your litter on remote roads and trails."], x2, yr, colW, { accent: blue }) - 6;
    yr = subhead(p, "At temples & sacred sites", x2, yr, ochre);
    yr = bullets(p, ["Dress and behave modestly; never climb on ruins or Buddha images.", "A small donation keeps these places alive.", "Quiet, please — they are places of worship, not just photos."], x2, yr, colW, { accent: ochre });
    yr -= 6; p.drawRectangle({ x: x2, y: yr - 28, width: colW, height: 40, color: panel, borderColor: hair, borderWidth: 0.8 });
    para(p, "The slow traveller's creed: take only photos, leave only footprints, and spend where it stays local.", x2 + 10, yr - 6, colW - 20, { size: 9, font: SI, color: ink, leading: 12 });
  }, "Responsible");
}

function inspiration() {
  pageW("16", "Get in the mood", "Inspiration & reading", ochre, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Read before you go", M, yl, terra);
    const books = [["Sightseeing", "Rattawut Lapcharoensap — luminous Thai short stories"], ["Bangkok 8", "John Burdett — atmospheric crime thriller"], ["The Beach", "Alex Garland — the backpacker myth, for better or worse"], ["Very Thai", "Philip Cornwel-Smith — the brilliant book of everyday culture"], ["Fieldwork", "Mischa Berlinski — the hills of the north"]];
    for (const [a, b] of books) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    yl -= 4; yl = subhead(p, "Watch", M, yl, blue);
    const films = [["Uncle Boonmee…", "Apichatpong's dreamlike Palme d'Or winner"], ["Only God Forgives", "neon-soaked Bangkok noir"], ["Chef's Table / street-food docs", "for the appetite"]];
    for (const [a, b] of films) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;

    yr = subhead(p, "A glossary of terms", x2, yr, sage);
    const g = [["wat", "temple"], ["soi", "side-street / lane"], ["songthaew", "shared pick-up taxi"], ["tuk-tuk", "three-wheeled taxi"], ["khao", "rice / hill"], ["nam", "water / river"], ["doi", "mountain (northern)"], ["talat", "market"], ["farang", "foreigner (not rude)"], ["mai pen rai", "never mind, it's fine"], ["sanuk", "fun — a core value"], ["jai yen", "a cool, calm heart"]];
    for (const [a, b] of g) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
  }, "Inspiration");
}

// ---------- Fillable planning pages ----------
function bucketList() {
  pageW("17", "Plan your trip", "Thailand bucket list", sage, (p) => {
    center(p, "Tick off the experiences as you go.", H - M - 76, { size: 12, font: SI, color: sub });
    const items = ["Survive all 1,864 curves of the Mae Hong Son Loop", "Watch dawn mist fill the valley near Pai", "Soak in a natural hot spring after a ride", "Slurp khao soi in Chiang Mai", "Stand on Thailand's roof at Doi Inthanon", "Release a lantern at Yi Peng / Loy Krathong", "Share sticky rice with a hill-tribe family", "Ride a long-tail through Andaman karsts", "Take a Thai cooking class", "Give alms to monks at sunrise", "Temple-hop the ruins of Ayutthaya", "Find an empty beach with no name", "Kayak the jungle lake at Khao Sok", "Eat at a night market until you can't move", "Cross the Mon bridge at Sangkhlaburi", "Learn to say 'aroi!' and mean it"];
    const colX = [M, M + CW / 2 + 12], colW = CW / 2 - 12; let yy = [H - M - 100, H - M - 100];
    items.forEach((it, i) => { const c = i % 2; checkRow(p, colX[c], yy[c], it, colW, [terra, sage, blue, ochre][i % 4]); yy[c] -= 28; });
  }, "Bucket List");
}
function tripOverview() {
  pageW("17", "Plan your trip", "Trip overview", terra, (p, y0) => {
    const half = (CW - 24) / 2; let y = y0 - 8;
    field(p, M, y, half, { label: "Trip name" }); field(p, M + half + 24, y, half, { label: "Travellers" }); y -= 54;
    const t3 = (CW - 48) / 3;
    field(p, M, y, t3, { label: "Arrive" }); field(p, M + t3 + 24, y, t3, { label: "Depart" }); field(p, M + (t3 + 24) * 2, y, t3, { label: "Nights" }); y -= 54;
    field(p, M, y, half, { label: "Regions / routes" }); field(p, M + half + 24, y, half, { label: "Total budget" }); y -= 54;
    field(p, M, y, half, { label: "Flights in / out" }); field(p, M + half + 24, y, half, { label: "Vehicle" }); y -= 70;
    panelField(p, M, y - 70, CW, 82, { label: "Must-do experiences" }); y -= 100;
    panelField(p, M, y - 60, CW, 72, { label: "Notes" });
  }, "Trip Overview");
}
function budgetPage() {
  pageW("17", "Plan your trip", "Trip budget", sage, (p, y0) => {
    const cats = ["Flights", "Vehicle rental", "Fuel", "Accommodation", "Food & drink", "Activities & tours", "Entry / visa", "SIM & extras", "Shopping", "Buffer"];
    const colP = M + CW * 0.52, colA = M + CW * 0.77, cwn = CW * 0.2; let y = y0;
    tracked(p, "CATEGORY", M, y, { size: 8, font: NB, color: sub, tracking: 1.6 }); tracked(p, "PLANNED", colP, y, { size: 8, font: NB, color: sub, tracking: 1.6 }); tracked(p, "ACTUAL", colA, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
    y -= 12; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 24;
    for (const c of cats) { text(p, c, M, y, { size: 11.5, font: SF, color: ink }); field(p, colP, y - 2, cwn); field(p, colA, y - 2, cwn); y -= 30; }
    y -= 2; p.drawRectangle({ x: M - 8, y: y - 10, width: CW + 16, height: 32, color: panel });
    tracked(p, "TOTAL", M, y, { size: 10, font: NB, color: terra, tracking: 2 }); field(p, colP, y - 2, cwn); field(p, colA, y - 2, cwn);
  }, "Budget");
}
function itineraryGrid() {
  pageW("17", "Plan your trip", "Itinerary at a glance", blue, (p, y0) => {
    text(p, "A bird's-eye view of your whole trip — one line per day.", M, y0 + 6, { size: 11, font: SI, color: sub });
    const cols = [{ h: "Day", w: CW * 0.08 }, { h: "Date", w: CW * 0.16 }, { h: "From – To", w: CW * 0.3 }, { h: "Sleep", w: CW * 0.22 }, { h: "Notes", w: CW * 0.24 }];
    let y = y0 - 16; let cx = M;
    cols.forEach((c) => { tracked(p, c.h.toUpperCase(), cx, y, { size: 7.5, font: NB, color: blue, tracking: 1.2 }); cx += c.w; });
    y -= 8; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 24;
    for (let i = 0; i < 14; i++) {
      cx = M; text(p, String(i + 1), M, y, { size: 10, font: SB, color: sub }); cx += cols[0].w;
      for (let j = 1; j < cols.length; j++) { field(p, cx, y, cols[j].w - 8); cx += cols[j].w; }
      y -= 38;
    }
  }, "Itinerary");
}
function staysLog() {
  pageW("17", "Plan your trip", "Stays & reservations", ochre, (p, y0) => {
    const cols = [{ h: "Place / town", w: CW * 0.26 }, { h: "Accommodation", w: CW * 0.28 }, { h: "Dates", w: CW * 0.18 }, { h: "Confirmation #", w: CW * 0.28 }];
    let y = y0; let cx = M;
    cols.forEach((c) => { tracked(p, c.h.toUpperCase(), cx, y, { size: 7.5, font: NB, color: ochre, tracking: 1.2 }); cx += c.w; });
    y -= 8; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 24;
    for (let i = 0; i < 16; i++) { cx = M; for (const c of cols) { field(p, cx, y, c.w - 8); cx += c.w; } y -= 34; }
  }, "Stays");
}
function packingPage() {
  pageW("17", "Plan your trip", "Packing for Thailand", terra, (p, y0) => {
    const groups = [["Riding & safety", terra, ["Helmet (or hire a good one)", "Light gloves", "Sunglasses", "Rain poncho", "Closed shoes"]], ["Tropical kit", sage, ["High-SPF, reef-safe sunscreen", "Insect repellent (DEET)", "Reusable water bottle", "Quick-dry clothes", "Sarong / scarf", "Flip-flops"]], ["Health", blue, ["Travel insurance docs", "Rehydration salts", "Basic first-aid kit", "Anti-diarrhoeals", "Hand sanitiser", "Personal meds"]], ["Documents & tech", ochre, ["IDP + driving licence", "Passport + copies", "Offline maps saved", "Power bank", "Universal adapter", "Spare card + cash"]]];
    const colX = [M, M + CW / 2 + 12], colW = CW / 2 - 12; const startY = y0; let y = startY;
    groups.forEach(([title, accent, items], gi) => {
      const col = gi < 2 ? 0 : 1; if (col === 1 && gi === 2) y = startY;
      const x = colX[col]; tracked(p, title.toUpperCase(), x, y, { size: 9, font: NB, color: accent, tracking: 2 });
      let yy = y - 20; for (const it of items) { checkRow(p, x, yy, it, colW, accent); yy -= 23; } y = yy - 14;
    });
  }, "Packing");
}
function dailyPlan() {
  pageW("17", "Plan your trip", "Daily plan", sage, (p, y0) => {
    text(p, "Copy or reprint for each day on the road.", M, y0 + 6, { size: 11, font: SI, color: sub });
    const half = (CW - 24) / 2; let y = y0 - 24;
    field(p, M, y, half, { label: "Day / date" }); field(p, M + half + 24, y, half, { label: "Route — from / to" }); y -= 50;
    const t3 = (CW - 48) / 3;
    field(p, M, y, t3, { label: "Distance" }); field(p, M + t3 + 24, y, t3, { label: "Driving time" }); field(p, M + (t3 + 24) * 2, y, t3, { label: "Overnight" }); y -= 40;
    panelField(p, M, y - 92, CW, 104, { label: "Stops & sights along the way" }); y -= 120;
    panelField(p, M, y - 58, half, 70, { label: "Where to eat" }); panelField(p, M + half + 24, y - 58, half, 70, { label: "Notes & memories" });
  }, "Daily Plan");
}
function journalPage() {
  pageW("17", "Plan your trip", "Travel journal", terra, (p, y0) => {
    const half = (CW - 24) / 2; let y = y0 - 6;
    field(p, M, y, half, { label: "Date" }); field(p, M + half + 24, y, half, { label: "Where / mood" }); y -= 44;
    center(p, "“The journey itself is the reward.”", y - 4, { size: 12, font: SI, color: sub }); y -= 26;
    panelField(p, M, y - 150, CW, 162, { label: "Today's story" }); y -= 180;
    panelField(p, M, y - 56, half, 68, { label: "Best bite" }); panelField(p, M + half + 24, y - 56, half, 68, { label: "Discovery" });
  }, "Journal");
}
function notesPage() {
  pageW("17", "Plan your trip", "Notes", blue, (p, y0) => {
    let y = y0; for (let i = 0; i < 22; i++) { hline(p, M, W - M, y, { thickness: 0.5 }); y -= 26; }
    const tf = form.createTextField(uid("f")); tf.enableMultiline(); tf.addToPage(p, { x: M, y: y + 8, width: CW, height: y0 - y, borderWidth: 0, backgroundColor: paper, font: SN }); tf.setFontSize(11);
  }, "Notes");
}
function back() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  globe(p, W / 2, H / 2 + 78, 24, terra, 1);
  center(p, "Chok dee", H / 2 + 6, { size: 40, font: D, color: ink });
  center(p, "Good luck, and enjoy every curve.", H / 2 - 28, { size: 13, font: SI, color: sub });
  trackedCenter(p, "THE SLOW ATLAS  ·  RENNES, FRANCE", 120, { size: 8, font: NB, color: terra, tracking: 3 });
}

// ============================ ROUTE DATA ============================
const DAYS_A = [
  { no: "Day 1", title: "Chiang Mai – Pai", leg: "≈135 km · 3–4 h", h: 84, body: "Ease in with the famous climb to Pai — 762 curves of forest and viewpoints. Stop at Mok Fa waterfall and the roadside coffee stands. Arrive by mid-afternoon for Pai's slow, bohemian rhythm.", eat: "Pai Walking Street night market.", stay: "Pai — riverside bungalows or a hillside guesthouse." },
  { no: "Day 2", title: "Around Pai", leg: "Rest day", h: 80, body: "Park the bike. Catch dawn at Pai Canyon, soak in the Tha Pai hot springs, see the Land Split and the white Wat Phra That Mae Yen for sunset over the valley.", eat: "A long, lazy café breakfast.", stay: "A second night in Pai." },
  { no: "Day 3", title: "Pai – Mae Hong Son", leg: "≈110 km · 3 h", h: 80, body: "The quietest, prettiest leg. Detour to Tham Lod cave (by bamboo raft and lantern) and the Su Tong Pae bamboo bridge. Mae Hong Son is a calm, Shan-flavoured town ringed by mountains.", eat: "Lakeside stalls by Nong Jong Kham at dusk.", stay: "Mae Hong Son, near the lake." },
];
const DAYS_B = [
  { no: "Day 4", title: "Mae Hong Son – Khun Yuam – Mae Sariang", leg: "≈160 km · 4 h", h: 84, body: "Climb to Ban Rak Thai, a Yunnanese tea village near the Myanmar border, for breakfast among the hills. Roll south via Khun Yuam's poignant WWII museum to sleepy, riverside Mae Sariang.", eat: "Thai-Shan cooking in Mae Sariang.", stay: "Mae Sariang, by the Yuam river." },
  { no: "Day 5", title: "Mae Sariang – Mae Chaem", leg: "≈170 km · 4–5 h", h: 80, body: "A remote, beautiful stretch — fuel up first. The road winds through forest and rice terraces to Mae Chaem, a traditional weaving town few travellers reach. Quiet nights, big stars.", eat: "Simple local kitchens — point and smile.", stay: "Mae Chaem — homestay or guesthouse." },
];
const DAYS_C = [
  { no: "Day 6", title: "Mae Chaem – Doi Inthanon – Chiang Mai", leg: "≈150 km · 4 h", h: 84, body: "Climb to the roof of Thailand (2,565 m): the twin royal pagodas, cloud forest and the Pha Dok Siew waterfall trail. Then descend the eastern side back toward Chiang Mai.", eat: "Karen-grown coffee on the mountain.", stay: "Chiang Mai's old city." },
  { no: "Day 7", title: "Chiang Mai", leg: "Slow finish", h: 80, body: "Reward the ride: a Thai massage, a cooking class, and the old-city temples and Sunday Walking Street. Toast 1,864 curves survived. Chon kaew!", eat: "One last bowl of khao soi.", stay: "Chiang Mai." },
];

async function buildDoc([w, h]) {
  doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Thailand Road Trip Atlas");
  doc.setAuthor("The Slow Atlas");
  doc.setSubject("The complete Thailand road-trip guide & planner");
  doc.setKeywords(["thailand", "road trip", "travel guide", "mae hong son loop", "itinerary", "ebook"]);
  W = w; H = h; M = 50; CW = W - M * 2; nameCounter = 0; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true }); SF = await doc.embedFont(fb.serif, { subset: true });
  SB = await doc.embedFont(fb.serifB, { subset: true }); SI = await doc.embedFont(fb.serifI, { subset: true });
  SN = await doc.embedFont(fb.sans, { subset: true }); NB = await doc.embedFont(fb.sansB, { subset: true });
  form = doc.getForm();

  cover(); contents(); inBrief(); regions1(); regions2(); whenToGo(); visasMoney();
  driving(); renting(); safety(); connectivity(); culture(); phrasebook(); eating(); dishes();
  routesOverview(); loopIntro();
  loopDays(DAYS_A, "Loop · Days 1–3");
  loopDays(DAYS_B, "Loop · Days 4–5", { h: "Loop wisdom", items: ["Ride defensively — locals overtake on blind bends; hug the left.", "Fuel and cash are scarce between towns; top up in Mae Hong Son and Mae Sariang.", "Mornings are clearest for mountain views; afternoons can cloud over."] });
  loopDays(DAYS_C, "Loop · Days 6–7");
  // Route 2 — Andaman
  simpleRoute("14", "Route 2", "The Andaman Coast", blue,
    "Limestone karsts, rainforest and beaches for every mood, strung down Thailand's west coast. Best November to April. Fly into Phuket, drive south, and finish island-slow on Koh Lanta.",
    [{ key: "phuket", name: "Phuket", x: 0.3, y: 0.92, big: true }, { key: "phang", name: "Phang Nga", x: 0.46, y: 0.8 }, { key: "khaosok", name: "Khao Sok", x: 0.6, y: 0.66, lx: 7 }, { key: "krabi", name: "Krabi / Ao Nang", x: 0.55, y: 0.44, lx: 7 }, { key: "lanta", name: "Koh Lanta", x: 0.52, y: 0.2, big: true }],
    ["phuket", "phang", "khaosok", "krabi", "lanta"],
    [["D1–2", "Phuket & Phang Nga Bay", "Old-town shophouses, then a long-tail through James Bond Island's sea-stacks and hidden lagoons."], ["D3–4", "Khao Sok National Park", "Jungle older than the Amazon; kayak the emerald Cheow Lan lake and sleep in a floating raft-house."], ["D5–6", "Krabi, Ao Nang & Railay", "Climbers' karsts, beach bars and a boat to cliff-ringed Railay (reachable only by sea)."], ["D7–8", "Koh Lanta", "Wind down on long, quiet west-coast beaches and the old Lanta town for sunset seafood."]],
    "Andaman Coast");
  // Route 3 — Isaan
  simpleRoute("14", "Route 3", "Isaan & the Mekong", sage,
    "The Thailand few visitors see: Khmer temples older than Angkor, silk villages, fiery food and the great Mekong. Authentic, warm and gloriously cheap. Loop north-east from Bangkok or Khao Yai.",
    [{ key: "kyai", name: "Khao Yai", x: 0.28, y: 0.86, big: true }, { key: "phimai", name: "Phimai", x: 0.4, y: 0.7 }, { key: "phanom", name: "Phanom Rung", x: 0.52, y: 0.52, lx: 7 }, { key: "ubon", name: "Ubon", x: 0.72, y: 0.36, big: true }, { key: "khong", name: "Khong Chiam", x: 0.84, y: 0.46, lx: -64 }, { key: "nongkhai", name: "Nong Khai", x: 0.5, y: 0.9, big: true }],
    ["kyai", "phimai", "phanom", "ubon", "khong", "nongkhai"],
    [["D1–2", "Khao Yai", "Thailand's oldest national park — waterfalls, gibbons, vineyards and elephants in the wild."], ["D3", "Phimai", "A magnificent Khmer temple that pre-dates and inspired Angkor Wat."], ["D4", "Phanom Rung", "A sandstone sanctuary on an extinct volcano, aligned to the rising sun."], ["D5–6", "Ubon & Khong Chiam", "River life where the Mekong meets the Mun, and the 'two-coloured river'."], ["D7–8", "Up the Mekong to Nong Khai", "Riverside sunsets, the surreal Sala Keoku sculpture park, and the road home."]],
    "Isaan");
  // Route 4 — Kanchanaburi
  simpleRoute("14", "Route 4", "Bangkok – Kanchanaburi", ochre,
    "Waterfalls, wartime history and floating markets — the easiest first road trip from the capital, and a beautiful long weekend.",
    [{ key: "bkk", name: "Bangkok", x: 0.78, y: 0.3, big: true }, { key: "npathom", name: "Nakhon Pathom", x: 0.62, y: 0.42 }, { key: "kan", name: "Kanchanaburi", x: 0.42, y: 0.56, big: true }, { key: "erawan", name: "Erawan Falls", x: 0.36, y: 0.74, lx: 7 }, { key: "sangkhla", name: "Sangkhlaburi", x: 0.2, y: 0.9, big: true }],
    ["bkk", "npathom", "kan", "erawan", "sangkhla"],
    [["D1", "Bangkok to Kanchanaburi", "Stop at the giant chedi of Nakhon Pathom; reach the River Kwai by afternoon."], ["D2", "River Kwai & the Death Railway", "The bridge, the moving war museum and cemeteries, and a ride on the cliff-hugging railway."], ["D3", "Erawan National Park", "Climb past seven tiers of turquoise pools — swim in the cool, clear water."], ["D4", "Sangkhlaburi (optional)", "Thailand's longest wooden bridge, a Mon community, and misty lake mornings."]],
    "Kanchanaburi");
  responsible(); inspiration();
  bucketList(); tripOverview(); budgetPage(); itineraryGrid(); staysLog(); packingPage(); dailyPlan(); journalPage(); notesPage();
  back();

  form.updateFieldAppearances(SN);
  return doc.save();
}

async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  for (const [name, size] of [["US-Letter", [612, 792]], ["A4", [595.28, 841.89]]]) {
    const bytes = await buildDoc(size);
    writeFileSync(join(ROOT, "dist", `Thailand-Road-Trip-Atlas-${name}.pdf`), bytes);
    console.log(`Thailand ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
