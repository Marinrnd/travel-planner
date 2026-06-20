/**
 * The Slow Atlas — Thailand: The Complete Guide
 * A rich, magazine-style travel ebook (no planner pages — pure guide).
 * Hand-drawn vector illustrations, section dividers, detailed destinations,
 * ready-to-use itineraries, transport, stays, food, activities, practical
 * tips and a phrasebook. Generates US Letter + A4.
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
const sub = rgb(0.5, 0.475, 0.43), hair = rgb(0.864, 0.832, 0.785);
const panel = rgb(0.953, 0.933, 0.898), terra = rgb(0.725, 0.376, 0.247);
const sage = rgb(0.443, 0.498, 0.376), blue = rgb(0.357, 0.471, 0.529);
const ochre = rgb(0.78, 0.6, 0.27), white = rgb(1, 1, 1);

let doc, W, H, M, CW, PAGE, D, SF, SB, SI, SN, NB;

// ---------- text ----------
const text = (p, s, x, y, { size = 11, font = SN, color = ink, opacity = 1 } = {}) => p.drawText(s, { x, y, size, font, color, opacity });
function tracked(p, s, x, y, { size = 9, font = NB, color = sub, tracking = 1.5 } = {}) { let cx = x; for (const ch of s) { p.drawText(ch, { x: cx, y, size, font, color }); cx += font.widthOfTextAtSize(ch, size) + tracking; } return cx - x - tracking; }
const trackedW = (s, { size = 9, font = NB, tracking = 1.5 } = {}) => { let w = 0; for (const ch of s) w += font.widthOfTextAtSize(ch, size) + tracking; return w - tracking; };
const center = (p, s, y, { size = 11, font = SN, color = ink } = {}) => p.drawText(s, { x: (W - font.widthOfTextAtSize(s, size)) / 2, y, size, font, color });
const trackedCenter = (p, s, y, o = {}) => tracked(p, s, (W - trackedW(s, o)) / 2, y, o);
function para(p, s, x, y, w, { size = 10, font = SF, color = ink, leading = 14 } = {}) {
  let line = "", yy = y;
  for (const word of s.split(" ")) { const t = line ? line + " " + word : word; if (font.widthOfTextAtSize(t, size) > w) { text(p, line, x, yy, { size, font, color }); yy -= leading; line = word; } else line = t; }
  if (line) { text(p, line, x, yy, { size, font, color }); yy -= leading; } return yy;
}
function bullets(p, items, x, y, w, { accent = terra, gap = 4, size = 10, leading = 13.5 } = {}) { let yy = y; for (const it of items) { p.drawCircle({ x: x + 2.2, y: yy + 3.2, size: 1.7, color: accent }); yy = para(p, it, x + 11, yy, w - 11, { size, leading }) - gap; } return yy; }
function entry(p, term, desc, x, y, w, { size = 10, leading = 14 } = {}) {
  let cx = x, yy = y; p.drawText(term, { x: cx, y: yy, size, font: SB, color: ink }); cx += SB.widthOfTextAtSize(term, size) + 5;
  for (const word of desc.split(" ")) { const ww = SF.widthOfTextAtSize(word + " ", size); if (cx + ww > x + w) { yy -= leading; cx = x; } p.drawText(word, { x: cx, y: yy, size, font: SF, color: sub }); cx += ww; } return yy - leading;
}
function subhead(p, s, x, y, accent = terra) { tracked(p, s.toUpperCase(), x, y, { size: 8.5, font: NB, color: accent, tracking: 1.8 }); return y - 18; }
const hline = (p, x1, x2, y, { thickness = 0.7, color = hair } = {}) => p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
const paperBg = (p) => p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });

// ---------- vector illustration kit ----------
function arc(p, cx, cy, rx, ry, a0, a1, { color = ink, w = 1, seg = 26 } = {}) { let prev = null; for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; const pt = { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }; if (prev) p.drawLine({ start: prev, end: pt, thickness: w, color }); prev = pt; } }
const poly = (p, pts, { color = ink, w = 1, close = false } = {}) => { for (let i = 0; i < pts.length - 1; i++) p.drawLine({ start: pts[i], end: pts[i + 1], thickness: w, color }); if (close) p.drawLine({ start: pts.at(-1), end: pts[0], thickness: w, color }); };

function mountains(p, x, baseY, w, h, c, ww = 1) {
  const pk = [[0, 0], [0.16, 0.7], [0.3, 0.25], [0.46, 1], [0.62, 0.4], [0.78, 0.85], [0.9, 0.45], [1, 0.6]];
  poly(p, pk.map(([fx, fy]) => ({ x: x + fx * w, y: baseY + fy * h })), { color: c, w: ww });
}
function temple(p, cx, baseY, s, c, ww = 1) {
  // three-tier Lanna roof + spire
  for (let i = 0; i < 3; i++) { const tw = (1 - i * 0.22) * s, ty = baseY + 0.5 * s + i * 0.34 * s; poly(p, [{ x: cx - tw / 2, y: ty }, { x: cx, y: ty + 0.34 * s }, { x: cx + tw / 2, y: ty }], { color: c, w: ww }); hline(p, cx - tw / 2, cx + tw / 2, ty, { thickness: ww, color: c }); }
  p.drawLine({ start: { x: cx, y: baseY + 1.52 * s }, end: { x: cx, y: baseY + 1.85 * s }, thickness: ww, color: c });
  poly(p, [{ x: cx - 0.4 * s, y: baseY }, { x: cx - 0.4 * s, y: baseY + 0.5 * s }], { color: c, w: ww });
  poly(p, [{ x: cx + 0.4 * s, y: baseY }, { x: cx + 0.4 * s, y: baseY + 0.5 * s }], { color: c, w: ww });
  hline(p, cx - 0.46 * s, cx + 0.46 * s, baseY, { thickness: ww, color: c });
}
function palm(p, x, baseY, s, c, ww = 1) {
  arc(p, x - 0.5 * s, baseY + s, 0.5 * s, s, 0, Math.PI / 2, { color: c, w: ww, seg: 12 }); // curved trunk
  const top = { x: x, y: baseY + s };
  for (const a of [150, 110, 70, 30, -5]) { const r = 0.9 * s; arc(p, top.x, top.y, r, r * 0.5, (a - 22) * Math.PI / 180, (a + 22) * Math.PI / 180, { color: c, w: ww, seg: 8 }); }
}
function longtail(p, cx, y, s, c, ww = 1) {
  arc(p, cx, y + 0.55 * s, s, 0.55 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 22 }); // hull
  hline(p, cx - s, cx + s, y + 0.55 * s, { thickness: ww, color: c });
  poly(p, [{ x: cx - 0.2 * s, y: y + 0.55 * s }, { x: cx - 0.2 * s, y: y + 1.1 * s }, { x: cx + 0.35 * s, y: y + 1.1 * s }, { x: cx + 0.35 * s, y: y + 0.55 * s }], { color: c, w: ww }); // cabin
  poly(p, [{ x: cx + 0.9 * s, y: y + 0.55 * s }, { x: cx + 1.7 * s, y: y + 1.25 * s }], { color: c, w: ww }); // long-tail pole
}
function bowl(p, cx, y, s, c, ww = 1) {
  arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 20 });
  hline(p, cx - s * 1.06, cx + s * 1.06, y + 0.5 * s, { thickness: ww, color: c });
  for (const dx of [-0.35, 0, 0.35]) arc(p, cx + dx * s, y + 0.85 * s, 0.12 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2, { color: c, w: ww, seg: 8 }); // steam
  poly(p, [{ x: cx + 0.5 * s, y: y + 1.0 * s }, { x: cx + 1.2 * s, y: y + 1.5 * s }], { color: c, w: ww }); // chopsticks
  poly(p, [{ x: cx + 0.62 * s, y: y + 0.96 * s }, { x: cx + 1.3 * s, y: y + 1.42 * s }], { color: c, w: ww });
}
function lantern(p, cx, y, s, c, ww = 1) {
  hline(p, cx - 0.35 * s, cx + 0.35 * s, y + s, { thickness: ww, color: c });
  arc(p, cx, y + 0.5 * s, 0.5 * s, 0.5 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 26 });
  poly(p, [{ x: cx, y: y + s }, { x: cx, y: y + 1.2 * s }], { color: c, w: ww });
  for (const dx of [-0.12, 0, 0.12]) poly(p, [{ x: cx + dx * s, y: y - 0.02 * s }, { x: cx + dx * s, y: y - 0.35 * s }], { color: c, w: ww });
}
function sun(p, cx, cy, r, c, ww = 1) { arc(p, cx, cy, r, r, 0, 2 * Math.PI, { color: c, w: ww, seg: 30 }); }

// horizontal landscape band to fill page bottoms
function sceneBand(p, yBase, { c = hair } = {}) {
  hline(p, M, W - M, yBase, { thickness: 0.8, color: c });
  mountains(p, M, yBase, CW * 0.5, 46, c, 0.9);
  sun(p, M + CW * 0.42, yBase + 40, 9, terra, 0.9);
  temple(p, M + CW * 0.62, yBase, 34, c, 0.9);
  palm(p, M + CW * 0.8, yBase, 26, sage, 0.9);
  palm(p, M + CW * 0.88, yBase, 20, sage, 0.9);
  longtail(p, M + CW * 0.2, yBase + 4, 16, blue, 0.9);
}

// ---------- furniture ----------
const newPage = () => { const p = doc.addPage([W, H]); paperBg(p); return p; };
function header(p, num, tag, title, accent = terra) {
  text(p, num, W - M - D.widthOfTextAtSize(num, 58), H - M - 52, { size: 58, font: D, color: accent, opacity: 0.15 });
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
function pageW(num, tag, title, accent, render, label, { band = true } = {}) {
  const p = newPage(); header(p, num, tag, title, accent);
  const endY = render(p, H - M - 88);
  if (band && endY && endY > 96) sceneBand(p, 70);
  footer(p, label || title);
}
function table(p, x, y, cols, rows, { headerColor = terra, rowH = 20, fontSize = 9.5 } = {}) {
  let cx = x; cols.forEach((c) => { tracked(p, c.h.toUpperCase(), cx, y, { size: 7.5, font: NB, color: headerColor, tracking: 1.2 }); cx += c.w; });
  let yy = y - 8; const tw = cols.reduce((a, c) => a + c.w, 0); hline(p, x, x + tw, yy, { thickness: 0.8 }); yy -= 16;
  for (const row of rows) { cx = x; row.forEach((cell, i) => { para(p, cell, cx, yy, cols[i].w - 8, { size: fontSize, font: i === 0 ? SB : SF, color: i === 0 ? ink : sub, leading: 12 }); cx += cols[i].w; }); yy -= rowH; hline(p, x, x + tw, yy + 8, { thickness: 0.4 }); }
  return yy;
}
function drawMap(p, bx, by, bw, bh, nodes, routes) {
  const px = (nx) => bx + nx * bw, py = (ny) => by + ny * bh;
  for (const r of routes) { const pts = r.keys.map((k) => nodes.find((n) => n.key === k)).filter(Boolean); for (let i = 0; i < pts.length - 1; i++) p.drawLine({ start: { x: px(pts[i].x), y: py(pts[i].y) }, end: { x: px(pts[i + 1].x), y: py(pts[i + 1].y) }, thickness: 1.6, color: r.color }); if (r.loop && pts.length > 1) p.drawLine({ start: { x: px(pts.at(-1).x), y: py(pts.at(-1).y) }, end: { x: px(pts[0].x), y: py(pts[0].y) }, thickness: 1.6, color: r.color }); }
  for (const n of nodes) { p.drawCircle({ x: px(n.x), y: py(n.y), size: n.big ? 4 : 2.6, color: n.big ? terra : ink }); text(p, n.name, px(n.x) + (n.lx ?? 7), py(n.y) + (n.ly ?? -3), { size: n.big ? 9 : 8, font: n.big ? NB : SN, color: ink }); }
}

// ---------- big pages ----------
function cover() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  trackedCenter(p, "THE SLOW ATLAS", H - 132, { size: 9, font: NB, color: terra, tracking: 5 });
  center(p, "Thailand", H - 250, { size: 78, font: D, color: ink });
  center(p, "The Complete Guide", H - 292, { size: 34, font: D, color: terra });
  hline(p, W / 2 - 70, W / 2 + 70, H - 316, { thickness: 0.8, color: ink });
  center(p, "Where to go, what to eat, and how to travel it slowly.", H - 342, { size: 13, font: SI, color: sub });
  // hero scene
  const yB = 188;
  mountains(p, M + 30, yB, CW - 60, 80, hair, 1);
  sun(p, W / 2, yB + 92, 16, terra, 1.1);
  temple(p, W / 2, yB, 60, ink, 1);
  palm(p, M + 70, yB, 44, sage, 1); palm(p, W - M - 80, yB, 40, sage, 1);
  longtail(p, M + 120, yB - 6, 26, blue, 1);
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME I", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}
function intro() {
  pageW("", "Welcome", "Sawatdee — welcome", terra, (p, y0) => {
    let y = para(p, "There is nowhere quite like Thailand. In a single trip you can wake to mist over northern mountains, ride a scooter past golden temples, eat the best meal of your life from a plastic stool on a side-street, and fall asleep to waves on a southern shore. It is dazzling, warm, deeply hospitable — and wonderfully easy to travel.", M, y0, CW, { leading: 15.5 }) - 8;
    y = para(p, "This guide is written for the traveller who wants more than a checklist. It is built to help you travel slowly and well: to understand the country, plan with confidence, and leave room for the unplanned afternoons that become the best memories.", M, y0 = y, CW, { leading: 15.5 }) - 14;
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "How this guide is arranged", M, y);
    yl = bullets(p, ["Before you go — timing, documents, health and what to pack.", "Budget — what Thailand really costs, with sample spends.", "Destinations — the unmissable places, region by region.", "Ready-to-use itineraries — 10 to 14 days, planned for you.", "Getting around & where to stay.", "Food, activities, practical tips and a phrasebook."], M, yl, colW, { accent: terra });
    let yr = subhead(p, "How to travel it slowly", x2, y, sage);
    yr = bullets(p, ["Choose one or two regions, not all four.", "Build in empty days — Thailand rewards lingering.", "Eat where the locals queue; say yes to the unfamiliar.", "Learn ten words of Thai; you'll be met with warmth.", "Move by day, on the ground, to see the country in between."], x2, yr, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Welcome");
}
function divider(num, kicker, title, subtitle, art, accent = terra) {
  const p = newPage(); const pad = 44;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  text(p, num, W / 2 - D.widthOfTextAtSize(num, 150) / 2, H / 2 + 40, { size: 150, font: D, color: accent, opacity: 0.12 });
  trackedCenter(p, kicker.toUpperCase(), H / 2 + 150, { size: 9, font: NB, color: accent, tracking: 4 });
  center(p, title, H / 2 + 96, { size: 46, font: D, color: ink });
  hline(p, W / 2 - 50, W / 2 + 50, H / 2 + 76, { thickness: 0.8, color: accent });
  center(p, subtitle, H / 2 + 48, { size: 13, font: SI, color: sub });
  art(p, W / 2, H / 2 - 150);
  trackedCenter(p, "THE SLOW ATLAS", 70, { size: 8, font: NB, color: sub, tracking: 3 });
}

// ---- destination page (two columns + highlights + band) ----
function destination(num, name, accent, lead, mustSee, practical, eat, label) {
  pageW(num, "Destinations", name, accent, (p, y0) => {
    let y = para(p, lead, M, y0, CW, { leading: 15 }) - 10;
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; const top = y;
    let yl = subhead(p, "Don't miss", M, top, accent);
    yl = bullets(p, mustSee, M, yl, colW, { accent });
    let yr = subhead(p, "Good to know", x2, top, sage);
    yr = bullets(p, practical, x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 10;
    yy = subhead(p, "Eat & drink here", M, yy, terra);
    yy = bullets(p, eat, M, yy, CW, { accent: terra, size: 9.8 });
    return yy;
  }, label || name);
}

// ---- itinerary page ----
function itinerary(num, title, accent, intro, nodes, keys, days, label, loop = false) {
  const p = newPage(); header(p, num, "Ready-to-use itineraries", title, accent);
  let y = para(p, intro, M, H - M - 88, CW * 0.56, { leading: 14 });
  drawMap(p, M + CW * 0.6, 150, CW * 0.4, H - M - 110 - 150, nodes, [{ color: accent, keys, loop }]);
  text(p, "Schematic — not to scale", M + CW * 0.6, 132, { size: 7.5, font: SI, color: sub });
  y -= 8;
  for (const [d, t, body] of days) { text(p, d, M, y, { size: 9.5, font: NB, color: accent }); text(p, t, M + 56, y, { size: 11, font: SB, color: ink }); y = para(p, body, M, y - 14, CW * 0.56, { size: 9.3, leading: 12.5 }) - 7; }
  footer(p, label);
}

// ============================ CONTENT ============================
function whenToGo() {
  pageW("01", "Before you go", "When to go", ochre, (p, y0) => {
    let y = para(p, "Choosing the right window matters more in Thailand than almost anywhere — and the north and south often run on different clocks.", M, y0, CW, { leading: 14 }) - 6;
    const seasons = [["Cool & dry", "Nov – Feb", sage, "The sweet spot: comfortable days, clear skies, cool hill evenings. Peak season — book ahead, especially over New Year."], ["Hot", "Mar – May", ochre, "Fierce heat (35–40°C). Mar–Apr brings crop-burning haze to the north. Songkran (13–15 Apr) is a nationwide water-fight new year."], ["Green & wet", "Jun – Oct", blue, "Warm monsoon — short, heavy afternoon bursts rather than all-day rain. Lush, quiet and cheap; the Andaman coast is wettest."]];
    for (const [n, w, a, d] of seasons) { p.drawRectangle({ x: M, y: y - 32, width: 3, height: 44, color: a }); text(p, n, M + 14, y, { size: 12.5, font: SB, color: ink }); tracked(p, w.toUpperCase(), M + 14, y - 16, { size: 8, font: NB, color: a, tracking: 1.3 }); para(p, d, M + 150, y + 1, CW - 150, { size: 9.5, leading: 13 }); y -= 52; }
    y -= 4; y = subhead(p, "A month-by-month almanac", M, y, terra);
    const half = CW / 2 - 10;
    const cols = [{ h: "Month", w: half * 0.22 }, { h: "Weather", w: half * 0.42 }, { h: "Don't miss", w: half * 0.36 }];
    const L = [["Jan", "Cool, dry, ideal", "Peak season"], ["Feb", "Warm, dry", "Chiang Mai Flower Fest."], ["Mar", "Hot, northern haze", "Sea & islands shine"], ["Apr", "Hottest", "Songkran water festival"], ["May", "Hot, first rains", "Low season begins"], ["Jun", "Warm, wet spells", "Green & cheap"]];
    const R = [["Jul", "Monsoon", "Asalha Puja / Lent"], ["Aug", "Wettest in places", "Quiet, lush north"], ["Sep", "Heavy rains", "Lowest prices"], ["Oct", "Rains ease", "Vegetarian Festival"], ["Nov", "Cool, dry returns", "Loy Krathong / Yi Peng"], ["Dec", "Cool, dry, busy", "High season"]];
    table(p, M, y, cols, L, { rowH: 18, fontSize: 9 });
    table(p, M + CW / 2 + 10, y, cols.map((c) => ({ ...c })), R, { rowH: 18, fontSize: 9 });
    return 100;
  }, "When to Go", { band: false });
}
function documents() {
  pageW("02", "Before you go", "Documents, health & money", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Entry & visas", M, yl);
    yl = bullets(p, ["Many nationalities (EU, UK, US, Australia, Canada…) enter visa-free for short stays — the exact number of days changes, so confirm the current rule for your passport before you fly.", "Passport valid 6+ months beyond arrival, with blank pages.", "Have proof of onward travel and accommodation ready.", "Longer stays / multiple entries: apply for the right visa in advance.", "Never overstay — fines are charged per day at the airport."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Health & vaccinations", M, yl, sage);
    yl = bullets(p, ["See a travel clinic 6–8 weeks ahead for current advice.", "Routine jabs up to date; Hepatitis A & typhoid commonly advised.", "Dengue is mosquito-borne — repellent dusk & dawn, no vaccine for travellers.", "Comprehensive travel insurance is essential — and it MUST cover motorbikes if you'll ride.", "Tap water isn't safe to drink; bottled or filtered only."], M, yl, colW, { accent: sage });

    yr = subhead(p, "Money", x2, yr, blue);
    yr = bullets(p, ["The baht (THB) is cash-first outside cities; carry small notes.", "ATMs everywhere but charge ≈THB 220 per foreign withdrawal — take more, less often.", "Cards work in malls, hotels and chains; markets are cash only.", "Tell your bank you're travelling; bring a backup card kept separately.", "Tipping isn't expected; rounding up is a kind gesture."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Connectivity", x2, yr, ochre);
    yr = bullets(p, ["Buy a tourist SIM (AIS, TrueMove, dtac) at the airport, or an eSIM before you fly.", "Data is fast and cheap; coverage is excellent outside the deep mountains.", "Save offline maps for road trips."], x2, yr, colW, { accent: ochre });
    return 100;
  }, "Documents", { band: false });
}
function packing() {
  pageW("03", "Before you go", "What to pack", sage, (p, y0) => {
    let y = para(p, "Thailand is hot, humid and casual — pack light, in natural fabrics, and leave room for what you'll buy. Laundry is cheap and everywhere, so a week's worth of clothes is plenty.", M, y0, CW, { leading: 14 }) - 8;
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; const top = y;
    let yl = subhead(p, "Clothing", M, top, terra);
    yl = bullets(p, ["Light, loose, quick-dry clothes", "One set covering shoulders & knees (temples)", "A light layer for cool northern evenings & buses", "Swimwear + a sarong (modesty, beach, picnic)", "Comfortable walking sandals + trainers", "A packable rain jacket or poncho"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Health & essentials", x2, top, sage);
    yr = bullets(p, ["High-SPF, reef-safe sunscreen + sun hat", "Insect repellent (DEET) & after-bite", "Small first-aid kit, rehydration salts, your meds", "Hand sanitiser & tissues (not all toilets have paper)", "Universal adapter & power bank", "Refillable water bottle (cut the plastic)"], x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 10;
    yy = subhead(p, "Documents to carry (paper + digital copies)", M, yy, blue);
    yy = bullets(p, ["Passport, visa, travel insurance details", "Driving licence + International Driving Permit (if driving)", "Card details / emergency numbers stored offline", "A few passport photos for any on-the-spot paperwork"], M, yy, CW, { accent: blue });
    return yy;
  }, "Packing");
}
function budget() {
  pageW("04", "Budget", "What Thailand costs", terra, (p, y0) => {
    let y = para(p, "Thailand suits every budget. You can travel beautifully on very little, or indulge for a fraction of European prices. Here's what to expect per person, per day, once you're in the country.", M, y0, CW, { leading: 14 }) - 8;
    const cols = [{ h: "Style", w: CW * 0.18 }, { h: "Per day", w: CW * 0.2 }, { h: "What it looks like", w: CW * 0.62 }];
    const rows = [["Backpacker", "THB 900–1,500", "Hostels & fan rooms, street food, scooters, public transport"], ["Comfort", "THB 2,500–4,500", "Smart guesthouses & 3-star hotels, mix of restaurants, some flights & tours"], ["Boutique", "THB 6,000+", "Design hotels & resorts, private drivers, spas, fine dining"]];
    y = table(p, M, y, cols, rows, { rowH: 26, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; const top = y;
    let yl = subhead(p, "Sample 2-week comfort budget (per person)", M, top, sage);
    const bcols = [{ h: "Item", w: colW * 0.6 }, { h: "≈ THB", w: colW * 0.4 }];
    const brows = [["Accommodation (13 nights)", "16,000"], ["Food & drink", "9,000"], ["Transport & 1–2 flights", "7,000"], ["Activities & tours", "6,000"], ["Scooter / car & fuel", "3,500"], ["SIM, extras, buffer", "3,500"]];
    let yl2 = table(p, M, yl, bcols, brows, { rowH: 18, fontSize: 9, headerColor: sage });
    text(p, "≈ THB 45,000  ·  roughly €1,150 / £980 / $1,250", M, yl2 - 4, { size: 9.5, font: SB, color: terra });
    let yr = subhead(p, "Prices to anchor on", x2, top, blue);
    yr = bullets(p, ["Street meal: THB 50–80", "Restaurant main: THB 120–250", "Local beer: THB 70–100", "Coffee: THB 50–80", "Scooter hire: THB 200–300/day", "Litre of petrol: ≈THB 40", "Guesthouse double: THB 600–1,200", "Domestic flight: THB 1,000–2,500", "Long train (2nd class): THB 200–900", "Day tour: THB 800–1,800"], x2, yr, colW, { accent: blue, gap: 2 });
    return 96;
  }, "Budget", { band: false });
}
function regionsMap() {
  pageW("05", "Destinations", "The lie of the land", blue, (p, y0) => {
    let y = para(p, "Thailand falls into four broad regions. Don't try to cover them all — choose one or two and travel them slowly.", M, y0, CW * 0.5, { leading: 14 }) - 8;
    const defs = [["The North", terra, "Mountains, Lanna temples, hill tribes, the best road trips and cool air. Chiang Mai, Pai, Mae Hong Son."], ["The Centre", blue, "Bangkok's energy, ancient Ayutthaya, the River Kwai, beaches at Hua Hin. The hub you'll likely arrive in."], ["Isaan (NE)", sage, "Khmer ruins, silk villages, the Mekong, fiery food, few tourists, big welcomes."], ["The South", ochre, "Two coasts of islands, karsts and rainforest. Phuket, Krabi, Khao Sok, Koh Lanta, the Gulf isles."]];
    for (const [n, a, d] of defs) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 12, y, { size: 12, font: SB, color: ink }); y = para(p, d, M + 12, y - 14, CW * 0.5 - 12, { size: 9.3, leading: 12.5 }) - 9; }
    const nodes = [
      { key: "cnx", name: "Chiang Mai", x: 0.42, y: 0.92, big: true }, { key: "pai", name: "Pai", x: 0.3, y: 0.99 },
      { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.9, lx: -78, ly: 4 }, { key: "bkk", name: "Bangkok", x: 0.5, y: 0.5, big: true },
      { key: "ayu", name: "Ayutthaya", x: 0.46, y: 0.6 }, { key: "kan", name: "Kanchanaburi", x: 0.3, y: 0.54, lx: -84 },
      { key: "isn", name: "Isaan", x: 0.8, y: 0.66, lx: 6 }, { key: "kyai", name: "Khao Yai", x: 0.62, y: 0.58 },
      { key: "krabi", name: "Krabi", x: 0.42, y: 0.14 }, { key: "phuket", name: "Phuket", x: 0.33, y: 0.1, lx: -44 }, { key: "samui", name: "Ko Samui", x: 0.58, y: 0.2 },
    ];
    drawMap(p, M + CW * 0.56, 130, CW * 0.42, H - M - 110 - 130, nodes, []);
    text(p, "Schematic — not to scale", M + CW * 0.56, 112, { size: 7.5, font: SI, color: sub });
    return 96;
  }, "Regions", { band: false });
}

// ---------- build ----------
async function buildDoc([w, h]) {
  doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Thailand: The Complete Guide");
  doc.setAuthor("The Slow Atlas");
  doc.setSubject("A complete illustrated travel guide to Thailand");
  doc.setKeywords(["thailand", "travel guide", "ebook", "itinerary", "southeast asia"]);
  W = w; H = h; M = 50; CW = W - M * 2; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true }); SF = await doc.embedFont(fb.serif, { subset: true });
  SB = await doc.embedFont(fb.serifB, { subset: true }); SI = await doc.embedFont(fb.serifI, { subset: true });
  SN = await doc.embedFont(fb.sans, { subset: true }); NB = await doc.embedFont(fb.sansB, { subset: true });

  cover();
  intro();

  divider("I", "Part One", "Before you go", "Timing, paperwork and packing — sorted.", (p, cx, cy) => { mountains(p, cx - 150, cy - 30, 300, 70, hair, 1); temple(p, cx, cy - 30, 56, ink, 1); sun(p, cx + 110, cy + 30, 13, terra, 1.1); palm(p, cx - 120, cy - 30, 40, sage, 1); }, ochre);
  whenToGo(); documents(); packing();

  divider("II", "Part Two", "Budget", "What it really costs — and how to travel for less.", (p, cx, cy) => { lantern(p, cx - 70, cy - 10, 30, ochre, 1); lantern(p, cx, cy + 6, 36, terra, 1); lantern(p, cx + 72, cy - 12, 28, sage, 1); }, terra);
  budget();

  divider("III", "Part Three", "Destinations", "The unmissable places, region by region.", (p, cx, cy) => { mountains(p, cx - 160, cy - 30, 320, 80, hair, 1); temple(p, cx - 80, cy - 30, 48, ink, 1); palm(p, cx + 70, cy - 30, 44, sage, 1); longtail(p, cx + 30, cy - 36, 30, blue, 1); }, blue);
  regionsMap();
  destination("06", "Bangkok", terra,
    "Thailand's electric capital is a city of contrasts: glittering temples beside neon malls, river life beside skytrains, and some of the best street food on earth. Give it two or three days — it grows on you fast.",
    ["The Grand Palace & Wat Phra Kaew (Emerald Buddha)", "Wat Pho's reclining Buddha & a temple massage", "Wat Arun at sunset, from across the river", "A long-tail boat through the Thonburi canals (khlongs)", "Chatuchak weekend market — 15,000 stalls", "Chinatown (Yaowarat) after dark, for street food"],
    ["Get around by BTS Skytrain, MRT metro and river boats — fast and cheap.", "Use metered taxis or Grab; agree tuk-tuk fares first.", "Dress modestly for temples (shoulders & knees covered).", "Base yourself near the river (Old Town) or by a BTS station (Sukhumvit)."],
    ["Pad krapow and boat noodles from street stalls", "Mango sticky rice from a market cart", "Yaowarat (Chinatown) for seafood, dim sum and sweets", "A rooftop bar for the skyline (smart-casual dress)"],
    "Bangkok");
  destination("07", "Chiang Mai & the North", sage,
    "The cultural capital of the north is laid-back, green and endlessly likeable — a moat-ringed old town of 300 temples, fringed by mountains, cooking schools and coffee. The gateway to Pai, Mae Hong Son and the great northern road trips.",
    ["The old-city temples — Wat Chedi Luang, Wat Phra Singh", "Doi Suthep temple, on the mountain above the city", "A day at an ethical elephant sanctuary (no riding)", "A Thai cooking class & the Sunday Walking Street", "Pai — a bohemian mountain town (3h north)", "The Mae Hong Son Loop (see itineraries)"],
    ["Cool, especially Nov–Feb; pack a light layer.", "Avoid Mar–Apr burning season (smoky air).", "Rent a scooter to explore — or hire a car for the loop.", "Yi Peng & Loy Krathong (Nov) fill the sky with lanterns."],
    ["Khao soi — the north's coconut-curry noodle bowl", "Sai ua (herby sausage) & nam prik dips", "Khao niao (sticky rice) with everything", "Northern coffee, grown in the surrounding hills"],
    "Chiang Mai");
  destination("08", "The South & islands", ochre,
    "Postcard Thailand: limestone karsts rising from turquoise seas, rainforest national parks, and an island for every mood. Two coasts mean there's almost always somewhere dry — when the Andaman rains, cross to the Gulf.",
    ["Railay & Ao Nang (Krabi) — climbers' cliffs & beaches", "Phang Nga Bay by long-tail or kayak", "Khao Sok National Park — jungle lake & raft-houses", "Koh Lanta — long, mellow west-coast beaches", "The Gulf isles — Ko Samui, Ko Pha-ngan, Ko Tao (diving)", "The Similan Islands for snorkelling & diving (seasonal)"],
    ["Andaman coast (Krabi, Phuket): best Nov–Apr.", "Gulf coast (Samui, Tao): driest Feb–Apr & Jul–Aug.", "Ferries link the islands; book ahead in high season.", "Reef-safe sunscreen only — protect the coral."],
    ["Fresh seafood, grilled by the beach", "Southern curries — rich, turmeric-gold, fiery", "Massaman curry — mild and fragrant", "Fruit shakes and fresh coconut"],
    "The South");
  destination("09", "Ayutthaya, Kanchanaburi & Isaan", blue,
    "Beyond the headline sights lies a quieter, history-rich Thailand — easy add-ons from Bangkok, or a route all their own.",
    ["Ayutthaya — the romantic ruins of the old capital (1h from Bangkok)", "Kanchanaburi — the River Kwai, Death Railway & Erawan Falls", "Khao Yai National Park — waterfalls, gibbons & vineyards", "Phimai & Phanom Rung — Khmer temples older than Angkor", "The Mekong towns — Nong Khai & the surreal Sala Keoku", "Silk-weaving villages and som-tam country in Isaan"],
    ["Ayutthaya: rent a bike to ride between the temples.", "Kanchanaburi: an easy, beautiful long weekend from Bangkok.", "Isaan: little English, the warmest welcomes, lowest prices.", "Trains and buses link it all; a car gives you the villages."],
    ["Som tam (green-papaya salad) — Isaan's icon", "Larb & gai yang (grilled chicken) with sticky rice", "Sai krok Isan — sour fermented sausage", "Mekong river fish, simply grilled"],
    "Beyond the Big Sights");

  divider("IV", "Part Four", "Ready-to-use itineraries", "Three trips, planned for you — adapt and go.", (p, cx, cy) => { mountains(p, cx - 150, cy - 30, 300, 72, hair, 1); longtail(p, cx, cy - 34, 34, blue, 1); palm(p, cx - 120, cy - 30, 40, sage, 1); palm(p, cx + 110, cy - 30, 36, sage, 1); }, terra);
  itinerary("10", "10 days · The North", sage,
    "Mountains, temples and the legendary Mae Hong Son Loop, from a Chiang Mai base. Fly in and out of Chiang Mai. Best Nov–Feb.",
    [{ key: "cnx", name: "Chiang Mai", x: 0.62, y: 0.5, big: true, lx: 9 }, { key: "pai", name: "Pai", x: 0.4, y: 0.86, big: true }, { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.66, big: true, lx: -92 }, { key: "sariang", name: "Mae Sariang", x: 0.26, y: 0.16, lx: -74 }, { key: "inth", name: "Doi Inthanon", x: 0.66, y: 0.3, lx: 9 }],
    ["cnx", "pai", "mhs", "sariang", "inth", "cnx"],
    [["D1–2", "Chiang Mai", "Old-city temples, a cooking class, an ethical elephant visit and the night markets."], ["D3", "To Pai", "Ride the 762 curves north; waterfalls and coffee stops on the way."], ["D4", "Pai", "Canyon at dawn, hot springs, white temple at sunset."], ["D5", "To Mae Hong Son", "Tham Lod cave and the bamboo bridge; a calm, Shan-flavoured town."], ["D6", "Mae Hong Son", "Ban Rak Thai tea village and misty viewpoints."], ["D7", "To Mae Sariang", "A quiet riverside town on the loop's western arm."], ["D8", "To Doi Inthanon", "Climb Thailand's highest peak; twin pagodas and waterfalls."], ["D9–10", "Chiang Mai", "Massage, markets and a slow finish before flying out."]],
    "North Itinerary", true);
  itinerary("11", "12 days · Islands & South", blue,
    "Karsts, rainforest and beaches down the Andaman coast, finishing island-slow. Fly into Phuket, out of Krabi (or vice-versa). Best Nov–Apr.",
    [{ key: "phuket", name: "Phuket", x: 0.3, y: 0.92, big: true }, { key: "phang", name: "Phang Nga", x: 0.46, y: 0.8 }, { key: "khaosok", name: "Khao Sok", x: 0.62, y: 0.64, lx: 7 }, { key: "krabi", name: "Krabi", x: 0.55, y: 0.42, lx: 7 }, { key: "lanta", name: "Koh Lanta", x: 0.5, y: 0.18, big: true }],
    ["phuket", "phang", "khaosok", "krabi", "lanta"],
    [["D1–2", "Phuket", "Old-town shophouses and a first beach; ease into island time."], ["D3", "Phang Nga Bay", "Long-tail or kayak among the sea-stacks and hidden lagoons."], ["D4–5", "Khao Sok", "Jungle lake by raft-house; dawn mist, gibbons and caves."], ["D6–8", "Krabi, Ao Nang & Railay", "Climbers' karsts, beach-hopping and a boat to cliff-ringed Railay."], ["D9–11", "Koh Lanta", "Long, quiet beaches; sunsets and old-town seafood."], ["D12", "To Krabi & home", "A last swim before the flight out."]],
    "South Itinerary");
  itinerary("12", "14 days · Best of Thailand", terra,
    "Bangkok, the cultural north and the southern islands, linked by two short internal flights. The classic first-timer's grand tour.",
    [{ key: "bkk", name: "Bangkok", x: 0.62, y: 0.42, big: true }, { key: "ayu", name: "Ayutthaya", x: 0.56, y: 0.56 }, { key: "cnx", name: "Chiang Mai", x: 0.42, y: 0.9, big: true }, { key: "krabi", name: "Krabi", x: 0.5, y: 0.12, big: true }],
    ["bkk", "ayu", "cnx", "krabi"],
    [["D1–3", "Bangkok", "Temples, river life, Chinatown food and a day-trip to Ayutthaya's ruins."], ["D4", "Fly to Chiang Mai", "Evening at the night bazaar."], ["D5–7", "Chiang Mai", "Temples, cooking class, ethical elephants and Doi Suthep."], ["D8–9", "Pai or the hills", "A taste of the mountains — slow and scenic."], ["D10", "Fly south to Krabi", "Swap mountains for the sea."], ["D11–13", "Krabi & islands", "Railay, Ao Nang and a day among the karsts."], ["D14", "Home", "One last Thai breakfast before the airport."]],
    "Best-of Itinerary");

  divider("V", "Part Five", "Getting around & staying", "How to move, and where to lay your head.", (p, cx, cy) => { longtail(p, cx - 80, cy - 20, 30, blue, 1); temple(p, cx + 70, cy - 30, 46, ink, 1); mountains(p, cx - 160, cy - 30, 320, 64, hair, 1); }, sage);
  transport(); accommodation();

  divider("VI", "Part Six", "Food & drink", "How to eat brilliantly, anywhere.", (p, cx, cy) => { bowl(p, cx, cy - 10, 46, terra, 1); palm(p, cx - 120, cy - 30, 36, sage, 1); palm(p, cx + 110, cy - 30, 32, sage, 1); }, ochre);
  eating(); dishesNorth(); dishesSouth();

  divider("VII", "Part Seven", "Activities & experiences", "The things you'll still talk about years later.", (p, cx, cy) => { mountains(p, cx - 150, cy - 30, 300, 76, hair, 1); sun(p, cx + 100, cy + 20, 13, terra, 1.1); palm(p, cx - 110, cy - 30, 42, sage, 1); }, blue);
  activities();

  divider("VIII", "Part Eight", "Practical tips & language", "Travel smart, travel kind, and say hello.", (p, cx, cy) => { lantern(p, cx, cy + 4, 34, terra, 1); temple(p, cx - 90, cy - 24, 40, ink, 1); palm(p, cx + 90, cy - 24, 36, sage, 1); }, terra);
  culture(); safetyScams(); phrasebook1(); phrasebook2();

  closing();
  back();

  return doc.save();
}

// ----- remaining content pages -----
function transport() {
  pageW("13", "Getting around", "Transport", blue, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Between cities", M, yl);
    yl = bullets(p, ["Domestic flights are cheap and quick (AirAsia, Nok, Thai Lion, Bangkok Airways) — ideal for north↔south.", "Trains are scenic and characterful; the overnight sleeper to Chiang Mai is a classic (book ahead, 2nd-class A/C).", "Long-distance buses & minivans reach everywhere; comfortable 'VIP' coaches on big routes.", "Book trains, buses and ferries online via 12Go."], M, yl, colW, { accent: blue }) - 4;
    yl = subhead(p, "On the islands & coast", M, yl, sage);
    yl = bullets(p, ["Ferries & speedboats link the islands — rougher and reduced in monsoon.", "Long-tail boats for short hops and hidden beaches (agree the price).", "Songthaews (shared pick-ups) run fixed routes for a few baht."], M, yl, colW, { accent: sage });

    yr = subhead(p, "Around town", x2, yr, terra);
    yr = bullets(p, ["Bangkok: BTS Skytrain + MRT metro are fast, cheap and air-conditioned.", "Grab (and Bolt) for metered, hassle-free rides — pay in-app.", "Metered taxis: insist on the meter ('meter, please').", "Tuk-tuks: fun but agree the fare first; not always cheaper.", "Motorbike taxis (orange vests) for quick solo hops."], x2, yr, colW, { accent: terra }) - 4;
    yr = subhead(p, "Self-driving", x2, yr, ochre);
    yr = bullets(p, ["Carry an International Driving Permit + your licence; checkpoints are common.", "Drive on the LEFT; give way to bigger vehicles.", "Scooters (THB 200–300/day) suit the north; never leave your passport as deposit.", "Helmets are law; insurance must cover motorbikes.", "Avoid night driving on rural roads."], x2, yr, colW, { accent: ochre });
    return 96;
  }, "Transport", { band: false });
}
function accommodation() {
  pageW("14", "Where to stay", "Accommodation", sage, (p, y0) => {
    let y = para(p, "Thailand offers some of the best-value beds in the world — from £6 hostel bunks to design hotels that would cost five times more in Europe. Book the first and last nights ahead; improvise the middle.", M, y0, CW, { leading: 14 }) - 8;
    const cols = [{ h: "Type", w: CW * 0.24 }, { h: "≈ /night", w: CW * 0.2 }, { h: "Best for", w: CW * 0.56 }];
    const rows = [["Hostel / guesthouse", "THB 200–700", "Backpackers, solo travellers, meeting people"], ["Boutique guesthouse", "THB 800–1,800", "Character and comfort without the price"], ["3–4★ hotel / resort", "THB 1,800–4,500", "Pools, breakfast, families"], ["Design / luxury", "THB 5,000+", "Special occasions, honeymoons"], ["Homestay / raft-house", "THB 500–1,500", "Villages, national parks, real local life"]];
    y = table(p, M, y, cols, rows, { rowH: 22, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; const top = y;
    let yl = subhead(p, "Where to base yourself", M, top, terra);
    yl = bullets(p, ["Bangkok: Old Town (river, temples) or Sukhumvit (BTS, nightlife).", "Chiang Mai: inside or just outside the old-city moat.", "Krabi: Ao Nang for access; Railay to wake by the cliffs.", "Islands: west coast for sunsets; quieter beaches need a scooter."], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Booking tips", x2, top, blue);
    yr = bullets(p, ["Read recent reviews for cleanliness, noise and Wi-Fi.", "A/C vs fan: worth it in the lowlands; fan is fine up north.", "High season (Nov–Feb) & holidays: book well ahead.", "Walk-in deals exist off-season — bargain politely.", "Check the location pin, not just the photos."], x2, yr, colW, { accent: blue });
    return Math.min(yl, yr);
  }, "Accommodation");
}
function eating() {
  pageW("15", "Food & drink", "How to eat in Thailand", ochre, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Street food, decoded", M, yl);
    yl = bullets(p, ["The best meals come from carts and tiny shophouses — follow the crowds of locals.", "Many stalls cook one dish brilliantly; point if you can't pronounce it.", "Sit, eat, pay after; a bowl of noodles is THB 50–80.", "Markets cluster at dawn and dusk — arrive hungry.", "Busy + fresh + hot = safe. Watch it cooked."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "Spice & ordering", M, yl, terra);
    yl = bullets(p, ["'Mai phet' = not spicy; 'phet nit noi' = a little (still a lot!).", "Season at the table: fish sauce, chilli, sugar, vinegar.", "Rice ('khao') is the centre; share dishes family-style.", "Eat with spoon & fork — the fork pushes, the spoon delivers."], M, yl, colW, { accent: terra });

    yr = subhead(p, "Vegetarian & allergies", x2, yr, sage);
    yr = bullets(p, ["'Mangsawirat' = vegetarian; 'jay' = strict vegan — look for the yellow-red 'เจ' flag.", "Fish sauce & shrimp paste hide everywhere — 'mai sai nam pla / mai sai kapi'.", "Peanuts are common; carry an allergy translation card.", "The annual Vegetarian Festival (Oct) is a feast for plant-eaters."], x2, yr, colW, { accent: sage }) - 4;
    yr = subhead(p, "What to drink", x2, yr, blue);
    yr = bullets(p, ["Cha yen — sweet orange iced tea.", "Nam manao — fresh lime soda.", "Fruit shakes ('mai sai nam tan' for no sugar).", "Singha, Chang & Leo — ice-cold local beers.", "Roadside coffee — Café Amazon is everywhere."], x2, yr, colW, { accent: blue });
    return 96;
  }, "Eating", { band: false });
}
function dishesNorth() {
  pageW("16", "Food & drink", "What to order · North & Centre", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "The North", M, y0, terra);
    for (const [a, b] of [["Khao soi", "the crown — egg noodles in coconut curry, crisp noodles on top"], ["Sai ua", "herby grilled Chiang Mai sausage"], ["Nam prik num", "smoky green-chilli dip with sticky rice & veg"], ["Gaeng hang lay", "rich Burmese-style pork curry"], ["Khanom jeen nam ngiao", "rice noodles in a tomato-pork broth"], ["Khao niao", "sticky rice — eaten by hand"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "Central & Bangkok", x2, y0, blue);
    for (const [a, b] of [["Pad krapow", "holy-basil stir-fry + fried egg — the comfort dish"], ["Tom yum goong", "hot-and-sour prawn soup"], ["Tom kha gai", "coconut-galangal chicken soup"], ["Pad thai", "the famous wok noodles"], ["Khao man gai", "Hainanese chicken & rice"], ["Massaman", "mild, fragrant curry of Persian roots"], ["Mango sticky rice", "the dessert — khao niao mamuang"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    return Math.min(yl, yr);
  }, "Dishes I");
}
function dishesSouth() {
  pageW("16", "Food & drink", "What to order · Isaan & South", sage, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Isaan (North-East)", M, y0, sage);
    for (const [a, b] of [["Som tam", "pounded green-papaya salad — order 'phet nit noi'!"], ["Larb", "zingy minced-meat salad, herbs & toasted rice"], ["Gai yang", "marinated grilled chicken"], ["Sai krok Isan", "sour fermented pork sausage"], ["Nam tok", "'waterfall' grilled-beef salad"], ["Khao niao", "sticky rice — the staple here"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "The South & sweets", x2, y0, ochre);
    for (const [a, b] of [["Gaeng tai pla", "intense southern fish curry — for the brave"], ["Khao yam", "fresh herbal rice salad"], ["Massaman / seafood curries", "coconut-rich, fragrant, often milder"], ["Grilled seafood", "by the beach, with nam jim seafood dip"], ["Roti", "griddled banana-and-egg pancake"], ["Fresh fruit", "mangosteen, rambutan, durian (if you dare)"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    let y = Math.min(yl, yr) - 12;
    y = subhead(p, "Market wisdom", M, y, blue);
    y = bullets(p, ["Morning markets for fruit, coffee and rice dishes; night markets for grills, noodles and sweets.", "Order from several stalls and share — that's the joy of it.", "A bag of cut fruit with chilli-salt is the perfect THB-20 snack."], M, y, CW, { accent: blue });
    return y;
  }, "Dishes II");
}
function activities() {
  pageW("17", "Experiences", "Things to do", blue, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Culture & spirit", M, yl, terra);
    yl = bullets(p, ["Temple-hop the great wats — go early, dress modestly.", "Give alms to monks at dawn, respectfully.", "Watch (or join) Loy Krathong & Yi Peng lanterns in Nov.", "Learn the craft at a Thai cooking class — a half-day highlight.", "A traditional Thai massage (from THB 250/hour)."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Mountains & jungle", M, yl, sage);
    yl = bullets(p, ["Trek to hill-tribe villages and waterfalls in the north.", "Ride the Mae Hong Son Loop by scooter or car.", "Kayak the jungle lake at Khao Sok; spot gibbons at Khao Yai.", "Chase waterfalls — Erawan's seven turquoise tiers."], M, yl, colW, { accent: sage });

    yr = subhead(p, "Sea & islands", x2, yr, blue);
    yr = bullets(p, ["Snorkel or dive — Ko Tao is a world-famous (cheap) place to learn.", "Long-tail or kayak through Phang Nga & Krabi's karsts.", "Island-hop by ferry; find a beach with no name.", "Sunset from a long-tail, then seafood on the sand."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "With animals — ethically", x2, yr, ochre);
    yr = bullets(p, ["Choose genuine elephant sanctuaries where elephants roam and are never ridden — research first.", "Avoid riding, shows and tiger selfies.", "Watch wildlife in national parks, at a respectful distance."], x2, yr, colW, { accent: ochre });
    return 96;
  }, "Activities", { band: false });
}
function culture() {
  pageW("18", "Practical tips", "Culture & etiquette", sage, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Do", M, yl, sage);
    yl = bullets(p, ["Return a 'wai' (palms together) with a smile.", "Dress modestly at temples — shoulders & knees covered; shoes off.", "Keep calm; a smile defuses almost anything ('jai yen').", "Give and receive with your right hand, or both.", "Ask before photographing people."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Don't", M, yl, terra);
    yl = bullets(p, ["Touch anyone's head — even a child's.", "Point your feet at people or Buddha images.", "Raise your voice or show anger ('losing face').", "Disrespect the monarchy — it is against the law.", "Women: don't touch or hand things directly to monks."], M, yl, colW, { accent: terra });

    yr = subhead(p, "The ideas behind it", x2, yr, blue);
    yr = para(p, "Two words explain a lot of Thailand. 'Sanuk' is the belief that life — even work — should have an element of fun. 'Jai yen', a 'cool heart', prizes calm and composure over confrontation. And 'mai pen rai' — never mind, it's fine — is a whole gentle philosophy of letting things go.", x2, yr, colW, { leading: 13.5 }) - 8;
    yr = subhead(p, "At the temple (wat)", x2, yr, ochre);
    yr = bullets(p, ["Cover up, remove shoes & hat, lower your voice.", "Sit with feet tucked behind you, not toward the Buddha.", "A small donation helps with upkeep.", "Never climb on ruins or Buddha images for a photo."], x2, yr, colW, { accent: ochre });
    return 96;
  }, "Culture", { band: false });
}
function safetyScams() {
  pageW("19", "Practical tips", "Staying safe & smart", terra, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Common scams — smile & decline", M, yl, ochre);
    yl = bullets(p, ["'The temple/palace is closed today' — it isn't; the tout has a gem shop to show you.", "Cheap tuk-tuk 'tours' that detour to commission stops.", "Rigged taxi meters — insist on the meter or agree a price first.", "Jet-ski / scooter 'damage' claims — photograph everything at pickup.", "Over-friendly strangers with card games or 'free' drinks."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "Health on the road", M, yl, sage);
    yl = bullets(p, ["Drink bottled/filtered water only; ice in cafés is usually fine.", "Eat where it's busy and freshly cooked.", "Carry rehydration salts; pace the heat and hydrate.", "Pharmacies are excellent and cheap for minor ailments."], M, yl, colW, { accent: sage });

    yr = subhead(p, "Sensible & safe", x2, yr, blue);
    yr = bullets(p, ["Thailand is generally very safe; petty theft is the main risk.", "Use hotel safes; keep a card and some cash separate.", "Women travel widely and easily — usual night-time sense applies.", "Respect the sea — heed red flags and rip-current warnings.", "Buy travel insurance that covers motorbikes if you'll ride."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Emergency numbers", x2, yr, terra);
    yr = bullets(p, ["Police 191 · Ambulance 1669", "Tourist Police (English) 1155", "Tourism Authority (TAT) 1672"], x2, yr, colW, { accent: terra });
    yr -= 6; yr = subhead(p, "Travel kindly", x2, yr, sage);
    yr = bullets(p, ["Refill a bottle; reef-safe sunscreen; bin nothing in nature.", "Spend with local families, markets and guides."], x2, yr, colW, { accent: sage });
    return 96;
  }, "Safety", { band: false });
}
function phrasebook1() {
  pageW("20", "Useful expressions", "A Thai phrasebook · I", blue, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Essentials", M, y0);
    for (const [a, b] of [["Hello", "sawatdee (khrap/kha)"], ["Thank you", "khop khun (khrap/kha)"], ["Yes / No", "chai / mai chai"], ["Please", "karuna"], ["Sorry / excuse me", "khor thot"], ["No worries", "mai pen rai"], ["Do you speak English?", "phut angkrit dai mai?"], ["I don't understand", "mai khao jai"], ["My name is…", "phom/chan chue…"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    yl -= 4; yl = subhead(p, "Numbers", M, yl, sage);
    yl = para(p, "1 nung · 2 song · 3 sam · 4 si · 5 ha · 6 hok · 7 jet · 8 paet · 9 kao · 10 sip · 20 yi-sip · 100 nung roi · 1,000 nung phan", M, yl, colW, { size: 9.5, leading: 14 });

    let yr = subhead(p, "Getting around", x2, y0, terra);
    for (const [a, b] of [["Where is…?", "…yu thi nai?"], ["How much?", "tao rai?"], ["Too expensive", "phaeng pai"], ["Turn left / right", "liao sai / liao khwa"], ["Straight on", "trong pai"], ["Stop here", "jort thi ni"], ["Bus / train station", "sathani rot / rot fai"], ["Petrol station", "pam nam man"], ["Toilet", "hong nam"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook I", { band: false });
}
function phrasebook2() {
  pageW("21", "Useful expressions", "A Thai phrasebook · II", ochre, (p, y0) => {
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16;
    let yl = subhead(p, "At the table", M, y0, terra);
    for (const [a, b] of [["Delicious!", "aroi!"], ["Not spicy, please", "mai phet"], ["A little spicy", "phet nit noi"], ["Vegetarian / vegan", "mangsawirat / jay"], ["No fish sauce", "mai sai nam pla"], ["The bill, please", "check bin"], ["Water", "nam plao"], ["Cheers!", "chon kaew!"], ["I'm allergic to…", "phae…"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    let yr = subhead(p, "Time & small talk", x2, y0, sage);
    for (const [a, b] of [["Today / tomorrow", "wan ni / phrung ni"], ["How are you?", "sabai dee mai?"], ["I'm well", "sabai dee"], ["Beautiful", "suay"], ["Friend", "phuean"], ["Good luck", "chok dee"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    yr -= 4; yr = subhead(p, "Emergencies", x2, yr, terra);
    for (const [a, b] of [["Help!", "chuay duay!"], ["Hospital", "rong phayaban"], ["Police", "tamruat"], ["I'm lost", "chan long thang"], ["Call a doctor", "riak mor"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    let y = Math.min(yl, yr) - 10;
    p.drawRectangle({ x: M, y: y - 26, width: CW, height: 38, color: panel, borderColor: hair, borderWidth: 0.8 });
    para(p, "Thai is tonal, so don't worry about perfection — a warm 'sawatdee khrap/kha' and a smile open every door. Men end politely with 'khrap', women with 'kha'.", M + 12, y - 6, CW - 24, { size: 9.5, font: SI, color: ink, leading: 13 });
    return y;
  }, "Phrasebook II", { band: false });
}
function closing() {
  pageW("", "Before you go (again)", "Go slowly, see deeply", sage, (p, y0) => {
    let y = para(p, "If there's one idea to carry into Thailand, it's this: resist the urge to see everything. The travellers who fall hardest for this country are the ones who slow down — who spend a third morning at the same coffee stall until the owner knows their order, who take the long road over the loop, who say yes to the invitation they didn't plan for.", M, y0, CW, { leading: 15.5 }) - 8;
    y = para(p, "Eat the thing you can't name. Learn the ten words. Give way to the smiles. Thailand will meet you more than halfway.", M, y, CW, { leading: 15.5 }) - 16;
    y = subhead(p, "A few good resources", M, y, terra);
    const colW = CW / 2 - 16; const x2 = M + CW / 2 + 16; const top = y;
    let yl = bullets(p, ["Tourism Authority of Thailand — tourismthailand.org", "12Go — trains, buses & ferries", "Richard Barrow — long-running Thailand travel blog"], M, top, colW, { accent: terra });
    let yr = bullets(p, ["Grab / Bolt — rides & food", "Google Maps (offline) + Translate (Thai)", "Your travel insurer's 24-hour line"], x2, top, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Go Slowly");
}
function back() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  temple(p, W / 2, H / 2 + 40, 64, ink, 1);
  center(p, "Chok dee", H / 2 - 30, { size: 42, font: D, color: ink });
  center(p, "Good luck, and travel gently.", H / 2 - 64, { size: 13, font: SI, color: sub });
  sceneBand(p, 150);
  trackedCenter(p, "THE SLOW ATLAS  ·  RENNES, FRANCE", 96, { size: 8, font: NB, color: terra, tracking: 3 });
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
