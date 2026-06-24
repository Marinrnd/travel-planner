/**
 * The Slow Atlas — Thailand: The Complete Guide
 * A rich, dense, illustrated travel ebook. Full-bleed section dividers,
 * auto-fill panels (no empty space), a transport network map, an island
 * comparison, four ready-to-use itineraries, and everything practical.
 * Original vector illustrations only (no third-party photos).
 * Generates US Letter + A4.  Run: npm run thailand
 */
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FDIR = join(ROOT, "assets", "fonts");
const fb = {
  display: readFileSync(join(FDIR, "Italiana-Regular.ttf")), serif: readFileSync(join(FDIR, "Lora-Regular.ttf")),
  serifB: readFileSync(join(FDIR, "Lora-Bold.ttf")), serifI: readFileSync(join(FDIR, "Lora-Italic.ttf")),
  sans: readFileSync(join(FDIR, "Outfit-Regular.ttf")), sansB: readFileSync(join(FDIR, "Outfit-Bold.ttf")),
};
const paper = rgb(0.984, 0.969, 0.945), ink = rgb(0.176, 0.165, 0.141), sub = rgb(0.5, 0.475, 0.43);
const hair = rgb(0.862, 0.83, 0.783), panel = rgb(0.952, 0.931, 0.895), cream = rgb(0.98, 0.962, 0.93);
const terra = rgb(0.725, 0.376, 0.247), sage = rgb(0.443, 0.498, 0.376), blue = rgb(0.357, 0.471, 0.529), ochre = rgb(0.78, 0.6, 0.27);

let doc, W, H, M, CW, PAGE, D, SF, SB, SI, SN, NB;
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
function bullets(p, items, x, y, w, { accent = terra, gap = 4, size = 10, leading = 13.5, color = ink } = {}) { let yy = y; for (const it of items) { p.drawCircle({ x: x + 2.2, y: yy + 3.2, size: 1.7, color: accent }); yy = para(p, it, x + 11, yy, w - 11, { size, leading, color }) - gap; } return yy; }
function entry(p, term, desc, x, y, w, { size = 10, leading = 14 } = {}) { let cx = x, yy = y; p.drawText(term, { x: cx, y: yy, size, font: SB, color: ink }); cx += SB.widthOfTextAtSize(term, size) + 5; for (const word of desc.split(" ")) { const ww = SF.widthOfTextAtSize(word + " ", size); if (cx + ww > x + w) { yy -= leading; cx = x; } p.drawText(word, { x: cx, y: yy, size, font: SF, color: sub }); cx += ww; } return yy - leading; }
function subhead(p, s, x, y, accent = terra) { tracked(p, s.toUpperCase(), x, y, { size: 8.5, font: NB, color: accent, tracking: 1.8 }); return y - 18; }
const hline = (p, x1, x2, y, { thickness = 0.7, color = hair, dash } = {}) => p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color, ...(dash ? { dashArray: dash } : {}) });
const paperBg = (p) => p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });

// ---------- illustration kit ----------
function arc(p, cx, cy, rx, ry, a0, a1, { color = ink, w = 1, seg = 26 } = {}) { let prev = null; for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; const pt = { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }; if (prev) p.drawLine({ start: prev, end: pt, thickness: w, color }); prev = pt; } }
const seg = (p, x1, y1, x2, y2, c, w = 1) => p.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: c });
const polyl = (p, pts, c, w = 1, close = false) => { for (let i = 0; i < pts.length - 1; i++) seg(p, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, c, w); if (close) seg(p, pts.at(-1).x, pts.at(-1).y, pts[0].x, pts[0].y, c, w); };
function mountains(p, x, baseY, w, h, c, ww = 1) { polyl(p, [[0, 0], [0.16, 0.7], [0.3, 0.25], [0.46, 1], [0.62, 0.4], [0.78, 0.85], [0.9, 0.45], [1, 0.6]].map(([fx, fy]) => ({ x: x + fx * w, y: baseY + fy * h })), c, ww); }
function temple(p, cx, baseY, s, c, ww = 1) {
  for (let i = 0; i < 3; i++) { const tw = (1 - i * 0.22) * s, ty = baseY + 0.5 * s + i * 0.34 * s; polyl(p, [{ x: cx - tw / 2, y: ty }, { x: cx, y: ty + 0.34 * s }, { x: cx + tw / 2, y: ty }], c, ww); hline(p, cx - tw / 2, cx + tw / 2, ty, { thickness: ww, color: c }); }
  seg(p, cx, baseY + 1.52 * s, cx, baseY + 1.9 * s, c, ww); seg(p, cx - 0.4 * s, baseY, cx - 0.4 * s, baseY + 0.5 * s, c, ww); seg(p, cx + 0.4 * s, baseY, cx + 0.4 * s, baseY + 0.5 * s, c, ww); hline(p, cx - 0.46 * s, cx + 0.46 * s, baseY, { thickness: ww, color: c });
}
function palm(p, x, baseY, s, c, ww = 1) {
  polyl(p, [{ x, y: baseY }, { x: x + 0.08 * s, y: baseY + 0.5 * s }, { x: x + 0.18 * s, y: baseY + s }], c, ww); // trunk
  const tx = x + 0.18 * s, ty = baseY + s;
  for (const [dx, dy] of [[-0.75, 0.18], [-0.5, 0.42], [-0.16, 0.5], [0.2, 0.46], [0.55, 0.32], [0.78, 0.05]]) polyl(p, [{ x: tx, y: ty }, { x: tx + dx * 0.55 * s, y: ty + dy * s }, { x: tx + dx * s, y: ty + (dy - 0.28) * s }], c, ww);
}
function boat(p, cx, y, s, c, ww = 1) { arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 22 }); seg(p, cx - s, y + 0.5 * s, cx - 1.15 * s, y + 0.75 * s, c, ww); seg(p, cx + s, y + 0.5 * s, cx + 1.15 * s, y + 0.75 * s, c, ww); polyl(p, [{ x: cx - 0.18 * s, y: y + 0.5 * s }, { x: cx - 0.18 * s, y: y + 0.95 * s }, { x: cx + 0.32 * s, y: y + 0.95 * s }, { x: cx + 0.32 * s, y: y + 0.5 * s }], c, ww); seg(p, cx + 0.9 * s, y + 0.5 * s, cx + 1.8 * s, y + 1.15 * s, c, ww); }
function bowl(p, cx, y, s, c, ww = 1) { arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 20 }); hline(p, cx - s * 1.06, cx + s * 1.06, y + 0.5 * s, { thickness: ww, color: c }); for (const dx of [-0.35, 0, 0.35]) arc(p, cx + dx * s, y + 0.9 * s, 0.12 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2, { color: c, w: ww, seg: 8 }); seg(p, cx + 0.5 * s, y + s, cx + 1.2 * s, y + 1.5 * s, c, ww); seg(p, cx + 0.62 * s, y + 0.96 * s, cx + 1.3 * s, y + 1.42 * s, c, ww); }
function lantern(p, cx, y, s, c, ww = 1) { hline(p, cx - 0.35 * s, cx + 0.35 * s, y + s, { thickness: ww, color: c }); arc(p, cx, y + 0.5 * s, 0.5 * s, 0.5 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 26 }); seg(p, cx, y + s, cx, y + 1.2 * s, c, ww); for (const dx of [-0.12, 0, 0.12]) seg(p, cx + dx * s, y - 0.02 * s, cx + dx * s, y - 0.32 * s, c, ww); }
function sun(p, cx, cy, r, c, ww = 1) { arc(p, cx, cy, r, r, 0, 2 * Math.PI, { color: c, w: ww, seg: 30 }); }
function scooter(p, cx, cy, s, c, ww = 1) { arc(p, cx - 0.55 * s, cy, 0.25 * s, 0.25 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 16 }); arc(p, cx + 0.55 * s, cy, 0.25 * s, 0.25 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 16 }); polyl(p, [{ x: cx - 0.55 * s, y: cy + 0.05 * s }, { x: cx + 0.2 * s, y: cy + 0.05 * s }, { x: cx + 0.55 * s, y: cy }], c, ww); polyl(p, [{ x: cx - 0.3 * s, y: cy + 0.05 * s }, { x: cx - 0.15 * s, y: cy + 0.55 * s }, { x: cx + 0.35 * s, y: cy + 0.55 * s }], c, ww); seg(p, cx + 0.55 * s, cy + 0.25 * s, cx + 0.78 * s, cy + 0.7 * s, c, ww); seg(p, cx + 0.66 * s, cy + 0.7 * s, cx + 0.9 * s, cy + 0.7 * s, c, ww); }
function bus(p, cx, cy, s, c, ww = 1) { const x0 = cx - 0.9 * s, x1 = cx + 0.9 * s, y0 = cy + 0.1 * s, y1 = cy + 0.8 * s; polyl(p, [{ x: x0, y: y0 }, { x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y0 }], c, ww, true); hline(p, x0, x1, y0 + 0.42 * s, { thickness: ww, color: c }); for (let i = 0; i < 4; i++) seg(p, x0 + (0.18 + i * 0.42) * s, y0 + 0.44 * s, x0 + (0.18 + i * 0.42) * s, y1 - 0.04 * s, c, ww); arc(p, cx - 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); arc(p, cx + 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }
function plane(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - s, y: cy }, { x: cx + 0.7 * s, y: cy }, { x: cx + s, y: cy + 0.12 * s }, { x: cx + 0.7 * s, y: cy + 0.24 * s }, { x: cx - s, y: cy + 0.24 * s }], c, ww, true); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy + 0.6 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy - 0.36 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); }
function train(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - 0.9 * s, y: cy }, { x: cx - 0.9 * s, y: cy + 0.7 * s }, { x: cx + 0.5 * s, y: cy + 0.7 * s }, { x: cx + 0.9 * s, y: cy + 0.4 * s }, { x: cx + 0.9 * s, y: cy }], c, ww, true); hline(p, cx - 0.9 * s, cx + 0.5 * s, cy + 0.42 * s, { thickness: ww, color: c }); for (const dx of [-0.6, 0, 0.55]) arc(p, cx + dx * s, cy, 0.14 * s, 0.14 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }

function sceneBand(p, yBase, { c = hair } = {}) { hline(p, M, W - M, yBase, { thickness: 0.8, color: c }); mountains(p, M, yBase, CW * 0.5, 46, c, 0.9); sun(p, M + CW * 0.42, yBase + 40, 9, terra, 0.9); temple(p, M + CW * 0.62, yBase, 32, c, 0.9); palm(p, M + CW * 0.8, yBase, 26, sage, 0.9); palm(p, M + CW * 0.88, yBase, 20, sage, 0.9); boat(p, M + CW * 0.2, yBase + 4, 16, blue, 0.9); }

// ---------- furniture ----------
const newPage = () => { const p = doc.addPage([W, H]); paperBg(p); return p; };
function header(p, num, tag, title, accent = terra) {
  if (num) text(p, num, W - M - D.widthOfTextAtSize(num, 58), H - M - 52, { size: 58, font: D, color: accent, opacity: 0.15 });
  tracked(p, tag.toUpperCase(), M, H - M - 13, { size: 8.5, font: NB, color: accent, tracking: 2.2 });
  text(p, title, M, H - M - 44, { size: 25, font: D, color: ink });
  hline(p, M, W - M, H - M - 58, { thickness: 0.8 });
}
function footer(p, label) { hline(p, M, W - M, 44, { thickness: 0.6 }); tracked(p, "THE SLOW ATLAS", M, 31, { size: 7.5, font: NB, color: sub, tracking: 2 }); const r = label.toUpperCase(), rw = trackedW(r, { size: 7.5, font: NB, tracking: 2 }); tracked(p, r, W - M - rw, 31, { size: 7.5, font: NB, color: sub, tracking: 2 }); center(p, `— ${String(PAGE).padStart(2, "0")} —`, 31, { size: 8, font: SN, color: sub }); PAGE++; }

// coloured callout box (filling helper)
function callout(p, x, y, w, h, title, body, accent, art) {
  p.drawRectangle({ x, y: y - h, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  p.drawRectangle({ x, y: y - h, width: 3, height: h, color: accent });
  tracked(p, title.toUpperCase(), x + 14, y - 18, { size: 8, font: NB, color: accent, tracking: 1.6 });
  para(p, body, x + 14, y - 34, w - 28 - (art ? 70 : 0), { size: 9.5, font: SI, color: ink, leading: 13 });
  if (art) art(p, x + w - 38, y - h / 2 - 6);
}
// a faint decorative landscape, centred in a column — fills large gaps elegantly
function motif(p, x, w, cy, accent = terra) { mountains(p, x + 12, cy, w - 24, 46, hair, 1); sun(p, x + w * 0.42, cy + 40, 9, accent, 0.9); temple(p, x + w * 0.6, cy, 30, hair, 1); palm(p, x + w * 0.82, cy, 22, sage, 1); boat(p, x + w * 0.2, cy + 2, 16, blue, 1); }
// auto-fill the bottom of a page so there is never empty space
function fillRest(p, endY, tip, accent = terra, art) {
  const top = endY - 6, bottom = 62, gap = top - bottom; if (gap < 64) return;
  const defArt = art || ((pp, cx, cy) => { temple(pp, cx, cy - 16, 26, hair, 1); palm(pp, cx + 30, cy - 16, 20, sage, 1); });
  if (gap <= 190) { callout(p, M, top, CW, gap, "Local tip", tip, accent, defArt); return; }
  // big gap: a compact tip box, then a centred landscape fills the rest
  const lines = measureLines(tip, CW - 28 - 70), ch = 26 + lines * 13;
  callout(p, M, top, CW, ch, "Local tip", tip, accent, defArt);
  const sTop = top - ch - 12; if (sTop - bottom > 70) motif(p, M, CW, (sTop + bottom) / 2 - 18, accent);
}
function pageW(num, tag, title, accent, render, label, tip, art) {
  const p = newPage(); header(p, num, tag, title, accent);
  const endY = render(p, H - M - 88);
  if (tip && endY) fillRest(p, endY, tip, accent, art);
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
  for (const n of nodes) { p.drawCircle({ x: px(n.x), y: py(n.y), size: n.big ? 4 : 2.6, color: n.c || (n.big ? terra : ink) }); text(p, n.name, px(n.x) + (n.lx ?? 7), py(n.y) + (n.ly ?? -3), { size: n.big ? 9 : 8, font: n.big ? NB : SN, color: ink }); }
}

// ---------- big pages ----------
function cover() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  trackedCenter(p, "THE SLOW ATLAS", H - 128, { size: 9, font: NB, color: terra, tracking: 5 });
  center(p, "Thailand", H - 240, { size: 80, font: D, color: ink });
  center(p, "The Complete Guide", H - 282, { size: 34, font: D, color: terra });
  hline(p, W / 2 - 72, W / 2 + 72, H - 306, { thickness: 0.8, color: ink });
  center(p, "Where to go, what to eat, and how to travel it slowly.", H - 332, { size: 13, font: SI, color: sub });
  const yB = 196; mountains(p, M + 30, yB, CW - 60, 84, hair, 1); sun(p, W / 2, yB + 96, 16, terra, 1.1); temple(p, W / 2, yB, 60, ink, 1); palm(p, M + 64, yB, 46, sage, 1); palm(p, W - M - 74, yB, 42, sage, 1); boat(p, M + 120, yB - 6, 26, blue, 1); scooter(p, W - M - 150, yB + 6, 30, terra, 1);
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME I", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}
function intro() {
  pageW("", "Welcome", "Sawatdee — welcome", terra, (p, y0) => {
    let y = para(p, "There is nowhere quite like Thailand. In one trip you can wake to mist over northern mountains, ride a scooter past golden temples, eat the best meal of your life from a plastic stool on a side-street, and fall asleep to waves on a southern shore. It is dazzling, warm, deeply hospitable — and wonderfully easy to travel.", M, y0, CW, { leading: 15.5 }) - 6;
    y = para(p, "This guide is built to help you travel slowly and well: to understand the country, plan with confidence, and leave room for the unplanned afternoons that become the best memories. Everything you need is here — from your first visa question to your last bowl of noodles.", M, y, CW, { leading: 15.5 }) - 14;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "What's inside", M, top);
    yl = bullets(p, ["Before you go — timing, paperwork, health & packing", "Budget — what it really costs, with sample spends", "Destinations — the unmissable places, region by region", "Four ready-to-use itineraries, 7 to 14 days", "Getting around — a transport map, driving & scooter hire", "Where to stay, what to eat, what to do", "Culture, safety, responsible travel & a phrasebook"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "How to travel it slowly", x2, top, sage);
    yr = bullets(p, ["Choose one or two regions, not all four.", "Build in empty days — Thailand rewards lingering.", "Eat where the locals queue; say yes to the unfamiliar.", "Learn ten words of Thai; you'll be met with warmth.", "Move on the ground to see the country in between.", "Travel kindly — to people, animals and the land."], x2, yr, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Welcome", "Keep a little cash, a smile and an empty afternoon in your pocket — Thailand fills them better than any plan.", (pp, cx, cy) => { lantern(pp, cx, cy - 14, 26, terra, 1); });
}
function divider(num, kicker, title, subtitle, items, art, accent) {
  const p = newPage();
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: accent });
  p.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: cream, borderWidth: 0.8, color: undefined });
  text(p, num, (W - D.widthOfTextAtSize(num, 150)) / 2, H - 300, { size: 150, font: D, color: cream, opacity: 0.16 });
  trackedCenter(p, kicker.toUpperCase(), H - 150, { size: 9, font: NB, color: cream, tracking: 5 });
  center(p, title, H - 210, { size: 50, font: D, color: cream });
  hline(p, W / 2 - 52, W / 2 + 52, H - 232, { thickness: 0.9, color: cream });
  center(p, subtitle, H - 262, { size: 13.5, font: SI, color: cream });
  art(p, W / 2, H / 2 - 40, cream);
  // "in this part" list, centred, fills lower third
  let y = 250; trackedCenter(p, "IN THIS PART", y, { size: 8.5, font: NB, color: cream, tracking: 3 }); y -= 26;
  for (const it of items) { const wsz = SF.widthOfTextAtSize(it, 12); center(p, it, y, { size: 12, font: SF, color: cream }); y -= 22; }
  trackedCenter(p, "THE SLOW ATLAS", 64, { size: 8, font: NB, color: cream, tracking: 3 });
}

function destination(num, name, accent, lead, mustSee, practical, eat, getThere, label) {
  pageW(num, "Destinations", name, accent, (p, y0) => {
    let y = para(p, lead, M, y0, CW, { leading: 14.5 }) - 10;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Don't miss", M, top, accent); yl = bullets(p, mustSee, M, yl, colW, { accent });
    let yr = subhead(p, "Good to know", x2, top, sage); yr = bullets(p, practical, x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 12, top2 = yy;
    let zl = subhead(p, "Eat & drink", M, top2, terra); zl = bullets(p, eat, M, zl, colW, { accent: terra, size: 9.6 });
    let zr = subhead(p, "Getting there & around", x2, top2, blue); zr = bullets(p, getThere, x2, zr, colW, { accent: blue, size: 9.6 });
    return Math.min(zl, zr);
  }, label || name);
}
function itinerary(num, title, accent, intro, nodes, keys, days, tip, loop = false) {
  const p = newPage(); header(p, num, "Ready-to-use itineraries", title, accent);
  let y = para(p, intro, M, H - M - 88, CW * 0.56, { leading: 14 });
  drawMap(p, M + CW * 0.6, 150, CW * 0.4, H - M - 120 - 150, nodes, [{ color: accent, keys, loop }]);
  text(p, "Schematic — not to scale", M + CW * 0.6, 132, { size: 7.5, font: SI, color: sub });
  y -= 8;
  for (const [d, t, body] of days) { text(p, d, M, y, { size: 9.5, font: NB, color: accent }); text(p, t, M + 56, y, { size: 11, font: SB, color: ink }); y = para(p, body, M, y - 14, CW * 0.56, { size: 9.3, leading: 12.5 }) - 7; }
  if (tip) {
    const tw = CW * 0.56, lines = measureLines(tip, tw - 28), ch = 26 + lines * 13, ctop = y - 4;
    callout(p, M, ctop, tw, ch, "Make it yours", tip, accent);
    const gapTop = ctop - ch - 8, gapBot = 78;
    if (gapTop - gapBot > 90) motif(p, M, tw, (gapTop + gapBot) / 2 - 18, accent);
  }
  footer(p, title);
}

// ============================ CONTENT ============================
function whenToGo() {
  pageW("01", "Before you go", "When to go", ochre, (p, y0) => {
    let y = para(p, "Choosing the right window matters more in Thailand than almost anywhere — and the north and south often run on different clocks.", M, y0, CW, { leading: 14 }) - 6;
    for (const [n, w, a, d] of [["Cool & dry", "Nov – Feb", sage, "The sweet spot: clear skies, cool hill evenings. Peak season — book ahead, especially over New Year."], ["Hot", "Mar – May", ochre, "Fierce heat (35–40°C); Mar–Apr brings crop-burning haze to the north. Songkran (13–15 Apr) is a water-fight new year."], ["Green & wet", "Jun – Oct", blue, "Warm monsoon — short, heavy bursts rather than all-day rain. Lush, quiet, cheap; the Andaman coast is wettest."]]) { p.drawRectangle({ x: M, y: y - 30, width: 3, height: 42, color: a }); text(p, n, M + 14, y, { size: 12.5, font: SB, color: ink }); tracked(p, w.toUpperCase(), M + 14, y - 16, { size: 8, font: NB, color: a, tracking: 1.3 }); para(p, d, M + 150, y + 1, CW - 150, { size: 9.5, leading: 13 }); y -= 50; }
    y -= 4; y = subhead(p, "A month-by-month almanac", M, y, terra);
    const half = CW / 2 - 10, cols = [{ h: "Month", w: half * 0.22 }, { h: "Weather", w: half * 0.42 }, { h: "Don't miss", w: half * 0.36 }];
    table(p, M, y, cols, [["Jan", "Cool, dry, ideal", "Peak season"], ["Feb", "Warm, dry", "Flower festival"], ["Mar", "Hot, N. haze", "Islands shine"], ["Apr", "Hottest", "Songkran"], ["May", "Hot, first rains", "Low season"], ["Jun", "Warm, wet spells", "Green & cheap"]], { rowH: 18, fontSize: 9 });
    table(p, M + CW / 2 + 10, y, cols.map((c) => ({ ...c })), [["Jul", "Monsoon", "Buddhist Lent"], ["Aug", "Wet in places", "Quiet north"], ["Sep", "Heavy rains", "Lowest prices"], ["Oct", "Rains ease", "Veg. festival"], ["Nov", "Cool returns", "Loy Krathong"], ["Dec", "Cool, busy", "High season"]], { rowH: 18, fontSize: 9 });
    return 0;
  }, "When to Go");
}
function documents() {
  pageW("02", "Before you go", "Documents, health & money", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Entry & visas", M, yl);
    yl = bullets(p, ["Many nationalities (EU, UK, US, Australia, Canada…) enter visa-free for short stays — the exact number of days changes, so confirm the current rule for your passport before you fly.", "Passport valid 6+ months beyond arrival, with blank pages.", "Have proof of onward travel & accommodation ready.", "Longer/multiple-entry stays: arrange the right visa in advance.", "Never overstay — fines are charged per day at the airport."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Health & vaccinations", M, yl, sage);
    yl = bullets(p, ["See a travel clinic 6–8 weeks ahead for current advice.", "Routine jabs up to date; Hepatitis A & typhoid often advised.", "Dengue is mosquito-borne — repellent dusk & dawn.", "Insurance is essential — and MUST cover motorbikes if you'll ride.", "Tap water isn't safe; bottled or filtered only."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Money", x2, yr, blue);
    yr = bullets(p, ["The baht (THB) is cash-first outside cities; carry small notes.", "ATMs everywhere but charge ≈THB 220 per foreign withdrawal — take more, less often.", "Cards work in malls, hotels & chains; markets are cash only.", "Tell your bank you're travelling; carry a backup card, stored apart.", "Tipping isn't expected; rounding up is kind."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Connectivity", x2, yr, ochre);
    yr = bullets(p, ["Tourist SIM (AIS, TrueMove, dtac) at the airport, or an eSIM before you fly.", "Data is fast & cheap; coverage excellent outside deep mountains.", "Save offline maps for road trips."], x2, yr, colW, { accent: ochre });
    // editorial column rule (filet) between the two columns
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Documents", "Three things change most often — visa length, prices and opening hours. Re-check them on the official sites a few days before you fly.");
}
function packing() {
  pageW("03", "Before you go", "What to pack", sage, (p, y0) => {
    let y = para(p, "Thailand is hot, humid and casual — pack light, in natural fabrics, and leave room for what you'll buy. Laundry is cheap and everywhere, so a week's clothes is plenty.", M, y0, CW, { leading: 14 }) - 8;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Clothing", M, top, terra); yl = bullets(p, ["Light, loose, quick-dry clothes", "One set covering shoulders & knees (temples)", "A light layer for cool northern evenings", "Swimwear + a sarong (modesty, beach, picnic)", "Walking sandals + trainers", "A packable rain jacket"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Health & essentials", x2, top, sage); yr = bullets(p, ["High-SPF, reef-safe sunscreen + sun hat", "Insect repellent (DEET) & after-bite", "First-aid kit, rehydration salts, your meds", "Hand sanitiser & tissues", "Universal adapter & power bank", "Refillable water bottle"], x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 12;
    yy = subhead(p, "Documents to carry (paper + digital copies)", M, yy, blue);
    yy = bullets(p, ["Passport, visa, insurance details", "Driving licence + International Driving Permit (if driving)", "Card details & emergency numbers stored offline", "A few passport photos for any on-the-spot paperwork"], M, yy, CW, { accent: blue });
    return yy;
  }, "Packing", "In the wet season, a THB-20 plastic poncho from any 7-Eleven beats the smartest rain jacket — buy one and stash it under your seat.", (pp, cx, cy) => { scooter(pp, cx, cy - 14, 28, sage, 1); });
}
function budget() {
  pageW("04", "Budget", "What Thailand costs", terra, (p, y0) => {
    let y = para(p, "Thailand suits every budget. You can travel beautifully on very little, or indulge for a fraction of European prices. Here's what to expect per person, per day, on the ground.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Style", w: CW * 0.18 }, { h: "Per day", w: CW * 0.2 }, { h: "What it looks like", w: CW * 0.62 }], [["Backpacker", "THB 900–1,500", "Hostels & fan rooms, street food, scooters, public transport"], ["Comfort", "THB 2,500–4,500", "Smart guesthouses & 3★ hotels, restaurants, some flights & tours"], ["Boutique", "THB 6,000+", "Design hotels & resorts, private drivers, spas, fine dining"]], { rowH: 26, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Sample 2-week comfort budget", M, top, sage);
    let yl2 = table(p, M, yl, [{ h: "Item", w: colW * 0.62 }, { h: "≈ THB", w: colW * 0.38 }], [["Accommodation (13 nights)", "16,000"], ["Food & drink", "9,000"], ["Transport & 1–2 flights", "7,000"], ["Activities & tours", "6,000"], ["Scooter / car & fuel", "3,500"], ["SIM, extras, buffer", "3,500"]], { rowH: 17, fontSize: 9, headerColor: sage });
    text(p, "≈ THB 45,000  ·  about €1,150 / £980 / $1,250", M, yl2 - 4, { size: 9.5, font: SB, color: terra });
    let yr = subhead(p, "Prices to anchor on", x2, top, blue);
    yr = bullets(p, ["Street meal: THB 50–80", "Restaurant main: THB 120–250", "Local beer: THB 70–100", "Coffee: THB 50–80", "Scooter hire: THB 200–300/day", "Litre of petrol: ≈THB 40", "Guesthouse double: THB 600–1,200", "Domestic flight: THB 1,000–2,500", "Train (2nd class): THB 200–900", "Day tour: THB 800–1,800"], x2, yr, colW, { accent: blue, gap: 2 });
    p.drawLine({ start: { x: M + CW / 2, y: top + 4 }, end: { x: M + CW / 2, y: Math.min(yl2 - 18, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl2 - 18, yr);
  }, "Budget", "Thailand is one of the few places where 'comfort' costs less than 'budget' back home — what you save on the daily spend, treat yourself with on one special night.");
}
function regionsMap() {
  pageW("05", "Destinations", "The lie of the land", blue, (p, y0) => {
    let y = para(p, "Thailand falls into four broad regions. Don't try to cover them all — choose one or two and travel slowly.", M, y0, CW * 0.5, { leading: 14 }) - 8;
    for (const [n, a, d] of [["The North", terra, "Mountains, Lanna temples, hill tribes, the best road trips and cool air. Chiang Mai, Pai, Mae Hong Son."], ["The Centre", blue, "Bangkok's energy, ancient Ayutthaya, the River Kwai, beaches at Hua Hin. The hub you'll arrive in."], ["Isaan (NE)", sage, "Khmer ruins, silk villages, the Mekong, fiery food, few tourists, big welcomes."], ["The South", ochre, "Two coasts of islands, karsts and rainforest. Phuket, Krabi, Khao Sok, Koh Lanta, the Gulf isles."]]) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 12, y, { size: 12, font: SB, color: ink }); y = para(p, d, M + 12, y - 14, CW * 0.5 - 12, { size: 9.3, leading: 12.5 }) - 9; }
    // fill the lower-left with an editorial box (colours below match the map)
    encadre(p, M, y - 2, CW * 0.5, "Insider tip", "Each region has its own colour on the map opposite — and its own pace. Link two at most, ideally with a short internal flight, and let the road in between be part of the trip.");
    // colour each city by its region; connect them with faint regional 'constellations'
    const nodes = [
      { key: "cnx", name: "Chiang Mai", x: 0.42, y: 0.92, big: true, c: terra }, { key: "pai", name: "Pai", x: 0.3, y: 0.99, c: terra }, { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.9, lx: -78, ly: 4, c: terra },
      { key: "bkk", name: "Bangkok", x: 0.5, y: 0.5, big: true, c: blue }, { key: "ayu", name: "Ayutthaya", x: 0.46, y: 0.6, c: blue }, { key: "kan", name: "Kanchanaburi", x: 0.3, y: 0.54, lx: -84, c: blue }, { key: "kyai", name: "Khao Yai", x: 0.62, y: 0.58, c: blue },
      { key: "isn", name: "Isaan", x: 0.8, y: 0.66, lx: 6, c: sage },
      { key: "krabi", name: "Krabi", x: 0.42, y: 0.14, c: ochre }, { key: "phuket", name: "Phuket", x: 0.33, y: 0.1, lx: -44, c: ochre }, { key: "samui", name: "Ko Samui", x: 0.58, y: 0.2, c: ochre },
    ];
    const routes = [
      { color: terra, keys: ["mhs", "pai", "cnx"] },
      { color: blue, keys: ["kan", "bkk", "ayu"] }, { color: blue, keys: ["bkk", "kyai"] },
      { color: ochre, keys: ["phuket", "krabi", "samui"] },
    ];
    drawMap(p, M + CW * 0.56, 116, CW * 0.42, H - M - 106 - 116, nodes, routes);
    text(p, "Schematic — not to scale", M + CW * 0.56, 98, { size: 7.5, font: SI, color: sub });
    return 0;
  }, "Regions");
}
function islandsTable() {
  pageW("09", "Destinations", "Which island?", ochre, (p, y0) => {
    let y = para(p, "Thailand has hundreds of islands across two coasts. Here's how the best-loved ones compare, so you can match the island to your mood.", M, y0, CW, { leading: 14 }) - 8;
    const cols = [{ h: "Island", w: CW * 0.18 }, { h: "Coast", w: CW * 0.12 }, { h: "Vibe", w: CW * 0.34 }, { h: "Best for", w: CW * 0.36 }];
    y = table(p, M, y, cols, [
      ["Phuket", "Andaman", "Big, busy, every comfort", "Easy access, resorts, nightlife"],
      ["Koh Lanta", "Andaman", "Long, mellow beaches", "Families, slow couples, sunsets"],
      ["Railay / Ao Nang", "Andaman", "Karst cliffs by the sea", "Climbing, dramatic scenery"],
      ["Koh Phi Phi", "Andaman", "Beautiful but party-busy", "Young travellers, day trips"],
      ["Koh Samui", "Gulf", "Polished resort island", "Comfort, flights, families"],
      ["Koh Pha-ngan", "Gulf", "Jungle & Full-Moon Party", "Beach life + nightlife"],
      ["Koh Tao", "Gulf", "Small, laid-back", "Cheap, world-class diving"],
      ["Koh Chang", "East", "Big, forested, quieter", "Nature, fewer crowds"],
    ], { rowH: 24, fontSize: 9.2 }) - 8;
    callout(p, M, y, CW, y - 62, "When to go where", "Andaman coast (Phuket, Krabi, Lanta): driest Nov–Apr. Gulf coast (Samui, Pha-ngan, Tao): best Feb–Apr & Jul–Aug. If one coast is wet, the other is often fine — that's the beauty of two seas.", blue, (pp, cx, cy) => { boat(pp, cx, cy - 8, 18, blue, 1); });
    return 0;
  }, "Islands");
}
function transportMap() {
  pageW("13", "Getting around", "The transport network", blue, (p, y0) => {
    let y = para(p, "Thailand is superbly connected. Domestic flights are cheap and quick; trains are scenic; buses and minivans reach everywhere; ferries link the islands. This map shows how the main hubs join up.", M, y0, CW * 0.56, { leading: 14 }) - 8;
    // diagram
    const bx = M, by = 150, bw = CW * 0.58, bh = y - 150 - 8;
    const N = { bkk: [0.5, 0.5], cnx: [0.3, 0.95], cri: [0.46, 0.99], ayu: [0.46, 0.62], isn: [0.85, 0.7], huahin: [0.42, 0.3], phuket: [0.18, 0.08], krabi: [0.34, 0.12], samui: [0.6, 0.16] };
    const px = (k) => bx + N[k][0] * bw, py = (k) => by + N[k][1] * bh;
    const edge = (a, b, color, dash) => p.drawLine({ start: { x: px(a), y: py(a) }, end: { x: px(b), y: py(b) }, thickness: 1.3, color, ...(dash ? { dashArray: dash } : {}) });
    // flights (solid terra)
    for (const [a, b] of [["bkk", "cnx"], ["bkk", "phuket"], ["bkk", "krabi"], ["bkk", "samui"], ["bkk", "isn"]]) edge(a, b, terra);
    // trains (dashed blue)
    for (const [a, b] of [["bkk", "ayu"], ["bkk", "cnx"], ["bkk", "isn"], ["bkk", "huahin"]]) edge(a, b, blue, [4, 3]);
    // buses/ferries (dotted sage)
    for (const [a, b] of [["bkk", "huahin"], ["phuket", "krabi"], ["krabi", "samui"], ["cnx", "cri"]]) edge(a, b, sage, [1.4, 3]);
    const names = { bkk: "Bangkok", cnx: "Chiang Mai", cri: "Chiang Rai", ayu: "Ayutthaya", isn: "Isaan", huahin: "Hua Hin", phuket: "Phuket", krabi: "Krabi", samui: "Ko Samui" };
    for (const k of Object.keys(N)) { const big = k === "bkk"; p.drawCircle({ x: px(k), y: py(k), size: big ? 4.5 : 3, color: big ? terra : ink }); text(p, names[k], px(k) + 7, py(k) - 3, { size: big ? 9 : 8, font: big ? NB : SN, color: ink }); }
    // legend + tips on the right
    const x2 = M + CW * 0.62, colW = CW * 0.38;
    let yr = subhead(p, "Legend", x2, y0 - 4, terra);
    const leg = [[terra, null, "Flights — fast, cheap, frequent"], [blue, [4, 3], "Trains — scenic & characterful"], [sage, [1.4, 3], "Buses & ferries"]];
    for (const [c, dash, lab] of leg) { p.drawLine({ start: { x: x2, y: yr + 3 }, end: { x: x2 + 22, y: yr + 3 }, thickness: 1.4, color: c, ...(dash ? { dashArray: dash } : {}) }); text(p, lab, x2 + 30, yr, { size: 9, font: SF, color: sub }); yr -= 17; }
    yr -= 6; yr = subhead(p, "Rules of thumb", x2, yr, blue);
    yr = bullets(p, ["North to south: fly (1–1.5 h vs 12+ h overland).", "Bangkok–Ayutthaya: hop on a cheap local train.", "The overnight sleeper to Chiang Mai is a classic.", "Islands: fly to the nearest airport, then ferry.", "Book trains, buses & ferries on 12Go."], x2, yr, colW, { accent: blue });
    return 0;
  }, "Transport Map");
}
function transport() {
  pageW("14", "Getting around", "Modes of transport", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    const icons = [[plane, terra, "Flights", "Cheap and quick with AirAsia, Nok, Thai Lion & Bangkok Airways. Best for north to south. Book ahead for the lowest fares."], [train, blue, "Trains", "Scenic and social. 2nd-class A/C is comfy; the overnight sleeper to Chiang Mai is a rite of passage. Reserve ahead."]];
    let yl = y0;
    for (const [ic, c, t, d] of icons) { ic(p, M + 12, yl - 6, 22, c, 1.1); text(p, t, M + 40, yl, { size: 12.5, font: SB, color: ink }); yl = para(p, d, M, yl - 18, colW, { size: 9.5, leading: 13 }) - 12; }
    const icons2 = [[bus, sage, "Buses & minivans", "Reach everywhere; comfy 'VIP' coaches on big routes. Minivans are faster but cramped."], [boat, blue, "Ferries & long-tails", "Link the islands (reduced in monsoon). Long-tails for short hops — agree the price first."]];
    let yr = y0;
    for (const [ic, c, t, d] of icons2) { ic(p, x2 + 12, yr - 6, 20, c, 1.1); text(p, t, x2 + 40, yr, { size: 12.5, font: SB, color: ink }); yr = para(p, d, x2, yr - 18, colW, { size: 9.5, leading: 13 }) - 12; }
    let y = Math.min(yl, yr) - 6; y = subhead(p, "In town", M, y, terra);
    y = bullets(p, ["Bangkok: BTS Skytrain + MRT metro — fast, cheap, air-conditioned.", "Grab & Bolt apps for metered, hassle-free rides (pay in-app).", "Metered taxis: insist on the meter. Tuk-tuks: agree the fare first.", "Songthaews (shared pick-ups) run fixed routes for a few baht.", "Motorbike taxis (orange vests) for quick solo hops."], M, y, CW, { accent: terra });
    return 0;
  }, "Transport");
}
function driving() {
  pageW("15", "Getting around", "Driving & renting a scooter", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "The rules", M, yl, terra);
    yl = bullets(p, ["Carry an International Driving Permit + your licence — checkpoints are common and insurance depends on it.", "Drive on the LEFT; give way to bigger vehicles.", "Helmets are law (and life-saving); wear closed shoes.", "Avoid night driving on rural roads.", "Fuel is cheap; fill up before remote stretches."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Renting a scooter — checklist", M, yl, sage);
    yl = bullets(p, ["Choose 150cc+ for mountains; 125cc is fine in town.", "Photograph every scratch with the owner first.", "Never leave your passport as deposit — pay cash.", "Check brakes, tyres, lights; insist on a good helmet.", "Confirm your travel insurance covers motorbikes."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Where to rent — the main hubs", x2, yr, blue);
    yr = bullets(p, ["Chiang Mai & Pai — the northern loop's launchpads; lots of choice.", "Phuket, Krabi & Ao Nang — easy island & coast hire.", "Koh Lanta, Samui, Pha-ngan — scooters rule the islands.", "Sukhothai & Ayutthaya — perfect for touring the ruins.", "Avoid renting in central Bangkok — traffic is brutal; use the BTS."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Car hire", x2, yr, ochre);
    yr = bullets(p, ["From ≈THB 900–1,400/day; international desks at every airport.", "Safer for families and the rainy season; air-con is a blessing.", "Take the fullest insurance; photograph the car all round first."], x2, yr, colW, { accent: ochre });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Driving");
}
function accommodation() {
  pageW("16", "Where to stay", "Accommodation", sage, (p, y0) => {
    let y = para(p, "Thailand has some of the best-value beds in the world — from £6 hostel bunks to design hotels that would cost five times more in Europe. Book the first and last nights ahead; improvise the middle.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Type", w: CW * 0.24 }, { h: "≈ /night", w: CW * 0.2 }, { h: "Best for", w: CW * 0.56 }], [["Hostel / guesthouse", "THB 200–700", "Backpackers, solo travellers, meeting people"], ["Boutique guesthouse", "THB 800–1,800", "Character & comfort without the price"], ["3–4★ hotel / resort", "THB 1,800–4,500", "Pools, breakfast, families"], ["Design / luxury", "THB 5,000+", "Special occasions, honeymoons"], ["Homestay / raft-house", "THB 500–1,500", "Villages, national parks, real local life"]], { rowH: 22, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Where to base yourself", M, top, terra); yl = bullets(p, ["Bangkok: Old Town (river, temples) or Sukhumvit (BTS, food).", "Chiang Mai: inside or just outside the old-city moat.", "Krabi: Ao Nang for access; Railay to wake by the cliffs.", "Islands: west coast for sunsets; quiet beaches need a scooter."], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Booking tips", x2, top, blue); yr = bullets(p, ["Read recent reviews for cleanliness, noise & Wi-Fi.", "A/C vs fan: worth it in the lowlands; fan is fine up north.", "High season & holidays: book well ahead.", "Off-season walk-ins can be bargained — politely.", "Check the map pin, not just the photos."], x2, yr, colW, { accent: blue });
    return Math.min(yl, yr);
  }, "Accommodation", "Many guesthouses are cheaper booked by a quick message or phone call than through an app — and they'll often pick you up from the bus stop.", (pp, cx, cy) => { temple(pp, cx, cy - 16, 28, sage, 1); });
}
function eating() {
  pageW("17", "Food & drink", "How to eat in Thailand", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Street food, decoded", M, yl);
    yl = bullets(p, ["The best meals come from carts and tiny shophouses — follow the crowds of locals.", "Many stalls cook one dish brilliantly; point if you can't pronounce it.", "Sit, eat, pay after; a bowl of noodles is THB 50–80.", "Markets cluster at dawn and dusk — arrive hungry.", "Busy + fresh + hot = safe. Watch it cooked."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "Spice & ordering", M, yl, terra);
    yl = bullets(p, ["'Mai phet' = not spicy; 'phet nit noi' = a little (still a lot!).", "Season at the table: fish sauce, chilli, sugar, vinegar.", "Rice ('khao') is the centre; share dishes family-style.", "Spoon & fork: the fork pushes, the spoon delivers."], M, yl, colW, { accent: terra });
    yr = subhead(p, "Vegetarian & allergies", x2, yr, sage);
    yr = bullets(p, ["'Mangsawirat' = vegetarian; 'jay' = strict vegan — look for the yellow-red 'เจ' flag.", "Fish sauce & shrimp paste hide everywhere — 'mai sai nam pla / kapi'.", "Peanuts are common; carry an allergy translation card.", "The Vegetarian Festival (Oct) is a feast for plant-eaters."], x2, yr, colW, { accent: sage }) - 4;
    yr = subhead(p, "What to drink", x2, yr, blue);
    yr = bullets(p, ["Cha yen — sweet orange iced tea.", "Nam manao — fresh lime soda.", "Fruit shakes ('mai sai nam tan' for no sugar).", "Singha, Chang & Leo — ice-cold local beers.", "Roadside coffee — Café Amazon is everywhere."], x2, yr, colW, { accent: blue });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Eating");
}
function dishesNorth() {
  pageW("18", "Food & drink", "What to order · North & Centre", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "The North", M, y0, terra);
    for (const [a, b] of [["Khao soi", "the crown — egg noodles in coconut curry, crisp noodles on top"], ["Sai ua", "herby grilled Chiang Mai sausage"], ["Nam prik num", "smoky green-chilli dip with sticky rice"], ["Gaeng hang lay", "rich Burmese-style pork curry"], ["Khanom jeen nam ngiao", "rice noodles in tomato-pork broth"], ["Khao niao", "sticky rice — eaten by hand"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "Central & Bangkok", x2, y0, blue);
    for (const [a, b] of [["Pad krapow", "holy-basil stir-fry + fried egg — the comfort dish"], ["Tom yum goong", "hot-and-sour prawn soup"], ["Tom kha gai", "coconut-galangal chicken soup"], ["Pad thai", "the famous wok noodles"], ["Khao man gai", "Hainanese chicken & rice"], ["Massaman", "mild, fragrant curry of Persian roots"], ["Mango sticky rice", "khao niao mamuang — the dessert"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    return Math.min(yl, yr);
  }, "Dishes I", "Order several small dishes from different stalls and share — that, not a single big plate, is how Thais eat best.", (pp, cx, cy) => { bowl(pp, cx, cy - 14, 22, ochre, 1); });
}
function dishesSouth() {
  pageW("18", "Food & drink", "What to order · Isaan & South", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Isaan (North-East)", M, y0, sage);
    for (const [a, b] of [["Som tam", "pounded green-papaya salad — 'phet nit noi'!"], ["Larb", "zingy minced-meat salad, herbs & toasted rice"], ["Gai yang", "marinated grilled chicken"], ["Sai krok Isan", "sour fermented pork sausage"], ["Nam tok", "'waterfall' grilled-beef salad"], ["Khao niao", "sticky rice — the staple"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "The South & sweets", x2, y0, ochre);
    for (const [a, b] of [["Gaeng tai pla", "intense southern fish curry — for the brave"], ["Khao yam", "fresh herbal rice salad"], ["Seafood & massaman", "coconut-rich, fragrant, often milder"], ["Grilled seafood", "by the beach, with nam jim dip"], ["Roti", "griddled banana-and-egg pancake"], ["Tropical fruit", "mangosteen, rambutan, durian (if you dare)"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    let y = Math.min(yl, yr) - 12; y = subhead(p, "Market wisdom", M, y, blue);
    y = bullets(p, ["Morning markets for fruit, coffee & rice dishes; night markets for grills, noodles & sweets.", "A bag of cut fruit with chilli-salt is the perfect THB-20 snack.", "Look for the stall with the longest local queue — always."], M, y, CW, { accent: blue });
    return y;
  }, "Dishes II");
}
function activities() {
  pageW("19", "Experiences", "Things to do", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Culture & spirit", M, yl, terra);
    yl = bullets(p, ["Temple-hop the great wats — early, modestly dressed.", "Give alms to monks at dawn, respectfully.", "See Loy Krathong & Yi Peng lanterns (Nov).", "Take a Thai cooking class — a half-day highlight.", "A traditional Thai massage (from THB 250/hour)."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Mountains & jungle", M, yl, sage);
    yl = bullets(p, ["Trek to hill-tribe villages & waterfalls up north.", "Ride the Mae Hong Son Loop by scooter or car.", "Kayak Khao Sok's jungle lake; spot gibbons at Khao Yai.", "Chase waterfalls — Erawan's seven turquoise tiers."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Sea & islands", x2, yr, blue);
    yr = bullets(p, ["Learn to dive on Ko Tao — famously cheap and good.", "Long-tail or kayak through Phang Nga & Krabi karsts.", "Island-hop by ferry; find a beach with no name.", "Sunset from a long-tail, then seafood on the sand."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "With animals — ethically", x2, yr, ochre);
    yr = bullets(p, ["Choose genuine sanctuaries where elephants roam and are never ridden — research first.", "Avoid riding, shows and tiger selfies.", "Watch wildlife in national parks, at a respectful distance."], x2, yr, colW, { accent: ochre });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Activities");
}
function culture() {
  pageW("20", "Practical tips", "Culture & etiquette", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Do", M, yl, sage);
    yl = bullets(p, ["Return a 'wai' (palms together) with a smile.", "Dress modestly at temples; shoes off.", "Keep calm; a smile defuses almost anything ('jai yen').", "Give & receive with your right hand, or both.", "Ask before photographing people."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Don't", M, yl, terra);
    yl = bullets(p, ["Touch anyone's head — even a child's.", "Point your feet at people or Buddha images.", "Raise your voice or show anger ('losing face').", "Disrespect the monarchy — it's against the law.", "Women: don't touch or hand things directly to monks."], M, yl, colW, { accent: terra });
    yr = subhead(p, "The ideas behind it", x2, yr, blue);
    yr = para(p, "Two words explain a lot of Thailand. 'Sanuk' is the belief that life — even work — should have an element of fun. 'Jai yen', a cool heart, prizes calm over confrontation. And 'mai pen rai' — never mind, it's fine — is a whole gentle philosophy of letting things go.", x2, yr, colW, { leading: 13.5 }) - 8;
    yr = subhead(p, "At the temple (wat)", x2, yr, ochre);
    yr = bullets(p, ["Cover up, shoes & hat off, lower your voice.", "Sit with feet tucked behind you.", "A small donation helps with upkeep.", "Never climb on ruins or Buddha images."], x2, yr, colW, { accent: ochre });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Culture");
}
function safety() {
  pageW("21", "Practical tips", "Safety, scams & responsible travel", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Common scams — smile & decline", M, yl, ochre);
    yl = bullets(p, ["'The temple/palace is closed today' — it isn't; the tout has a gem shop.", "Cheap tuk-tuk 'tours' that detour to commission stops.", "Rigged taxi meters — insist on the meter or agree first.", "Jet-ski / scooter 'damage' claims — photograph everything at pickup.", "Over-friendly strangers with card games or 'free' drinks."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "Stay safe", M, yl, blue);
    yl = bullets(p, ["Thailand is generally very safe; petty theft is the main risk.", "Use hotel safes; keep a card & cash separate.", "Respect the sea — heed red flags & rip currents.", "Insurance must cover motorbikes if you'll ride."], M, yl, colW, { accent: blue });
    yr = subhead(p, "Travel responsibly", x2, yr, sage);
    yr = bullets(p, ["Refill a bottle — plastic waste is a real problem.", "Reef-safe sunscreen; never touch coral.", "Buy from local markets, kitchens & guides.", "Choose ethical animal experiences (no riding/shows).", "Carry out your litter on remote roads & trails.", "Dress and behave modestly at sacred sites."], x2, yr, colW, { accent: sage }) - 4;
    yr = subhead(p, "Emergency numbers", x2, yr, terra);
    yr = bullets(p, ["Police 191 · Ambulance 1669", "Tourist Police (English) 1155", "Tourism Authority (TAT) 1672"], x2, yr, colW, { accent: terra });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Safety");
}
function phrasebook1() {
  pageW("22", "Useful expressions", "A Thai phrasebook · I", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Essentials", M, y0);
    for (const [a, b] of [["Hello", "sawatdee (khrap/kha)"], ["Thank you", "khop khun (khrap/kha)"], ["Yes / No", "chai / mai chai"], ["Please", "karuna"], ["Sorry / excuse me", "khor thot"], ["No worries", "mai pen rai"], ["Do you speak English?", "phut angkrit dai mai?"], ["I don't understand", "mai khao jai"], ["My name is…", "phom/chan chue…"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    yl -= 4; yl = subhead(p, "Numbers", M, yl, sage);
    yl = para(p, "1 nung · 2 song · 3 sam · 4 si · 5 ha · 6 hok · 7 jet · 8 paet · 9 kao · 10 sip · 20 yi-sip · 100 nung roi · 1,000 nung phan", M, yl, colW, { size: 9.5, leading: 14 });
    let yr = subhead(p, "Getting around", x2, y0, terra);
    for (const [a, b] of [["Where is…?", "…yu thi nai?"], ["How much?", "tao rai?"], ["Too expensive", "phaeng pai"], ["Turn left / right", "liao sai / liao khwa"], ["Straight on", "trong pai"], ["Stop here", "jort thi ni"], ["Bus / train station", "sathani rot / rot fai"], ["Petrol station", "pam nam man"], ["Toilet", "hong nam"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook I", "Tones matter, but warmth matters more. Even a shaky 'sawatdee' delivered with a smile is met with delight — try it on the first person you meet.");
}
function phrasebook2() {
  pageW("22", "Useful expressions", "A Thai phrasebook · II", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "At the table", M, y0, terra);
    for (const [a, b] of [["Delicious!", "aroi!"], ["Not spicy, please", "mai phet"], ["A little spicy", "phet nit noi"], ["Vegetarian / vegan", "mangsawirat / jay"], ["No fish sauce", "mai sai nam pla"], ["The bill, please", "check bin"], ["Water", "nam plao"], ["Cheers!", "chon kaew!"], ["I'm allergic to…", "phae…"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    let yr = subhead(p, "Time & small talk", x2, y0, sage);
    for (const [a, b] of [["Today / tomorrow", "wan ni / phrung ni"], ["How are you?", "sabai dee mai?"], ["I'm well", "sabai dee"], ["Beautiful", "suay"], ["Friend", "phuean"], ["Good luck", "chok dee"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    yr -= 4; yr = subhead(p, "Emergencies", x2, yr, terra);
    for (const [a, b] of [["Help!", "chuay duay!"], ["Hospital", "rong phayaban"], ["Police", "tamruat"], ["I'm lost", "chan long thang"], ["Call a doctor", "riak mor"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    let y = Math.min(yl, yr) - 10;
    callout(p, M, y, CW, y - 62, "Say it with a smile", "Thai is tonal, so don't worry about perfection — a warm 'sawatdee khrap/kha' opens every door. Men end politely with 'khrap', women with 'kha'.", blue, (pp, cx, cy) => { lantern(pp, cx, cy - 8, 18, blue, 1); });
    return 0;
  }, "Phrasebook II");
}
// ---- editorial encadré (inline box) ----
function measureLines(s, w, { size = 9.5, font = SI } = {}) { let line = "", n = 0; for (const word of s.split(" ")) { const t = line ? line + " " + word : word; if (font.widthOfTextAtSize(t, size) > w) { n++; line = word; } else line = t; } if (line) n++; return n; }
function encadre(p, x, y, w, kind, body) {
  const colors = { "Did you know?": blue, "Insider tip": sage, "Avoid": terra }; const accent = colors[kind] || terra;
  const tw = w - 28, lines = measureLines(body, tw), h = 26 + lines * 13;
  p.drawRectangle({ x, y: y - h, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  p.drawRectangle({ x, y: y - h, width: 3, height: h, color: accent });
  tracked(p, kind.toUpperCase(), x + 14, y - 16, { size: 8, font: NB, color: accent, tracking: 1.4 });
  para(p, body, x + 14, y - 30, tw, { size: 9.5, font: SI, color: ink, leading: 13 });
  return y - h - 14;
}
function checkBoxLine(p, x, y, label, w, accent = terra) { p.drawRectangle({ x, y, width: 9, height: 9, borderColor: accent, borderWidth: 1, color: undefined }); para(p, label, x + 16, y + 7, w - 16, { size: 9.5, font: SF, color: ink, leading: 12 }); }

function cultureHistory() {
  pageW("11", "Culture & heritage", "A short history & the arts", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "A timeline, in brief", M, y0, terra);
    for (const [a, b] of [["Early kingdoms", "Dvaravati & strong Khmer influence (10th–12th c.) — the temples of Isan."], ["Sukhothai, 13th c.", "The first Thai kingdom; a golden age of art and the Thai script."], ["Ayutthaya, 1351–1767", "A powerful, cosmopolitan capital, razed by the Burmese."], ["Bangkok, from 1782", "The Chakri dynasty; Siam alone in Asia was never colonised."], ["Today", "A constitutional monarchy, and a creative boom in design & film."]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 3;
    yl -= 4; yl = encadre(p, M, yl, colW, "Did you know?", "Bangkok is home to Michelin-starred street-food stalls — pavement cooking here is treated as an art, not a last resort.");
    let yr = subhead(p, "Heritage to seek out", x2, y0, sage);
    yr = bullets(p, ["Bangkok's wats: Pho, Arun & the Emerald Buddha.", "The UNESCO ruins of Ayutthaya & Sukhothai.", "Chiang Mai's Lanna temples & Doi Suthep.", "Isan's Khmer sanctuaries — Phimai & Phanom Rung.", "Jim Thompson House — silk, art & a mystery."], x2, yr, colW, { accent: sage }) - 6;
    yr = subhead(p, "The living scene", x2, yr, blue);
    yr = bullets(p, ["Creative districts (Charoenkrung, Bangkok).", "Auteur cinema — Apichatpong's Palme d'Or.", "Craft that's still made by hand: ceramics, weaving, lacquer.", "Festivals that light the calendar (see When to go)."], x2, yr, colW, { accent: blue });
    return Math.min(yl, yr);
  }, "Culture & History", "Pair a temple at dawn with a museum at noon: Thailand reveals itself fastest through its sacred spaces and its makers.");
}
function shopping() {
  pageW("12", "Take a little home", "Shopping & craft", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Where to shop", M, yl, terra);
    yl = bullets(p, ["Markets — Chatuchak (Bangkok), the Chiang Mai night bazaars.", "Air-conditioned malls — ICONSIAM for a rainy afternoon.", "Village workshops — Isan silk, Lampang ceramics, Bo Sang umbrellas.", "Floating & weekend markets for the theatre of it."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Worth buying", M, yl, sage);
    yl = bullets(p, ["Thai silk, celadon & lacquerware.", "Curry pastes, spices & dried fruit.", "Teak and bamboo homeware.", "Hill-tribe textiles & cotton clothing."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Buy smart", x2, yr, blue);
    yr = bullets(p, ["Counterfeits are everywhere — and illegal to import home.", "Bargain with a smile in markets; fixed prices in malls.", "Favour authentic craft over fakes — it lasts and it gives back.", "Check weight & fragility before you commit to ceramics."], x2, yr, colW, { accent: blue }) - 6;
    yr = encadre(p, x2, yr, colW, "Avoid", "Exporting genuine antiques or old Buddha images is forbidden without a Fine Arts Department permit — and buying a Buddha head as a 'souvenir' is best avoided out of respect.");
    return Math.min(yl, yr);
  }, "Shopping", "The best souvenirs are edible or wearable — curry pastes, silk, a hand-thrown bowl — and they keep the craft alive back home.");
}
function travellers() {
  pageW("21", "Practical tips", "For every traveller", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Solo women", M, yl, terra);
    yl = bullets(p, ["Widely regarded as safe and easy; usual night-time sense applies.", "Modest dress is appreciated away from the beach.", "Night transport is reliable — trains, Grab."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Reduced mobility", M, yl, sage);
    yl = bullets(p, ["Bangkok improves (BTS lifts, accessible big hotels) but pavements are uneven and temples often have steps.", "Favour newer hotels; confirm access in advance.", "Plan private taxis/transfers; some resorts offer adapted rooms."], M, yl, colW, { accent: sage });
    yr = subhead(p, "LGBTQ+", x2, yr, ochre);
    yr = bullets(p, ["Among Asia's most welcoming destinations.", "Visible scenes in Bangkok, Phuket & Chiang Mai.", "Usual discretion in rural and religious areas."], x2, yr, colW, { accent: ochre }) - 4;
    yr = subhead(p, "Digital nomads", x2, yr, blue);
    yr = bullets(p, ["Fast, cheap internet; superb café & coworking culture (Chiang Mai, Bangkok).", "Check the latest long-stay / remote-work visas before you commit."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Business", x2, yr, terra);
    yr = bullets(p, ["Districts: Sathorn, Sukhumvit, Silom.", "Exchange cards with both hands; a small gift is appreciated.", "Easy to bolt a few leisure days onto a work trip."], x2, yr, colW, { accent: terra });
    p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });
    return Math.min(yl, yr);
  }, "Travellers", "Whatever your profile, the same rule serves you well in Thailand: dress modestly, keep a cool heart, and a smile unlocks the rest.");
}
function resources() {
  pageW("23", "Before you leave the book", "Resources & a few words", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Trusted & official", M, y0, terra);
    yl = bullets(p, ["Tourism Authority of Thailand — tourismthailand.org", "Immigration (visas) — immigration.go.th", "National parks — dnp.go.th", "Trains/buses/ferries — 12Go", "Tickets & tours — Klook / Kkday", "Rides & food — Grab / Bolt"], M, yl, colW, { accent: terra }) - 6;
    yl = encadre(p, M, yl, colW, "Insider tip", "Save the Tourist Police number — 1155, in English — before you go. It's the fastest help in any dispute or loss.");
    let yr = subhead(p, "A few words of Thai", x2, y0, blue);
    for (const [a, b] of [["Hello", "sawatdee (khrap/kha)"], ["Thank you", "khop khun"], ["How much?", "tao rai?"], ["Delicious!", "aroi!"], ["Not spicy", "mai phet"], ["Where is…?", "…yu thi nai?"], ["The bill", "check bin"], ["Good luck", "chok dee"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14 });
    yr -= 2; text(p, "Men end with 'khrap', women with 'kha'.", x2, yr, { size: 9, font: SI, color: sub });
    return Math.min(yl, yr);
  }, "Resources", "Bookmark the official sites before you fly — visa rules and park openings change, and the source of truth beats a forum thread.");
}
function appendices() {
  pageW("24", "Appendices", "Before-you-go checklists", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Before you go", M, y0, terra); let yy = yl;
    for (const it of ["Passport valid 6 months", "Check visa exemption (immigration.go.th)", "Insurance — motorbike cover if riding", "Vaccines current (clinic 6–8 wks ahead)", "Flights & first/last night booked", "Int'l Driving Permit (if driving)", "eSIM / SIM arranged", "Offline maps + document copies"]) { checkBoxLine(p, M, yy - 9, it, colW, terra); yy -= 22; }
    yy -= 6; let yl2 = subhead(p, "First-aid kit", M, yy, blue);
    for (const it of ["Rehydration salts", "Anti-diarrhoeals", "Antiseptic & plasters", "Repellent & after-bite", "Personal meds + prescription"]) { checkBoxLine(p, M, yl2 - 9, it, colW, blue); yl2 -= 22; }
    let yr = subhead(p, "Packing (tropical)", x2, y0, sage); let yry = yr;
    for (const it of ["Light, modest clothes for temples", "Swimwear + sarong", "Sandals + trainers", "Rain jacket / poncho", "Reef-safe sunscreen + hat", "DEET repellent", "Universal adapter + power bank", "Reusable water bottle"]) { checkBoxLine(p, x2, yry - 9, it, colW, sage); yry -= 22; }
    yry -= 6; let yr2 = subhead(p, "Documents to carry", x2, yry, ochre);
    for (const it of ["Passport + copies", "Visa / proof of onward travel", "Insurance details", "Licence + IDP", "A few passport photos"]) { checkBoxLine(p, x2, yr2 - 9, it, colW, ochre); yr2 -= 22; }
    return Math.min(yl2, yr2);
  }, "Appendices", "Print this page, or screenshot it to your phone — your pre-flight ritual in a single glance.");
}

function closing() {
  pageW("", "One last thing", "Go slowly, see deeply", sage, (p, y0) => {
    let y = para(p, "If there's one idea to carry into Thailand, it's this: resist the urge to see everything. The travellers who fall hardest for this country are the ones who slow down — who spend a third morning at the same coffee stall until the owner knows their order, who take the long road over the loop, who say yes to the invitation they didn't plan for.", M, y0, CW, { leading: 15.5 }) - 8;
    y = para(p, "Eat the thing you can't name. Learn the ten words. Give way to the smiles. Thailand will meet you more than halfway.", M, y, CW, { leading: 15.5 }) - 16;
    y = subhead(p, "A few good resources", M, y, terra);
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = bullets(p, ["Tourism Authority of Thailand — tourismthailand.org", "12Go — trains, buses & ferries", "Richard Barrow — long-running Thailand blog"], M, top, colW, { accent: terra });
    let yr = bullets(p, ["Grab / Bolt — rides & food", "Google Maps (offline) + Translate (Thai)", "Your travel insurer's 24-hour line"], x2, top, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Go Slowly", "Tear yourself away from the itinerary at least once. The afternoon you didn't plan is usually the one you'll remember.", (pp, cx, cy) => { boat(pp, cx - 6, cy - 12, 20, blue, 1); });
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

// ---- itinerary data ----
const northItin = ["10 days · The North", sage, "Mountains, temples and the legendary Mae Hong Son Loop, from a Chiang Mai base. Fly in and out of Chiang Mai. Best Nov–Feb.",
  [{ key: "cnx", name: "Chiang Mai", x: 0.62, y: 0.5, big: true, lx: 9 }, { key: "pai", name: "Pai", x: 0.4, y: 0.86, big: true }, { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.66, big: true, lx: -92 }, { key: "sariang", name: "Mae Sariang", x: 0.26, y: 0.16, lx: -74 }, { key: "inth", name: "Doi Inthanon", x: 0.66, y: 0.3, lx: 9 }],
  ["cnx", "pai", "mhs", "sariang", "inth", "cnx"],
  [["D1–2", "Chiang Mai", "Old-city temples, a cooking class, an ethical elephant visit and the night markets."], ["D3", "To Pai", "Ride the 762 curves north; waterfalls and coffee stops."], ["D4", "Pai", "Canyon at dawn, hot springs, white temple at sunset."], ["D5", "To Mae Hong Son", "Tham Lod cave and the bamboo bridge; a calm Shan town."], ["D6", "Mae Hong Son", "Ban Rak Thai tea village and misty viewpoints."], ["D7", "To Mae Sariang", "A quiet riverside town on the loop's western arm."], ["D8", "To Doi Inthanon", "Thailand's highest peak; twin pagodas and waterfalls."], ["D9–10", "Chiang Mai", "Massage, markets and a slow finish before flying out."]],
  "Add a 2-day side-trip to Chiang Rai's White & Blue Temples if you have time.", true];
const southItin = ["12 days · Islands & South", blue, "Karsts, rainforest and beaches down the Andaman coast, finishing island-slow. Fly into Phuket, out of Krabi. Best Nov–Apr.",
  [{ key: "phuket", name: "Phuket", x: 0.3, y: 0.92, big: true }, { key: "phang", name: "Phang Nga", x: 0.46, y: 0.8 }, { key: "khaosok", name: "Khao Sok", x: 0.62, y: 0.64, lx: 7 }, { key: "krabi", name: "Krabi", x: 0.55, y: 0.42, lx: 7 }, { key: "lanta", name: "Koh Lanta", x: 0.5, y: 0.18, big: true }],
  ["phuket", "phang", "khaosok", "krabi", "lanta"],
  [["D1–2", "Phuket", "Old-town shophouses and a first beach; ease into island time."], ["D3", "Phang Nga Bay", "Long-tail or kayak among the sea-stacks and lagoons."], ["D4–5", "Khao Sok", "Jungle lake by raft-house; dawn mist and gibbons."], ["D6–8", "Krabi, Ao Nang & Railay", "Climbers' karsts, beach-hopping and cliff-ringed Railay."], ["D9–11", "Koh Lanta", "Long, quiet beaches; sunsets and old-town seafood."], ["D12", "To Krabi & home", "A last swim before the flight out."]],
  "Swap Koh Lanta for Koh Phi Phi if you want more buzz, or Koh Yao Noi for more quiet.", false];
const bestItin = ["14 days · Best of Thailand", terra, "Bangkok, the cultural north and the southern islands, linked by two short flights. The classic first-timer's grand tour.",
  [{ key: "bkk", name: "Bangkok", x: 0.62, y: 0.42, big: true }, { key: "ayu", name: "Ayutthaya", x: 0.56, y: 0.56 }, { key: "cnx", name: "Chiang Mai", x: 0.42, y: 0.9, big: true }, { key: "krabi", name: "Krabi", x: 0.5, y: 0.12, big: true }],
  ["bkk", "ayu", "cnx", "krabi"],
  [["D1–3", "Bangkok", "Temples, river life, Chinatown food and a day-trip to Ayutthaya."], ["D4", "Fly to Chiang Mai", "Evening at the night bazaar."], ["D5–7", "Chiang Mai", "Temples, cooking class, ethical elephants and Doi Suthep."], ["D8–9", "Pai or the hills", "A taste of the mountains — slow and scenic."], ["D10", "Fly south to Krabi", "Swap mountains for the sea."], ["D11–13", "Krabi & islands", "Railay, Ao Nang and a day among the karsts."], ["D14", "Home", "One last Thai breakfast before the airport."]],
  "Short on time? This works at 10 days by trimming the north to three nights.", false];
const shortItin = ["7 days · First-timer's taste", ochre, "Can only spare a week? This loops Bangkok, the old capital and the cultural north for a perfect first bite of Thailand.",
  [{ key: "bkk", name: "Bangkok", x: 0.6, y: 0.4, big: true }, { key: "ayu", name: "Ayutthaya", x: 0.54, y: 0.56 }, { key: "cnx", name: "Chiang Mai", x: 0.42, y: 0.9, big: true }],
  ["bkk", "ayu", "cnx"],
  [["D1–2", "Bangkok", "Grand Palace, Wat Pho, a canal boat and Chinatown street food."], ["D3", "Ayutthaya day-trip", "Cycle the romantic ruins of the old capital."], ["D4", "Fly to Chiang Mai", "Sunset at the night bazaar."], ["D5–6", "Chiang Mai", "Old-city temples, a cooking class and an ethical elephant visit."], ["D7", "Doi Suthep & home", "Mountain temple, a last massage, then fly out."]],
  "Add 3–4 days and an island flight to turn this into a two-week trip.", false];

// ---- build ----
async function buildDoc([w, h]) {
  doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Thailand: The Complete Guide"); doc.setAuthor("The Slow Atlas");
  doc.setSubject("A complete illustrated travel guide to Thailand"); doc.setKeywords(["thailand", "travel guide", "ebook", "itinerary", "southeast asia"]);
  W = w; H = h; M = 50; CW = W - M * 2; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true }); SF = await doc.embedFont(fb.serif, { subset: true }); SB = await doc.embedFont(fb.serifB, { subset: true });
  SI = await doc.embedFont(fb.serifI, { subset: true }); SN = await doc.embedFont(fb.sans, { subset: true }); NB = await doc.embedFont(fb.sansB, { subset: true });

  cover(); intro();
  divider("I", "Part One", "Before you go", "Timing, paperwork, health and packing — sorted.", ["When to go & festivals", "Documents, health & money", "What to pack"], (p, cx, cy, c) => { mountains(p, cx - 150, cy - 24, 300, 64, c, 1); temple(p, cx, cy - 24, 52, c, 1); sun(p, cx + 110, cy + 26, 12, c, 1.1); palm(p, cx - 120, cy - 24, 38, c, 1); }, ochre);
  whenToGo(); documents(); packing();
  divider("II", "Part Two", "Budget", "What it really costs — and how to travel for less.", ["Daily budgets, low to lavish", "A sample two-week spend", "Prices to anchor on"], (p, cx, cy, c) => { lantern(p, cx - 70, cy - 6, 28, c, 1); lantern(p, cx, cy + 10, 34, c, 1); lantern(p, cx + 72, cy - 8, 26, c, 1); }, terra);
  budget();
  divider("III", "Part Three", "Destinations", "The unmissable places, region by region.", ["The lie of the land", "Bangkok · Chiang Mai · the South", "Which island is for you?", "Ayutthaya, Kanchanaburi & Isaan"], (p, cx, cy, c) => { mountains(p, cx - 160, cy - 24, 320, 72, c, 1); temple(p, cx - 80, cy - 24, 44, c, 1); palm(p, cx + 70, cy - 24, 40, c, 1); boat(p, cx + 30, cy - 30, 26, c, 1); }, blue);
  regionsMap();
  destination("06", "Bangkok", terra, "Thailand's electric capital is a city of contrasts: glittering temples beside neon malls, river life beside skytrains, and some of the best street food on earth. Give it two or three days — it grows on you fast.",
    ["Grand Palace & Wat Phra Kaew (Emerald Buddha)", "Wat Pho's reclining Buddha & a temple massage", "Wat Arun at sunset, from across the river", "A long-tail boat through the Thonburi canals", "Chatuchak weekend market — 15,000 stalls"],
    ["Dress modestly for temples (shoulders & knees).", "The river and canals are half the magic — ride them.", "It's hot and huge — plan around the midday heat.", "Base near the river (Old Town) or a BTS station."],
    ["Pad krapow & boat noodles from street stalls", "Chinatown (Yaowarat) after dark for seafood & sweets", "Mango sticky rice from a market cart", "A rooftop bar for the skyline (smart-casual)"],
    ["Two airports (BKK & DMK); the Airport Rail Link into town.", "BTS Skytrain + MRT metro are fast, cheap & cool.", "River boats & Grab to dodge the traffic.", "A great hub for trains & flights everywhere."],
    "Bangkok");
  destination("07", "Chiang Mai & the North", sage, "The laid-back cultural capital of the north — a moat-ringed old town of 300 temples, fringed by mountains, cooking schools and coffee. The gateway to Pai, Mae Hong Son and the great northern road trips.",
    ["Old-city temples — Wat Chedi Luang & Wat Phra Singh", "Doi Suthep temple, on the mountain above town", "An ethical elephant sanctuary (no riding)", "A cooking class & the Sunday Walking Street", "Pai & the Mae Hong Son Loop (see itineraries)"],
    ["Cool, especially Nov–Feb; pack a light layer.", "Avoid Mar–Apr burning season (smoky air).", "Rent a scooter to explore the valley.", "Yi Peng & Loy Krathong (Nov) fill the sky with lanterns."],
    ["Khao soi — the north's coconut-curry noodles", "Sai ua (herby sausage) & nam prik dips", "Khao niao (sticky rice) with everything", "Locally grown northern coffee"],
    ["A 1-hour flight or overnight sleeper train from Bangkok.", "Compact old town — walk or cycle it.", "Scooters & songthaews for the outskirts.", "The launchpad for the northern loop."],
    "Chiang Mai");
  destination("08", "The South & islands", ochre, "Postcard Thailand: limestone karsts rising from turquoise seas, rainforest national parks, and an island for every mood. Two coasts mean there's almost always somewhere dry.",
    ["Railay & Ao Nang (Krabi) — climbers' cliffs & beaches", "Phang Nga Bay by long-tail or kayak", "Khao Sok National Park — jungle lake & raft-houses", "Koh Lanta — long, mellow west-coast beaches", "Ko Tao — world-class, cheap diving"],
    ["Andaman coast: best Nov–Apr. Gulf: Feb–Apr & Jul–Aug.", "Ferries link the islands; book ahead in high season.", "Reef-safe sunscreen only — protect the coral.", "Quiet beaches reward those with a scooter."],
    ["Fresh seafood grilled by the beach", "Southern curries — rich, turmeric-gold, fiery", "Massaman — mild and fragrant", "Fruit shakes & fresh coconut"],
    ["Fly to Phuket, Krabi or Ko Samui, then ferry on.", "Long-tails & speedboats for island hops.", "Scooters rule on the islands themselves.", "See 'Which island?' to choose your base."],
    "The South");
  islandsTable();
  cultureHistory();
  destination("10", "Ayutthaya, Kanchanaburi & Isaan", blue, "Beyond the headline sights lies a quieter, history-rich Thailand — easy add-ons from Bangkok, or a route all their own.",
    ["Ayutthaya — the romantic ruins of the old capital", "Kanchanaburi — the River Kwai & Erawan Falls", "Khao Yai — waterfalls, gibbons & vineyards", "Phimai & Phanom Rung — Khmer temples older than Angkor", "The Mekong towns & surreal Sala Keoku"],
    ["Ayutthaya: rent a bike to ride between the temples.", "Kanchanaburi: an easy, lovely long weekend from Bangkok.", "Isaan: little English, the warmest welcomes, lowest prices.", "Trains & buses link it all; a car reaches the villages."],
    ["Som tam (green-papaya salad) — Isaan's icon", "Larb & gai yang with sticky rice", "Sai krok Isan — sour fermented sausage", "Mekong river fish, simply grilled"],
    ["Ayutthaya: 1–1.5 h by cheap local train from Bangkok.", "Kanchanaburi: 2–3 h by train or minivan.", "Isaan: sleeper trains & buses from Bangkok.", "Best explored slowly, with your own wheels."],
    "Beyond the Big Sights");
  divider("IV", "Part Four", "Ready-to-use itineraries", "Four trips, planned for you — adapt and go.", ["7 days · a first taste", "10 days · the North", "12 days · islands & south", "14 days · best of Thailand"], (p, cx, cy, c) => { mountains(p, cx - 150, cy - 24, 300, 64, c, 1); boat(p, cx, cy - 28, 34, c, 1); palm(p, cx - 120, cy - 24, 38, c, 1); palm(p, cx + 110, cy - 24, 34, c, 1); }, terra);
  itinerary("11", ...shortItin); itinerary("12", ...northItin); itinerary("13", ...southItin); itinerary("14", ...bestItin);
  divider("V", "Part Five", "Getting around", "How the country joins up, and how to drive it.", ["The transport network map", "Flights, trains, buses & boats", "Driving & where to rent a scooter"], (p, cx, cy, c) => { plane(p, cx - 90, cy + 10, 30, c, 1); train(p, cx + 10, cy - 10, 28, c, 1); bus(p, cx + 100, cy + 6, 22, c, 1); }, sage);
  transportMap(); transport(); driving();
  divider("VI", "Part Six", "Where to stay & what to eat", "From raft-houses to rooftop curries.", ["Accommodation & where to base", "How to eat in Thailand", "A region-by-region dish glossary"], (p, cx, cy, c) => { temple(p, cx - 70, cy - 20, 40, c, 1); bowl(p, cx + 70, cy - 8, 30, c, 1); palm(p, cx, cy - 20, 34, c, 1); }, ochre);
  accommodation(); eating(); dishesNorth(); dishesSouth(); shopping();
  divider("VII", "Part Seven", "Experiences & practical tips", "What to do — and how to do it well.", ["Things to do, by interest", "Culture & etiquette", "Safety, scams & responsible travel", "A Thai phrasebook"], (p, cx, cy, c) => { mountains(p, cx - 150, cy - 24, 300, 70, c, 1); lantern(p, cx, cy + 6, 30, c, 1); palm(p, cx - 110, cy - 24, 40, c, 1); }, blue);
  activities(); culture(); safety(); travellers(); phrasebook1(); phrasebook2(); resources(); appendices();
  closing(); back();
  return doc.save();
}
async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  for (const [name, size] of [["US-Letter", [612, 792]], ["A4", [595.28, 841.89]]]) {
    const bytes = await buildDoc(size); writeFileSync(join(ROOT, "dist", `Thailand-Road-Trip-Atlas-${name}.pdf`), bytes);
    console.log(`Thailand ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
