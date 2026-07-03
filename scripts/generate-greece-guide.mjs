/**
 * The Slow Atlas — Italy: The Complete Guide
 * Same engine & palette as the Thailand/Japan guides (a cohesive collection),
 * with Italy content and motifs (Tuscan hills, a duomo, cypress trees, a
 * Vespa, a Roman arch, a wine glass). Original vector illustrations only.
 * Generates US Letter + A4.  Run: npm run italy
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
function sun(p, cx, cy, r, c, ww = 1) { arc(p, cx, cy, r, r, 0, 2 * Math.PI, { color: c, w: ww, seg: 30 }); }
function hills(p, x, baseY, w, h, c, ww = 1) { polyl(p, [[0, 0], [0.2, 0.55], [0.4, 0.2], [0.6, 0.5], [0.8, 0.15], [1, 0.4]].map(([fx, fy]) => ({ x: x + fx * w, y: baseY + fy * h })), c, ww); }
function duomo(p, cx, baseY, s, c, ww = 1) {
  polyl(p, [{ x: cx - 0.5 * s, y: baseY }, { x: cx - 0.5 * s, y: baseY + 0.7 * s }, { x: cx + 0.5 * s, y: baseY + 0.7 * s }, { x: cx + 0.5 * s, y: baseY }], c, ww); // body
  hline(p, cx - 0.55 * s, cx + 0.55 * s, baseY, { thickness: ww, color: c });
  polyl(p, [{ x: cx - 0.3 * s, y: baseY + 0.7 * s }, { x: cx - 0.3 * s, y: baseY + 0.9 * s }, { x: cx + 0.3 * s, y: baseY + 0.9 * s }, { x: cx + 0.3 * s, y: baseY + 0.7 * s }], c, ww); // drum
  arc(p, cx, baseY + 0.9 * s, 0.32 * s, 0.44 * s, 0, Math.PI, { color: c, w: ww, seg: 22 }); // dome
  seg(p, cx, baseY + 1.34 * s, cx, baseY + 1.5 * s, c, ww); sun(p, cx, baseY + 1.54 * s, 0.05 * s, c, ww); // lantern
  arc(p, cx, baseY, 0.12 * s, 0.28 * s, 0, Math.PI, { color: c, w: ww, seg: 12 }); // door
}
function cypress(p, x, baseY, s, c, ww = 1) { seg(p, x, baseY, x, baseY + 0.22 * s, c, ww); polyl(p, [{ x, y: baseY + 0.22 * s }, { x: x - 0.16 * s, y: baseY + 0.7 * s }, { x: x - 0.09 * s, y: baseY + 1.2 * s }, { x, y: baseY + 1.55 * s }, { x: x + 0.09 * s, y: baseY + 1.2 * s }, { x: x + 0.16 * s, y: baseY + 0.7 * s }], c, ww, true); }
function arch(p, cx, baseY, s, c, ww = 1) { seg(p, cx - 0.4 * s, baseY, cx - 0.4 * s, baseY + 0.6 * s, c, ww); seg(p, cx + 0.4 * s, baseY, cx + 0.4 * s, baseY + 0.6 * s, c, ww); seg(p, cx - 0.4 * s, baseY, cx - 0.28 * s, baseY, c, ww); seg(p, cx + 0.28 * s, baseY, cx + 0.4 * s, baseY, c, ww); arc(p, cx, baseY + 0.6 * s, 0.4 * s, 0.42 * s, 0, Math.PI, { color: c, w: ww, seg: 20 }); arc(p, cx, baseY + 0.6 * s, 0.28 * s, 0.28 * s, 0, Math.PI, { color: c, w: ww, seg: 16 }); }
function wineglass(p, cx, baseY, s, c, ww = 1) { hline(p, cx - 0.22 * s, cx + 0.22 * s, baseY, { thickness: ww, color: c }); seg(p, cx, baseY, cx, baseY + 0.42 * s, c, ww); arc(p, cx, baseY + 0.72 * s, 0.26 * s, 0.3 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 18 }); hline(p, cx - 0.26 * s, cx + 0.26 * s, baseY + 0.72 * s, { thickness: ww, color: c }); }
function scooter(p, cx, cy, s, c, ww = 1) { arc(p, cx - 0.55 * s, cy, 0.25 * s, 0.25 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 16 }); arc(p, cx + 0.55 * s, cy, 0.25 * s, 0.25 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 16 }); polyl(p, [{ x: cx - 0.55 * s, y: cy + 0.05 * s }, { x: cx + 0.2 * s, y: cy + 0.05 * s }, { x: cx + 0.55 * s, y: cy }], c, ww); polyl(p, [{ x: cx - 0.3 * s, y: cy + 0.05 * s }, { x: cx - 0.15 * s, y: cy + 0.55 * s }, { x: cx + 0.35 * s, y: cy + 0.55 * s }], c, ww); seg(p, cx + 0.55 * s, cy + 0.25 * s, cx + 0.78 * s, cy + 0.7 * s, c, ww); seg(p, cx + 0.66 * s, cy + 0.7 * s, cx + 0.9 * s, cy + 0.7 * s, c, ww); }
function boat(p, cx, y, s, c, ww = 1) { arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 22 }); seg(p, cx - s, y + 0.5 * s, cx - 1.2 * s, y + 0.82 * s, c, ww); seg(p, cx + s, y + 0.5 * s, cx + 1.2 * s, y + 0.82 * s, c, ww); hline(p, cx - s, cx + s, y + 0.5 * s, { thickness: ww, color: c }); }
function bowl(p, cx, y, s, c, ww = 1) { arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 20 }); hline(p, cx - s * 1.06, cx + s * 1.06, y + 0.5 * s, { thickness: ww, color: c }); for (const dx of [-0.35, 0, 0.35]) arc(p, cx + dx * s, y + 0.9 * s, 0.12 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2, { color: c, w: ww, seg: 8 }); seg(p, cx + 0.5 * s, y + s, cx + 1.2 * s, y + 1.5 * s, c, ww); seg(p, cx + 0.62 * s, y + 0.96 * s, cx + 1.3 * s, y + 1.42 * s, c, ww); }
function plane(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - s, y: cy }, { x: cx + 0.7 * s, y: cy }, { x: cx + s, y: cy + 0.12 * s }, { x: cx + 0.7 * s, y: cy + 0.24 * s }, { x: cx - s, y: cy + 0.24 * s }], c, ww, true); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy + 0.6 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy - 0.36 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); }
function train(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - 0.9 * s, y: cy }, { x: cx - 0.9 * s, y: cy + 0.7 * s }, { x: cx + 0.5 * s, y: cy + 0.7 * s }, { x: cx + 0.9 * s, y: cy + 0.4 * s }, { x: cx + 0.9 * s, y: cy }], c, ww, true); hline(p, cx - 0.9 * s, cx + 0.5 * s, cy + 0.42 * s, { thickness: ww, color: c }); for (const dx of [-0.6, 0, 0.55]) arc(p, cx + dx * s, cy, 0.14 * s, 0.14 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }
function bus(p, cx, cy, s, c, ww = 1) { const x0 = cx - 0.9 * s, x1 = cx + 0.9 * s, y0 = cy + 0.1 * s, y1 = cy + 0.8 * s; polyl(p, [{ x: x0, y: y0 }, { x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y0 }], c, ww, true); hline(p, x0, x1, y0 + 0.42 * s, { thickness: ww, color: c }); for (let i = 0; i < 4; i++) seg(p, x0 + (0.18 + i * 0.42) * s, y0 + 0.44 * s, x0 + (0.18 + i * 0.42) * s, y1 - 0.04 * s, c, ww); arc(p, cx - 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); arc(p, cx + 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }

function sceneBand(p, yBase, { c = hair } = {}) { hline(p, M, W - M, yBase, { thickness: 0.8, color: c }); hills(p, M, yBase, CW * 0.5, 40, c, 0.9); sun(p, M + CW * 0.44, yBase + 36, 9, terra, 0.9); duomo(p, M + CW * 0.6, yBase, 26, c, 0.9); cypress(p, M + CW * 0.78, yBase, 26, sage, 0.9); cypress(p, M + CW * 0.84, yBase, 22, sage, 0.9); scooter(p, M + CW * 0.2, yBase + 8, 16, terra, 0.9); }
function motif(p, x, w, cy, accent = terra) { hills(p, x + 10, cy, w - 20, 40, hair, 1); duomo(p, x + w * 0.5, cy, 26, hair, 1); cypress(p, x + w * 0.74, cy, 26, sage, 1); cypress(p, x + w * 0.8, cy, 20, sage, 1); scooter(p, x + w * 0.18, cy + 10, 16, accent, 1); }

// ---------- furniture ----------
const newPage = () => { const p = doc.addPage([W, H]); paperBg(p); return p; };
function header(p, num, tag, title, accent = terra) {
  if (num) text(p, num, W - M - D.widthOfTextAtSize(num, 58), H - M - 52, { size: 58, font: D, color: accent, opacity: 0.15 });
  tracked(p, tag.toUpperCase(), M, H - M - 13, { size: 8.5, font: NB, color: accent, tracking: 2.2 });
  text(p, title, M, H - M - 44, { size: 25, font: D, color: ink });
  hline(p, M, W - M, H - M - 58, { thickness: 0.8 });
}
function footer(p, label) { hline(p, M, W - M, 44, { thickness: 0.6 }); tracked(p, "THE SLOW ATLAS", M, 31, { size: 7.5, font: NB, color: sub, tracking: 2 }); const r = label.toUpperCase(), rw = trackedW(r, { size: 7.5, font: NB, tracking: 2 }); tracked(p, r, W - M - rw, 31, { size: 7.5, font: NB, color: sub, tracking: 2 }); center(p, `— ${String(PAGE).padStart(2, "0")} —`, 31, { size: 8, font: SN, color: sub }); PAGE++; }
function callout(p, x, y, w, h, title, body, accent, art) {
  p.drawRectangle({ x, y: y - h, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  p.drawRectangle({ x, y: y - h, width: 3, height: h, color: accent });
  tracked(p, title.toUpperCase(), x + 14, y - 18, { size: 8, font: NB, color: accent, tracking: 1.6 });
  para(p, body, x + 14, y - 34, w - 28 - (art ? 70 : 0), { size: 9.5, font: SI, color: ink, leading: 13 });
  if (art) art(p, x + w - 38, y - h / 2 - 6);
}
function fillRest(p, endY, tip, accent = terra, art) {
  const top = endY - 6, bottom = 62, gap = top - bottom; if (gap < 64) return;
  const defArt = art || ((pp, cx, cy) => { cypress(pp, cx - 6, cy - 22, 22, sage, 1); scooter(pp, cx + 26, cy - 12, 16, terra, 1); });
  if (gap <= 190) { callout(p, M, top, CW, gap, "Local tip", tip, accent, defArt); return; }
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
  for (const r of routes) { const pts = r.keys.map((k) => nodes.find((n) => n.key === k)).filter(Boolean); for (let i = 0; i < pts.length - 1; i++) p.drawLine({ start: { x: px(pts[i].x), y: py(pts[i].y) }, end: { x: px(pts[i + 1].x), y: py(pts[i + 1].y) }, thickness: 1.6, color: r.color, ...(r.dash ? { dashArray: r.dash } : {}) }); if (r.loop && pts.length > 1) p.drawLine({ start: { x: px(pts.at(-1).x), y: py(pts.at(-1).y) }, end: { x: px(pts[0].x), y: py(pts[0].y) }, thickness: 1.6, color: r.color }); }
  for (const n of nodes) { p.drawCircle({ x: px(n.x), y: py(n.y), size: n.big ? 4 : 2.6, color: n.c || (n.big ? terra : ink) }); text(p, n.name, px(n.x) + (n.lx ?? 7), py(n.y) + (n.ly ?? -3), { size: n.big ? 9 : 8, font: n.big ? NB : SN, color: ink }); }
}
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
const colRule = (p, y0, yl, yr) => p.drawLine({ start: { x: M + CW / 2, y: y0 + 6 }, end: { x: M + CW / 2, y: Math.min(yl, yr) + 4 }, thickness: 0.6, color: hair });

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
  let y = 250; trackedCenter(p, "IN THIS PART", y, { size: 8.5, font: NB, color: cream, tracking: 3 }); y -= 26;
  for (const it of items) { center(p, it, y, { size: 12, font: SF, color: cream }); y -= 22; }
  trackedCenter(p, "THE SLOW ATLAS", 64, { size: 8, font: NB, color: cream, tracking: 3 });
}
function destination(num, name, accent, lead, mustSee, practical, eat, getThere, label, tip) {
  pageW(num, "Destinations", name, accent, (p, y0) => {
    let y = para(p, lead, M, y0, CW, { leading: 14.5 }) - 10;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Don't miss", M, top, accent); yl = bullets(p, mustSee, M, yl, colW, { accent });
    let yr = subhead(p, "Good to know", x2, top, sage); yr = bullets(p, practical, x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 12, top2 = yy;
    let zl = subhead(p, "Eat & drink", M, top2, terra); zl = bullets(p, eat, M, zl, colW, { accent: terra, size: 9.6 });
    let zr = subhead(p, "Getting there & around", x2, top2, blue); zr = bullets(p, getThere, x2, zr, colW, { accent: blue, size: 9.6 });
    return Math.min(zl, zr);
  }, label || name, tip);
}
function itinerary(num, title, accent, intro, nodes, keys, days, tip) {
  const p = newPage(); header(p, num, "Ready-to-use itineraries", title, accent);
  let y = para(p, intro, M, H - M - 88, CW * 0.56, { leading: 14 });
  drawMap(p, M + CW * 0.6, 150, CW * 0.4, H - M - 120 - 150, nodes, [{ color: accent, keys }]);
  text(p, "Schematic — not to scale", M + CW * 0.6, 132, { size: 7.5, font: SI, color: sub });
  y -= 8;
  for (const [d, t, body] of days) { text(p, d, M, y, { size: 9.5, font: NB, color: accent }); text(p, t, M + 52, y, { size: 11, font: SB, color: ink }); y = para(p, body, M, y - 14, CW * 0.56, { size: 9.3, leading: 12.5 }) - 7; }
  if (tip) { const tw = CW * 0.56, lines = measureLines(tip, tw - 28), ch = 26 + lines * 13, ctop = y - 4; callout(p, M, ctop, tw, ch, "Make it yours", tip, accent); const gapTop = ctop - ch - 8; if (gapTop - 78 > 90) motif(p, M, tw, (gapTop + 78) / 2 - 18, accent); }
  footer(p, title);
}

// ============================ CONTENT ============================
function cover() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  trackedCenter(p, "THE SLOW ATLAS", H - 128, { size: 9, font: NB, color: terra, tracking: 5 });
  center(p, "Italy", H - 236, { size: 84, font: D, color: ink });
  center(p, "The Complete Guide", H - 278, { size: 34, font: D, color: terra });
  hline(p, W / 2 - 72, W / 2 + 72, H - 302, { thickness: 0.8, color: ink });
  center(p, "Where to go, what to eat, and how to travel it slowly.", H - 328, { size: 13, font: SI, color: sub });
  const yB = 196; hills(p, M + 30, yB, CW - 60, 66, hair, 1); sun(p, W / 2 + 130, yB + 78, 15, terra, 1.1); duomo(p, W / 2, yB, 56, ink, 1); cypress(p, M + 96, yB, 60, sage, 1); cypress(p, W - M - 96, yB, 54, sage, 1); scooter(p, M + 150, yB + 12, 30, terra, 1); wineglass(p, W - M - 150, yB, 34, ochre, 1);
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME III", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}
function intro() {
  pageW("", "Welcome", "Benvenuti — welcome", terra, (p, y0) => {
    let y = para(p, "There is nowhere quite like Italy. In one trip you can stand in a two-thousand-year-old arena, eat the best plate of pasta of your life at a paper-clothed trattoria, drift down a canal at dusk, and watch the sun set over cypress-lined Tuscan hills. It is art, food and la dolce vita — and endlessly, gloriously walkable.", M, y0, CW, { leading: 15.5 }) - 6;
    y = para(p, "This guide is built to help you travel slowly and well: to understand the country, plan with confidence, and leave room for the long lunches and aimless piazzas that become the best memories — from your first train question to your last scoop of gelato.", M, y, CW, { leading: 15.5 }) - 14;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "What's inside", M, top);
    yl = bullets(p, ["Before you go — timing, paperwork & packing", "Budget — what it really costs, with sample spends", "Destinations — Rome, Florence, Venice & beyond", "Four ready-to-use itineraries, 7 to 14 days", "Getting around — trains, driving & the ZTL trap", "Where to stay, what to eat, what to do", "Culture, etiquette, coffee rules & a phrasebook"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "How to travel it slowly", x2, top, sage);
    yr = bullets(p, ["Do two or three cities, not ten — Italy rewards it.", "Take the long lunch; let the afternoon disappear.", "Eat regionally; the dish changes every 50 km.", "Learn ten words; 'buongiorno' opens every door.", "Wander the backstreets, away from the main sights.", "Master the coffee rules and you'll pass for a local."], x2, yr, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Welcome", "Carry small change, an appetite and an empty afternoon — the piazza at aperitivo hour fills the last one better than any plan.", (pp, cx, cy) => { wineglass(pp, cx, cy - 22, 20, terra, 1); });
}

function whenToGo() {
  pageW("01", "Before you go", "When to go", ochre, (p, y0) => {
    let y = para(p, "Italy is a year-round joy, but two shoulder seasons are the sweet spot — warm, luminous and (a little) less crowded.", M, y0, CW, { leading: 14 }) - 6;
    for (const [n, w, a, d] of [["Spring", "Apr – Jun", sage, "Mild, green, blossoming; ideal for cities and the countryside. Easter and June get busy."], ["Autumn", "Sep – Oct", ochre, "Harvest light, warm sea, truffles & wine. Arguably the finest season of all."], ["Summer", "Jul – Aug", terra, "Hot and packed; August (Ferragosto) sees cities empty and many shops shut. Head for the coast or the Alps."], ["Winter", "Nov – Mar", blue, "Quiet, atmospheric and cheaper; Christmas markets, opera season, and skiing in the Dolomites."]]) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 14, y, { size: 12.5, font: SB, color: ink }); tracked(p, w.toUpperCase(), M + 14, y - 15, { size: 8, font: NB, color: a, tracking: 1.3 }); para(p, d, M + 150, y + 1, CW - 150, { size: 9.3, leading: 12.5 }); y -= 42; }
    y -= 4; y = subhead(p, "A month-by-month almanac", M, y, terra);
    const half = CW / 2 - 10, cols = [{ h: "Month", w: half * 0.22 }, { h: "Weather", w: half * 0.42 }, { h: "Don't miss", w: half * 0.36 }];
    const te = table(p, M, y, cols, [["Jan", "Cold, quiet", "Sales; ski the Alps"], ["Feb", "Cold, crisp", "Venice Carnival"], ["Mar", "Warming", "Fewer crowds"], ["Apr", "Mild, lovely", "Easter; spring bloom"], ["May", "Warm, ideal", "Perfect cities"], ["Jun", "Warm, busy", "Long light evenings"]], { rowH: 18, fontSize: 9 });
    table(p, M + CW / 2 + 10, y, cols.map((c) => ({ ...c })), [["Jul", "Hot, crowded", "Coast & lakes"], ["Aug", "Hottest; closures", "Ferragosto (15th)"], ["Sep", "Warm, superb", "Harvest, warm sea"], ["Oct", "Mild, golden", "Truffles & wine"], ["Nov", "Cool, wet", "Quiet, cheap"], ["Dec", "Cold, festive", "Markets, opera"]], { rowH: 18, fontSize: 9 });
    return te;
  }, "When to Go", "Avoid mid-August if you can: many city restaurants and shops close for Ferragosto, while the coast is at its priciest and most crowded.");
}
function documents() {
  pageW("02", "Before you go", "Documents, health & money", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Entry & visas", M, yl);
    yl = bullets(p, ["EU citizens: just an ID card. Many others (UK, US, Australia, Canada…) enter visa-free for up to 90 days in any 180 (Schengen) — confirm your rule.", "Passport valid 3+ months beyond departure (non-EU).", "The EU's ETIAS travel authorisation is expected soon — check before you fly.", "No mandatory vaccines; carry your EHIC/GHIC (EU/UK) or insurance."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Health & safety net", M, yl, sage);
    yl = bullets(p, ["Excellent healthcare; pharmacies (farmacia, green cross) are everywhere and helpful.", "Tap water is safe; refill at street fountains (nasoni in Rome).", "Take travel insurance for delays, theft & non-EU medical cover.", "Summer heat is intense — hydrate and pace the midday."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Money", x2, yr, blue);
    yr = bullets(p, ["Currency: the euro (€) — ≈ £0.85 / $1.08 per € (indicative).", "Cards are widely accepted; carry some cash for small bars, markets & rural spots.", "A 'coperto' (cover charge) and sometimes 'servizio' appear on the bill — normal.", "Tipping isn't expected; rounding up or a euro or two is a kind gesture."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Connectivity", x2, yr, ochre);
    yr = bullets(p, ["EU roaming is free for EU SIMs; others: an eSIM or local SIM (TIM, Vodafone, WindTre).", "Coverage is good; free Wi-Fi in many cafés & piazzas.", "Google Maps handles trains, buses & walking beautifully."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Documents", "Prices and opening hours shift with the season, and big sights change their booking rules — always re-check the official site a few days before you go.");
}
function packing() {
  pageW("03", "Before you go", "What to pack", sage, (p, y0) => {
    let y = para(p, "You'll walk on cobbles for miles and dress a notch smarter than you might elsewhere — Italians prize 'la bella figura'. Pack light, comfortable and put-together.", M, y0, CW, { leading: 14 }) - 8;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Clothing", M, top, terra); yl = bullets(p, ["Comfortable but smart walking shoes (cobbles!)", "One neat outfit for dinner & the opera", "Shoulders & knees covered for churches (a scarf helps)", "Layers for changeable spring/autumn", "Sun hat, sunglasses & swimwear in season", "A light rain jacket / compact umbrella"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Essentials", x2, top, sage); yr = bullets(p, ["Refillable water bottle (free street fountains)", "Power adapter (Type C/F/L, 230V) + power bank", "A day bag that zips (pickpocket-proof)", "Any prescriptions in original packaging", "A foldable tote for market finds", "Sunscreen & a small first-aid kit"], x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 12;
    yy = subhead(p, "Smart to have", M, yy, blue);
    yy = bullets(p, ["Pre-booked tickets (Colosseum, Vatican, Uffizi, Last Supper) saved offline", "A little cash for coperto & small bars", "Offline maps & a translation app", "A scarf or shawl — for churches, sun and evening cool"], M, yy, CW, { accent: blue });
    return yy;
  }, "Packing", "Pack one outfit smarter than you think you need. Italians dress well even for a coffee, and you'll feel more at home for matching them.", (pp, cx, cy) => { wineglass(pp, cx, cy - 20, 18, sage, 1); });
}
function budget() {
  pageW("04", "Budget", "What Italy costs", terra, (p, y0) => {
    let y = para(p, "Italy spans every budget — a €1 espresso at the bar, a €4 slice of pizza al taglio, or a Michelin tasting menu. Here's what to expect per person, per day, on the ground.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Style", w: CW * 0.18 }, { h: "Per day", w: CW * 0.2 }, { h: "What it looks like", w: CW * 0.62 }], [["Budget", "€60–100", "Hostels/B&Bs, market & street food, trains, walking"], ["Comfort", "€150–260", "3–4★ hotels & agriturismi, trattorie, some high-speed trains"], ["Luxury", "€400+", "Design hotels & masserie, fine dining, drivers, private guides"]], { rowH: 26, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Sample 10-day comfort budget", M, top, sage);
    let yl2 = table(p, M, yl, [{ h: "Item", w: colW * 0.62 }, { h: "≈ €", w: colW * 0.38 }], [["Accommodation (9 nights)", "1,150"], ["Food & drink", "650"], ["Trains & transport", "350"], ["Sights, tours & entries", "350"], ["Extras & buffer", "300"]], { rowH: 18, fontSize: 9, headerColor: sage });
    text(p, "≈ €2,800  ·  about £2,380 / $3,020 for two weeks scale up", M, yl2 - 4, { size: 9.5, font: SB, color: terra });
    let yr = subhead(p, "Prices to anchor on", x2, top, blue);
    yr = bullets(p, ["Espresso at the bar: €1.00–1.50", "Cappuccino: €1.50–2.00", "Pizza / pasta main: €8–14", "Glass of house wine: €4–6", "Aperitivo (spritz + snacks): €8–12", "Gelato: €2.50–4", "Museum entry: €12–25", "Rome–Florence fast train: €30–50", "City B&B double: €90–150", "Taxi from airport: €40–55"], x2, yr, colW, { accent: blue, gap: 2 });
    colRule(p, top, yl2 - 18, yr); return Math.min(yl2 - 18, yr);
  }, "Budget", "Drink your coffee standing at the bar (al banco) — it's often half the price of sitting, and it's how Italians do it.");
}
function regionsMap() {
  pageW("05", "Destinations", "The lie of the land", blue, (p, y0) => {
    let y = para(p, "Italy runs the length of a peninsula, from Alpine north to sun-baked south. Don't sweep it all — pick a region or two and go deep.", M, y0, CW * 0.5, { leading: 14 }) - 8;
    for (const [n, a, d] of [["The North", terra, "Milan's style, Venice's canals, the Lakes & the Dolomites; risotto & Prosecco."], ["The Centre", blue, "Rome's ruins, Florence's art, Tuscany & Umbria's hill towns and wine."], ["The South", sage, "Naples, the Amalfi Coast, Pompeii, Puglia — sun, sea and the best pizza."], ["The islands", ochre, "Sicily and Sardinia: ancient temples, volcanoes and turquoise coves."]]) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 12, y, { size: 12, font: SB, color: ink }); y = para(p, d, M + 12, y - 14, CW * 0.5 - 12, { size: 9.3, leading: 12.5 }) - 9; }
    encadre(p, M, y - 2, CW * 0.5, "Insider tip", "Each region has its own colour on the map opposite — and its own kitchen. First visit? Ride the classic triangle: Rome, Florence, Venice, and add one region.");
    const nodes = [
      { key: "mil", name: "Milan", x: 0.36, y: 0.9, big: true, c: terra }, { key: "com", name: "Lake Como", x: 0.38, y: 0.98, lx: 6 }, { key: "ven", name: "Venice", x: 0.6, y: 0.86, big: true, c: terra }, { key: "dol", name: "Dolomites", x: 0.56, y: 0.98, lx: 6, c: terra },
      { key: "cin", name: "Cinque Terre", x: 0.3, y: 0.72, lx: -84, c: blue }, { key: "flo", name: "Florence", x: 0.46, y: 0.68, big: true, c: blue }, { key: "sie", name: "Siena", x: 0.44, y: 0.6, lx: -40, c: blue }, { key: "rom", name: "Rome", x: 0.5, y: 0.5, big: true, c: blue },
      { key: "nap", name: "Naples", x: 0.58, y: 0.4, big: true, c: sage }, { key: "ama", name: "Amalfi", x: 0.62, y: 0.34, c: sage }, { key: "pug", name: "Puglia", x: 0.78, y: 0.3, lx: 6, c: sage },
      { key: "sic", name: "Sicily", x: 0.6, y: 0.1, c: ochre }, { key: "sar", name: "Sardinia", x: 0.28, y: 0.3, lx: -54, c: ochre },
    ];
    const routes = [
      { color: terra, keys: ["mil", "ven"] },
      { color: blue, keys: ["flo", "sie", "rom"] },
      { color: sage, keys: ["nap", "ama", "pug"] },
    ];
    drawMap(p, M + CW * 0.56, 100, CW * 0.42, H - M - 106 - 100, nodes, routes);
    text(p, "Schematic — not to scale", M + CW * 0.56, 84, { size: 7.5, font: SI, color: sub });
    return 0;
  }, "Regions");
}
function regionsCompare() {
  pageW("09", "Destinations", "Which base for you?", ochre, (p, y0) => {
    let y = para(p, "You can't see it all — and you shouldn't try. Here's how the great bases compare, so you can match the trip to your mood.", M, y0, CW, { leading: 14 }) - 8;
    const cols = [{ h: "Base", w: CW * 0.18 }, { h: "Vibe", w: CW * 0.4 }, { h: "Best for", w: CW * 0.42 }];
    y = table(p, M, y, cols, [
      ["Rome", "Ancient, grand, chaotic, eternal", "First-timers, history, big sights"],
      ["Florence", "Renaissance art, walkable, refined", "Art, Tuscany day trips, couples"],
      ["Venice", "Dreamlike, unique, no cars", "Romance, a slow day or two"],
      ["Tuscany", "Vineyards, hill towns, cypress roads", "Slow drives, wine, countryside"],
      ["Amalfi/Naples", "Sun, sea, drama & the best pizza", "Coast, boats, southern soul"],
      ["Puglia/Sicily", "Whitewashed towns, temples, beaches", "Off-peak sun, food, road trips"],
    ], { rowH: 24, fontSize: 9.2 }) - 8;
    return encadre(p, M, y, CW, "Did you know?", "Rome, Florence and Venice sit on one high-speed line: Rome–Florence is 1h30, Florence–Venice about 2h. You can base in each for a few nights and never touch a car.");
  }, "Which Base", "Can't choose? The classic Rome–Florence–Venice triangle covers most first trips beautifully — three cities, one fast train line, no car needed.");
}
function cultureHistory() {
  pageW("11", "Culture & heritage", "A short history & the arts", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "A timeline, in brief", M, y0, terra);
    for (const [a, b] of [["Ancient Rome", "from a village to an empire that shaped law, roads & language."], ["The Middle Ages", "city-states, maritime republics & soaring cathedrals."], ["The Renaissance, 15th c.", "Florence reinvents art — Michelangelo, Leonardo, Botticelli."], ["Baroque & Grand Tour", "Rome dazzles; Europe's elite come to marvel."], ["Unification, 1861", "a patchwork of kingdoms becomes one Italy — young, proud, regional."]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 3;
    yl -= 4; yl = encadre(p, M, yl, colW, "Did you know?", "'Italian' cuisine barely exists — it's a hundred regional kitchens. Order the local speciality, and never expect the same dish twice across the country.");
    let yr = subhead(p, "Heritage to seek out", x2, y0, sage);
    yr = bullets(p, ["Rome: the Colosseum, Forum, Pantheon & Vatican.", "Florence: the Duomo, Uffizi & Michelangelo's David.", "Venice: St Mark's, the Doge's Palace, the canals.", "Pompeii & Herculaneum, frozen by Vesuvius.", "Sicily's Greek temples; Puglia's trulli."], x2, yr, colW, { accent: sage }) - 6;
    yr = subhead(p, "The living arts", x2, yr, blue);
    yr = bullets(p, ["Opera (La Scala, Verona's arena), design & fashion (Milan).", "Cinema — from Fellini to modern auteurs.", "Craft: Murano glass, leather, ceramics, tailoring.", "Wine, olive oil & the art of the table."], x2, yr, colW, { accent: blue });
    return Math.min(yl, yr);
  }, "Culture & History", "Book the headline museums (Uffizi, Vatican, Borghese, the Last Supper) online weeks ahead — the queues without a timed ticket can swallow half a day.");
}

// ---- Getting around (rail + driving/ZTL) ----
function railMap() {
  pageW("13", "Getting around", "The rail network", blue, (p, y0) => {
    let y = para(p, "Italy's high-speed trains (Frecciarossa & Italo) glide between the big cities at up to 300 km/h — often faster and calmer than flying. Regional trains reach the rest. This map shows the main spine.", M, y0, CW * 0.56, { leading: 14 }) - 6;
    const bx = M, by = 88, bw = CW * 0.56, bh = y - 88 - 8;
    const N = { mil: [0.4, 0.94], ven: [0.7, 0.9], tur: [0.2, 0.86], bol: [0.5, 0.74], flo: [0.46, 0.6], rom: [0.5, 0.42], nap: [0.6, 0.28], bar: [0.82, 0.24] };
    const px = (k) => bx + N[k][0] * bw, py = (k) => by + N[k][1] * bh;
    const edge = (a, b, color, dash) => p.drawLine({ start: { x: px(a), y: py(a) }, end: { x: px(b), y: py(b) }, thickness: 1.4, color, ...(dash ? { dashArray: dash } : {}) });
    for (const [a, b] of [["tur", "mil"], ["mil", "bol"], ["bol", "flo"], ["flo", "rom"], ["rom", "nap"]]) edge(a, b, terra);
    for (const [a, b] of [["mil", "ven"], ["bol", "ven"]]) edge(a, b, terra);
    for (const [a, b] of [["nap", "bar"]]) edge(a, b, blue, [4, 3]);
    const names = { mil: "Milan", ven: "Venice", tur: "Turin", bol: "Bologna", flo: "Florence", rom: "Rome", nap: "Naples", bar: "Bari" };
    for (const k of Object.keys(N)) { const big = k === "rom"; p.drawCircle({ x: px(k), y: py(k), size: big ? 4.5 : 3, color: big ? terra : ink }); text(p, names[k], px(k) + 7, py(k) - 3, { size: big ? 9 : 8, font: big ? NB : SN, color: ink }); }
    const x2 = M + CW * 0.6, colW = CW * 0.4;
    let yr = subhead(p, "Legend", x2, y0 - 4, terra);
    for (const [c, dash, lab] of [[terra, null, "High-speed (Frecciarossa / Italo)"], [blue, [4, 3], "Intercity & regional"], [sage, [1.4, 3], "Local trains & buses (everywhere)"]]) { p.drawLine({ start: { x: x2, y: yr + 3 }, end: { x: x2 + 22, y: yr + 3 }, thickness: 1.4, color: c, ...(dash ? { dashArray: dash } : {}) }); text(p, lab, x2 + 30, yr, { size: 8.6, font: SF, color: sub }); yr -= 16; }
    yr -= 6; yr = subhead(p, "Rules of thumb", x2, yr, blue);
    yr = bullets(p, ["Rome–Florence 1h30; Florence–Venice ~2h; Rome–Naples ~1h10.", "Two operators compete (Trenitalia & Italo) — compare fares.", "Book high-speed ahead for cheaper fixed fares.", "Validate paper regional tickets before boarding (green machines).", "Trains beat flying city-to-city once you count airports."], x2, yr, colW, { accent: blue });
    return 0;
  }, "Rail Map");
}
function transportModes() {
  pageW("14", "Getting around", "Getting around", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = y0;
    for (const [ic, c, t, d] of [[train, terra, "Trains", "The best way between cities — Frecciarossa & Italo high-speed, plus a dense regional network. Book ahead for fixed fares; validate paper tickets."], [scooter, blue, "Scooter & Vespa", "Iconic and fun on the coast and islands — but chaotic in big cities. Helmet on, confidence required."]]) { ic(p, M + 14, yl - 6, 18, c, 1.1); text(p, t, M + 44, yl, { size: 12.5, font: SB, color: ink }); yl = para(p, d, M, yl - 18, colW, { size: 9.4, leading: 12.8 }) - 12; }
    let yr = y0;
    for (const [ic, c, t, d] of [[bus, sage, "Buses & metros", "City metros (Rome, Milan, Naples) plus trams & buses; regional buses reach hill towns the train misses."], [boat, blue, "Ferries & boats", "Essential for the islands, the Amalfi Coast and the lakes — and half the romance."]]) { ic(p, x2 + 14, yr - 6, 18, c, 1.1); text(p, t, x2 + 44, yr, { size: 12.5, font: SB, color: ink }); yr = para(p, d, x2, yr - 18, colW, { size: 9.4, leading: 12.8 }) - 12; }
    let y = Math.min(yl, yr) - 6; y = subhead(p, "Driving — and the ZTL trap", M, y, terra);
    y = bullets(p, ["A car is a joy in Tuscany, Puglia & the Dolomites — and a liability in cities.", "ZTL (Zona Traffico Limitato): camera-controlled no-go zones in historic centres. Drive in and you'll be fined automatically, by post, weeks later.", "Park outside the centre and walk or take a shuttle.", "Non-EU drivers need an International Driving Permit; autostrade are tolled.", "Petrol is pricey; 'autogrill' stops are an institution."], M, y, CW, { accent: terra });
    return y;
  }, "Getting Around", "Never drive into a city's historic centre — those white 'ZTL' signs mean camera-enforced fines. Park at the edge and walk; you'll see more anyway.");
}
function railPasses() {
  pageW("15", "Getting around", "Tickets & driving", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Train tickets", M, yl, terra);
    yl = bullets(p, ["Two operators: Trenitalia (Le Frecce) and Italo — compare both.", "High-speed fares are cheapest booked early and fixed to a train.", "Regional tickets are a flat fare — but you MUST validate paper ones.", "Buy in the apps (Trenitalia, Italo) or at machines; e-tickets need no validation.", "A rail pass rarely beats point-to-point fares here — do the maths."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "City transport", M, yl, sage);
    yl = bullets(p, ["Buy metro/bus tickets before boarding (tabacchi, machines, apps).", "Validate on board; fines for fare-dodging are steep.", "Rome, Milan & Naples have handy metros; most centres are walkable."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Renting a car", x2, yr, blue);
    yr = bullets(p, ["Great for Tuscany, Umbria, Puglia, Sicily & the Dolomites.", "Book an automatic early — most are manual.", "International Driving Permit for non-EU licences; full insurance advised.", "Mind the ZTL zones and pay-and-display (strisce blu) parking."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Boats & scenic rides", x2, yr, ochre);
    yr = bullets(p, ["Amalfi & the lakes are best seen by ferry.", "Cinque Terre: hike or take the little coastal train.", "Venice: the vaporetto water-buses are your metro."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Tickets", "On regional (non–high-speed) paper tickets, stamp them in the green or white machine on the platform before boarding — an unvalidated ticket earns a fine.");
}
function accommodation() {
  pageW("16", "Where to stay", "Accommodation", sage, (p, y0) => {
    let y = para(p, "Italy's lodging is part of the pleasure — a frescoed palazzo, a Tuscan farm stay, a whitewashed trullo. Book cities and the shoulder seasons well ahead.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Type", w: CW * 0.24 }, { h: "≈ /night", w: CW * 0.22 }, { h: "Best for", w: CW * 0.54 }], [["Hostel / B&B", "€40–100", "Budget, solo, friendly local hosts"], ["Boutique hotel", "€120–250", "Character in the historic centre"], ["Agriturismo", "€90–200", "Tuscany/Umbria farm stays, pools, wine"], ["Masseria / trullo", "€120–300", "Puglia charm; whitewashed & rustic-chic"], ["Design / luxury", "€350+", "Palazzo hotels, lakes & coast"]], { rowH: 22, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Where to base yourself", M, top, terra); yl = bullets(p, ["Rome: Monti or Trastevere for atmosphere; near Termini for transport.", "Florence: the Oltrarno for a quieter, arty side.", "Venice: stay a night — the city is magic once day-trippers leave.", "Tuscany: an agriturismo near Siena, with a car."], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Booking know-how", x2, top, blue); yr = bullets(p, ["City tourist tax (tassa di soggiorno) is paid on arrival, in cash.", "'Historic centre' means charm — and often stairs, no lift.", "Agriturismi need a car; book dinner there too.", "August coast & Christmas cities sell out — reserve early."], x2, yr, colW, { accent: blue });
    colRule(p, top, yl, yr); return Math.min(yl, yr);
  }, "Accommodation", "Stay a night in Venice or a Tuscan agriturismo rather than day-tripping — both are transformed once the coaches leave and the light turns gold.", (pp, cx, cy) => { cypress(pp, cx, cy - 24, 20, sage, 1); });
}
function eating() {
  pageW("17", "Food & drink", "How to eat in Italy", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "How it works", M, yl);
    yl = bullets(p, ["Eat regionally — the local dish is almost always the right order.", "The meal has a rhythm: antipasto, primo (pasta), secondo, dolce — take what you like.", "Lunch ~1–2:30, dinner from 8; kitchens close between.", "A 'coperto' cover charge is normal; tipping isn't expected.", "Trattoria/osteria = homely & good value; ristorante = smarter."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "The coffee rules", M, yl, terra);
    yl = bullets(p, ["Cappuccino is a morning drink — never after a meal.", "'Un caffè' means an espresso; drink it standing at the bar (cheaper).", "Order & pay at the till first in busy bars, then show the receipt.", "An 'ammazzacaffè' (a grappa) can follow dinner — coffee, then spirit."], M, yl, colW, { accent: terra });
    yr = subhead(p, "Dietary needs", x2, yr, sage);
    yr = bullets(p, ["Vegetarian is easy; vegan is growing in cities.", "Coeliac-friendly ('senza glutine') is unusually well catered — Italy tests for it.", "Say 'sono vegetariano/a' or 'senza glutine'.", "Ask about hidden anchovy, lard (strutto) & meat stock."], x2, yr, colW, { accent: sage }) - 4;
    yr = subhead(p, "What to drink", x2, yr, blue);
    yr = bullets(p, ["Regional wine — order the house (della casa); it's usually good.", "Aperitivo: Aperol or Campari spritz, with free snacks ~6–8pm.", "Amaro or grappa to finish; limoncello on the coast.", "'Acqua frizzante o naturale?' — sparkling or still.", "'Salute!' — cheers."], x2, yr, colW, { accent: blue });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Eating", "Watch where locals eat lunch, not dinner — a busy trattoria at 1pm full of workers on a set menu is Italy's surest sign of a good kitchen.");
}
function dishes1() {
  pageW("18", "Food & drink", "What to order · the classics", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Pasta & rice", M, y0, terra);
    for (const [a, b] of [["Carbonara", "egg, pecorino, guanciale, pepper — no cream (Rome)"], ["Cacio e pepe", "pecorino & black pepper, silky (Rome)"], ["Ragù alla bolognese", "the real slow-cooked meat sauce (Bologna)"], ["Pesto alla genovese", "basil, pine nuts, parmesan (Liguria)"], ["Risotto", "creamy rice — alla milanese with saffron (Milan)"], ["Cacio... amatriciana", "tomato, guanciale, pecorino (Lazio)"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "Pizza, plates & sweets", x2, y0, blue);
    for (const [a, b] of [["Pizza napoletana", "blistered, chewy, from a wood oven (Naples)"], ["Bistecca alla fiorentina", "a colossal T-bone, rare (Tuscany)"], ["Parmigiana", "baked aubergine, tomato & mozzarella"], ["Fritto misto", "crisp fried seafood or vegetables"], ["Gelato", "the real thing — from a gelateria artigianale"], ["Tiramisù", "coffee, mascarpone, cocoa — heaven"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    return Math.min(yl, yr);
  }, "Dishes I", "Follow the 'km 0' and 'fatto in casa' (homemade) signs, and eat where the menu is short and regional — that's where Italy cooks best.", (pp, cx, cy) => { bowl(pp, cx, cy - 14, 20, ochre, 1); });
}
function dishes2() {
  pageW("18", "Food & drink", "What to order · region by region", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "North & centre", M, y0, sage);
    for (const [a, b] of [["Milan", "risotto giallo, cotoletta, panettone"], ["Bologna", "tortellini in brodo, tagliatelle al ragù, mortadella"], ["Venice", "cicchetti (bar snacks), sarde in saor, spritz"], ["Florence", "bistecca, ribollita, lampredotto street food"], ["Rome", "carbonara, cacio e pepe, supplì, carciofi"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "South & islands", x2, y0, ochre);
    for (const [a, b] of [["Naples", "true pizza, sfogliatella, ragù napoletano"], ["Amalfi", "lemon everything, fresh seafood, delizia al limone"], ["Puglia", "orecchiette, burrata, taralli, focaccia barese"], ["Sicily", "arancini, pasta alla Norma, cannoli, granita"], ["Sardinia", "culurgiones, porceddu, pecorino & bottarga"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    let y = Math.min(yl, yr) - 12; y = subhead(p, "Market & bar wisdom", M, y, blue);
    y = bullets(p, ["Markets (Rome's Testaccio, Bologna's Quadrilatero, Palermo's Ballarò) are a meal in themselves.", "Aperitivo hour: a spritz buys you a spread of free snacks.", "The shortest, hand-written menu is usually the best kitchen."], M, y, CW, { accent: blue });
    return y;
  }, "Dishes II", "The dish changes every fifty kilometres — order the town's speciality, not your favourite from home, and let each region surprise you.");
}
function shopping() {
  pageW("12", "Take a little home", "Shopping & craft", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Where to shop", M, yl, terra);
    yl = bullets(p, ["Food markets & alimentari for edible souvenirs.", "Artisan streets: Florence leather, Venice's Murano glass, Naples nativity figures.", "Milan for design & fashion; outlet villages nearby.", "Ceramics towns — Deruta, Vietri, Caltagirone."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Worth carrying home", M, yl, sage);
    yl = bullets(p, ["Olive oil, aged balsamic, dried pasta, coffee.", "Parmigiano & vacuum-packed cured meats (check customs).", "Leather, a silk tie, hand-made paper (Florence).", "A bottle of the region's wine or amaro."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Buy smart", x2, yr, blue);
    yr = bullets(p, ["Tax-free (VAT refund) on €70+ purchases for non-EU visitors — ask for the form.", "Prices are fixed; haggling isn't the culture (except flea markets).", "Beware fake 'designer' goods sold on the street — illegal to buy.", "Real Murano & Florentine leather carry maker's marks."], x2, yr, colW, { accent: blue }) - 6;
    yr = encadre(p, x2, yr, colW, "Insider tip", "The best souvenir is edible: a good olive oil, a wedge of Parmigiano or a bottle of the local wine will bring the trip home to your kitchen.");
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Shopping", "For non-EU visitors, ask for the tax-free (VAT refund) form on purchases over €70, and keep the goods unused for the airport refund desk.");
}
function activities() {
  pageW("19", "Experiences", "Things to do", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Art, ruins & faith", M, yl, terra);
    yl = bullets(p, ["Walk the Roman Forum & Colosseum at opening, before the heat.", "The Vatican & Sistine Chapel (book the first slot).", "The Uffizi & Michelangelo's David in Florence.", "Pompeii & Herculaneum under Vesuvius.", "A dawn on empty St Mark's Square, Venice."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Food & wine", M, yl, sage);
    yl = bullets(p, ["A pasta or pizza-making class.", "Wine tasting in Chianti, Barolo or the Prosecco hills.", "A market food tour; truffle-hunting in autumn.", "An evening aperitivo crawl."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Sea, lakes & hills", x2, yr, blue);
    yr = bullets(p, ["Boat the Amalfi Coast or Lake Como.", "Hike the Cinque Terre cliff paths.", "Drive the cypress roads of Val d'Orcia, Tuscany.", "Trek or ski the Dolomites."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Living Italy", x2, yr, ochre);
    yr = bullets(p, ["Opera at Verona's arena or La Scala.", "A passeggiata (evening stroll) and gelato.", "A local festa or sagra (food festival).", "Watch the world go by from a piazza café."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Activities", "Book the big sights for opening time. An empty Colosseum, Sistine Chapel or St Mark's at 8am is a completely different, magical experience.");
}
function culture() {
  pageW("20", "Practical tips", "Culture & etiquette", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Do", M, yl, sage);
    yl = bullets(p, ["Greet with 'buongiorno' / 'buonasera' on entering shops & bars.", "Dress the part — 'la bella figura' matters.", "Cover shoulders & knees in churches.", "Slow down at meals; they're the main event.", "Learn the coffee rules — you'll blend right in."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Don't", M, yl, terra);
    yl = bullets(p, ["Order a cappuccino after lunch (a giveaway!).", "Ask for parmesan on seafood pasta.", "Rush the waiter or expect the bill unasked — request 'il conto'.", "Wear beachwear away from the beach.", "Drive into a ZTL zone (see Transport)."], M, yl, colW, { accent: terra });
    yr = subhead(p, "The ideas behind it", x2, yr, blue);
    yr = para(p, "Italy runs on 'la bella figura' — presenting yourself and your table with care — and on deep regional pride. Campanilismo, loyalty to one's own town (and its bell-tower), explains why the food, dialect and rivalries change every valley. Match the courtesy and curiosity you're shown and you'll be welcomed warmly.", x2, yr, colW, { leading: 13.5 }) - 8;
    yr = subhead(p, "In churches", x2, yr, ochre);
    yr = bullets(p, ["Cover up; St Peter's & the Duomo enforce it.", "Quiet voices; no flash; often no photos inside.", "Some charge a small entry to the dome or treasury."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Culture", "When in doubt, watch the table beside you — Italians forgive almost anything except a cappuccino ordered after dinner.");
}
function safety() {
  pageW("21", "Practical tips", "Safety & staying well", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "A safe country — mind your pockets", M, yl, sage);
    yl = bullets(p, ["Violent crime is rare; pickpocketing is the real risk.", "Watch bags on the metro, at Termini, and in tourist crush (Rome, Naples, Venice).", "Wear a cross-body zip bag; keep phones off café tables.", "Ignore 'friendship bracelet' and petition scams near big sights."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Staying well", M, yl, blue);
    yl = bullets(p, ["Summer heat is fierce — hydrate; refill at street fountains.", "Pharmacies (green cross) give excellent minor-ailment advice.", "Standard tap water is safe; bottled is everywhere too.", "Coastal jellyfish & strong currents — heed local flags."], M, yl, colW, { accent: blue });
    yr = subhead(p, "Good to know", x2, yr, ochre);
    yr = bullets(p, ["Many shops shut for a midday riposo, and much of August.", "Sundays are quiet; plan around opening hours.", "Carry a little cash for coperto, markets & small towns.", "Strikes (sciopero) can hit transport — check before travel days."], x2, yr, colW, { accent: ochre }) - 4;
    yr = subhead(p, "Emergency numbers", x2, yr, terra);
    yr = bullets(p, ["General emergency (EU): 112", "Ambulance 118 · Police 113 · Fire 115", "Your embassy for lost passports"], x2, yr, colW, { accent: terra });
    yr -= 6; yr = subhead(p, "Travel responsibly", x2, yr, sage);
    yr = bullets(p, ["Don't sit/eat on monument steps where it's banned (fines in Rome & Venice).", "Support family trattorie & artisans over the tourist traps.", "Refill a bottle; carry out litter on trails."], x2, yr, colW, { accent: sage });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Safety", "Keep your bag zipped and in front on crowded transport and around big sights — pickpockets, not danger, are the only real risk in Italy.");
}
function travellers() {
  pageW("21", "Practical tips", "For every traveller", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Solo & solo women", M, yl, terra);
    yl = bullets(p, ["Very doable and rewarding; usual night-time sense applies.", "Counter dining and passeggiata make solo evenings easy.", "The odd unwanted attention in the south — a firm 'no, grazie' works."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Accessibility", M, yl, sage);
    yl = bullets(p, ["Improving: accessible high-speed trains & many museums.", "But cobbles, steps and old buildings can be tough; Venice has many bridges.", "Book assistance (RFI 'Sala Blu') for trains in advance."], M, yl, colW, { accent: sage });
    yr = subhead(p, "LGBTQ+", x2, yr, ochre);
    yr = bullets(p, ["Legal and generally welcoming, especially in big cities.", "Scenes in Milan, Rome, Bologna & Gay Village events.", "More conservative in small towns & the deep south."], x2, yr, colW, { accent: ochre }) - 4;
    yr = subhead(p, "Families & business", x2, yr, blue);
    yr = bullets(p, ["Italy adores children — restaurants welcome them warmly.", "Gelato, piazzas & pizza make it an easy family trip.", "Business: greet formally, dress sharply, and never rush the relationship over lunch."], x2, yr, colW, { accent: blue });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Travellers", "Whoever you are, Italy meets warmth with warmth — a 'buongiorno', a little curiosity about the food, and you'll be treated like a regular.");
}
function phrasebook1() {
  pageW("22", "Useful expressions", "An Italian phrasebook · I", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Essentials", M, y0);
    for (const [a, b] of [["Good morning", "buongiorno"], ["Good evening", "buonasera"], ["Thank you", "grazie"], ["You're welcome / please", "prego / per favore"], ["Excuse me / sorry", "scusi / mi dispiace"], ["Yes / No", "si / no"], ["Do you speak English?", "parla inglese?"], ["I don't understand", "non capisco"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    yl -= 4; yl = subhead(p, "Numbers", M, yl, sage);
    yl = para(p, "1 uno · 2 due · 3 tre · 4 quattro · 5 cinque · 6 sei · 7 sette · 8 otto · 9 nove · 10 dieci · 100 cento · 1,000 mille", M, yl, colW, { size: 9.5, leading: 14 });
    let yr = subhead(p, "Getting around", x2, y0, terra);
    for (const [a, b] of [["Where is…?", "dov'è…?"], ["How much?", "quanto costa?"], ["Station", "la stazione"], ["Ticket", "il biglietto"], ["A ticket to…", "un biglietto per…"], ["Left / right", "sinistra / destra"], ["Straight on", "sempre dritto"], ["Toilet", "il bagno"], ["Entrance / exit", "entrata / uscita"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook I", "'Buongiorno' on the way in and 'grazie, arrivederci' on the way out — those three moments of courtesy will change how every shopkeeper treats you.");
}
function phrasebook2() {
  pageW("22", "Useful expressions", "An Italian phrasebook · II", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "At the table", M, y0, terra);
    for (const [a, b] of [["A table for two", "un tavolo per due"], ["The menu, please", "il menù, per favore"], ["The house wine", "il vino della casa"], ["Still / sparkling water", "acqua naturale / frizzante"], ["Delicious!", "buonissimo!"], ["The bill, please", "il conto, per favore"], ["I'm vegetarian", "sono vegetariano/a"], ["Cheers!", "salute!"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    let yr = subhead(p, "Small talk & shops", x2, y0, sage);
    for (const [a, b] of [["How are you?", "come sta?"], ["Very well, thanks", "molto bene, grazie"], ["It's beautiful", "è bellissimo"], ["A coffee, please", "un caffè, per favore"], ["Can I pay by card?", "posso pagare con carta?"], ["Goodbye", "arrivederci"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    yr -= 4; yr = subhead(p, "Help", x2, yr, terra);
    for (const [a, b] of [["Help!", "aiuto!"], ["Hospital", "l'ospedale"], ["Police", "la polizia"], ["I'm lost", "mi sono perso/a"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook II", "Italians warm instantly to anyone who tries the language. A shaky 'un caffè, per favore' with a smile is always answered in kind.");
}
function resources() {
  pageW("23", "Before you leave the book", "Resources & a few words", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Trusted & official", M, y0, terra);
    yl = bullets(p, ["Italian tourism — italia.it", "Trains — Trenitalia & Italo (apps/sites)", "Museums — book via official sites (Coopculture, Uffizi, Vatican)", "Weather & alerts — local forecasts; strike calendars", "City passes — Roma Pass, Firenze/Venezia options", "Getting online — EU roaming or an eSIM"], M, yl, colW, { accent: terra }) - 6;
    yl = encadre(p, M, yl, colW, "Insider tip", "Dial 112 for any emergency across Italy (and the EU) — one number, English-speaking operators, connects you to police, ambulance or fire.");
    let yr = subhead(p, "A few words of Italian", x2, y0, blue);
    for (const [a, b] of [["Good morning", "buongiorno"], ["Thank you", "grazie"], ["Please", "per favore"], ["Excuse me", "scusi"], ["How much?", "quanto costa?"], ["Delicious!", "buonissimo!"], ["Cheers!", "salute!"], ["Goodbye", "arrivederci"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14 });
    yr -= 2; text(p, "A warm 'buongiorno' is always the right opener.", x2, yr, { size: 9, font: SI, color: sub });
    return Math.min(yl, yr);
  }, "Resources", "Bookmark the official ticket sites before you fly — Italy's big museums and the Colosseum sell timed slots that vanish, and third-party resellers overcharge.");
}
function appendices() {
  pageW("24", "Appendices", "Before-you-go checklists", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Before you go", M, y0, terra); let yy = yl;
    for (const it of ["Passport valid 3+ months (non-EU)", "Check visa / ETIAS rules", "Travel insurance (theft + medical)", "Pre-book Colosseum, Vatican, Uffizi", "Trains & first/last night booked", "EU roaming or an eSIM sorted", "Note the ZTL zones if driving", "Museum city-pass decided"]) { checkBoxLine(p, M, yy - 9, it, colW, terra); yy -= 22; }
    yy -= 6; let yl2 = subhead(p, "Day bag", M, yy, blue);
    for (const it of ["Zip cross-body bag (anti-theft)", "Some cash for coperto & markets", "Refillable water bottle", "Scarf for churches & sun", "Portable charger"]) { checkBoxLine(p, M, yl2 - 9, it, colW, blue); yl2 -= 22; }
    let yr = subhead(p, "Packing", x2, y0, sage); let yry = yr;
    for (const it of ["Comfortable smart walking shoes", "One neat outfit for dinner", "Shoulders/knees cover for churches", "Layers + compact umbrella", "Sun hat, sunglasses, swimwear (season)", "Type C/F/L adapter + power bank", "Prescriptions in original packs", "Foldable tote for the market"]) { checkBoxLine(p, x2, yry - 9, it, colW, sage); yry -= 22; }
    yry -= 6; let yr2 = subhead(p, "Documents", x2, yry, ochre);
    for (const it of ["Passport / ID + copies", "Insurance & EHIC/GHIC", "Pre-booked entry tickets (offline)", "Driving licence + IDP (if driving)", "Accommodation confirmations"]) { checkBoxLine(p, x2, yr2 - 9, it, colW, ochre); yr2 -= 22; }
    return Math.min(yl2, yr2);
  }, "Appendices", "Screenshot this page to your phone — with timed museum slots and train validations, a quick pre-flight check keeps the trip running smoothly.");
}
function closing() {
  pageW("", "One last thing", "Go slowly, see deeply", sage, (p, y0) => {
    let y = para(p, "If there's one idea to carry into Italy, it's this: resist the urge to tick off cities. The travellers who fall hardest for this country are the ones who slow down — who nurse a single espresso and watch a piazza wake, who follow a nonna's hand-written menu, who take the long, cypress-lined road with nowhere to be by dark.", M, y0, CW, { leading: 15.5 }) - 8;
    y = para(p, "Say 'buongiorno'. Learn ten words. Eat what the region eats. Italy will meet your curiosity with a warmth — and a table — you'll remember for years.", M, y, CW, { leading: 15.5 }) - 16;
    y = subhead(p, "A few good resources", M, y, terra);
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = bullets(p, ["Italian tourism — italia.it", "Trenitalia & Italo — for the trains", "Official museum sites — for timed tickets"], M, top, colW, { accent: terra });
    let yr = bullets(p, ["A ZTL map for any city you'll drive in", "Google Maps (offline) & Translate", "Your travel insurer's 24-hour line"], x2, top, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Go Slowly", "Give one whole day to a single town with no plan — the long lunch and the aimless passeggiata are where Italy quietly steals your heart.", (pp, cx, cy) => { wineglass(pp, cx, cy - 18, 18, terra, 1); });
}
function back() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  duomo(p, W / 2, H / 2 + 30, 54, ink, 1);
  center(p, "Buon viaggio", H / 2 - 40, { size: 40, font: D, color: ink });
  center(p, "Safe travels, and eat well.", H / 2 - 74, { size: 13, font: SI, color: sub });
  sceneBand(p, 150);
  trackedCenter(p, "THE SLOW ATLAS  ·  RENNES, FRANCE", 96, { size: 8, font: NB, color: terra, tracking: 3 });
}

// ---- itinerary data ----
const classicItin = ["7 days · Rome, Florence & Venice", terra, "The classic first trip: three peerless cities on one high-speed line. Fly into Rome, out of Venice — no car needed.",
  [{ key: "rom", name: "Rome", x: 0.5, y: 0.24, big: true, lx: 9 }, { key: "flo", name: "Florence", x: 0.46, y: 0.5, big: true, lx: 9 }, { key: "ven", name: "Venice", x: 0.6, y: 0.82, big: true, lx: 9 }],
  ["rom", "flo", "ven"],
  [["D1–3", "Rome", "Colosseum & Forum, the Vatican, Trevi & Pantheon, Trastevere by night."], ["D4–5", "Florence", "The Duomo, Uffizi & David; sunset at Piazzale Michelangelo."], ["D6–7", "Venice", "St Mark's, a gondola or vaporetto, and getting gloriously lost."]],
  "Add 2–3 days and a Tuscan agriturismo (with a car) between Florence and Venice for the 10-day version."];
const southItin = ["10 days · Rome & the South", blue, "Rome, then the drama of the Amalfi Coast, Pompeii and Naples — history, sea and the world's best pizza.",
  [{ key: "rom", name: "Rome", x: 0.5, y: 0.82, big: true, lx: 9 }, { key: "nap", name: "Naples", x: 0.52, y: 0.56, big: true, lx: 9 }, { key: "pom", name: "Pompeii", x: 0.58, y: 0.44, lx: 9 }, { key: "ama", name: "Amalfi", x: 0.56, y: 0.24, big: true, lx: 9 }],
  ["rom", "nap", "pom", "ama"],
  [["D1–4", "Rome", "The ancient city, the Vatican, and long Roman dinners."], ["D5–6", "Naples", "Chaotic, glorious; the archaeological museum & true pizza."], ["D7", "Pompeii", "The city frozen by Vesuvius."], ["D8–10", "Amalfi Coast", "Positano, Ravello & boat days along the cliffs."]],
  "Prefer countryside to coast? Swap the Amalfi leg for Tuscany's hill towns and vineyards."];
const grandItin = ["14 days · The grand tour", sage, "Two weeks for the greatest hits plus Tuscany's countryside — cities, art, wine and cypress roads.",
  [{ key: "rom", name: "Rome", x: 0.5, y: 0.2, big: true, lx: 9 }, { key: "sie", name: "Siena", x: 0.42, y: 0.42, lx: -40, big: true }, { key: "flo", name: "Florence", x: 0.46, y: 0.56, big: true, lx: 9 }, { key: "cin", name: "Cinque Terre", x: 0.3, y: 0.66, lx: -84 }, { key: "ven", name: "Venice", x: 0.62, y: 0.86, big: true, lx: 9 }],
  ["rom", "sie", "flo", "cin", "ven"],
  [["D1–4", "Rome", "The eternal city, unhurried."], ["D5–7", "Tuscany", "Siena, San Gimignano & a vineyard stay (with a car)."], ["D8–9", "Florence", "Renaissance art and the Oltrarno."], ["D10–11", "Cinque Terre", "Cliff villages, coastal walks, seafood."], ["D12–14", "Venice + Verona", "Canals, then an opera in Verona's arena on the way out."]],
  "Short on time? This works at 10 days by trimming Tuscany to two nights."];
const offbeatItin = ["10 days · Off the beaten track", ochre, "The Italy beyond the big three: whitewashed Puglia and ancient Sicily — sun, temples, food and empty roads.",
  [{ key: "bar", name: "Bari", x: 0.72, y: 0.82, big: true, lx: 9 }, { key: "alb", name: "Alberobello", x: 0.66, y: 0.66, lx: 9 }, { key: "lec", name: "Lecce", x: 0.78, y: 0.5, lx: 9, big: true }, { key: "pal", name: "Palermo", x: 0.36, y: 0.28, big: true, lx: 9 }, { key: "tao", name: "Taormina", x: 0.5, y: 0.14, lx: 9 }],
  ["bar", "alb", "lec", "pal", "tao"],
  [["D1–2", "Bari & the coast", "Old-town espresso and orecchiette made on the doorstep."], ["D3–4", "Valle d'Itria", "Alberobello's trulli, Ostuni's white lanes, a masseria stay."], ["D5", "Lecce", "Baroque 'Florence of the South'."], ["D6–8", "Palermo & west Sicily", "Markets, mosaics, Segesta's temple."], ["D9–10", "Taormina & Etna", "Cliff-top views and a volcano climb."]],
  "Two islands in one trip? Fly Puglia to Sicily rather than driving the long way round."];

async function buildDoc([w, h]) {
  doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Italy: The Complete Guide"); doc.setAuthor("The Slow Atlas");
  doc.setSubject("A complete illustrated travel guide to Italy"); doc.setKeywords(["italy", "travel guide", "ebook", "itinerary", "rome", "florence"]);
  W = w; H = h; M = 50; CW = W - M * 2; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true }); SF = await doc.embedFont(fb.serif, { subset: true }); SB = await doc.embedFont(fb.serifB, { subset: true });
  SI = await doc.embedFont(fb.serifI, { subset: true }); SN = await doc.embedFont(fb.sans, { subset: true }); NB = await doc.embedFont(fb.sansB, { subset: true });

  cover(); intro();
  divider("I", "Part One", "Before you go", "Timing, paperwork and packing — sorted.", ["When to go & festivals", "Documents, health & money", "What to pack"], (p, cx, cy, c) => { hills(p, cx - 150, cy - 20, 300, 56, c, 1); duomo(p, cx, cy - 20, 46, c, 1); cypress(p, cx + 120, cy - 20, 44, c, 1); }, ochre);
  whenToGo(); documents(); packing();
  divider("II", "Part Two", "Budget", "What it really costs — from an espresso to a feast.", ["Daily budgets, low to lavish", "A sample ten-day spend", "Prices to anchor on"], (p, cx, cy, c) => { wineglass(p, cx - 66, cy - 6, 26, c, 1); wineglass(p, cx, cy - 2, 32, c, 1); wineglass(p, cx + 66, cy - 6, 24, c, 1); }, terra);
  budget();
  divider("III", "Part Three", "Destinations", "The unmissable places, region by region.", ["The lie of the land", "Rome · Florence · Venice", "Which base is for you?", "A short history & the arts"], (p, cx, cy, c) => { hills(p, cx - 160, cy - 20, 320, 60, c, 1); duomo(p, cx - 80, cy - 20, 40, c, 1); cypress(p, cx + 120, cy - 20, 44, c, 1); arch(p, cx + 40, cy - 20, 34, c, 1); }, blue);
  regionsMap();
  destination("06", "Rome", terra, "The Eternal City is a living palimpsest: emperors, popes and Vespas layered over three thousand years. Grand, chaotic and endlessly moreish — give it three or four days and it never lets go.",
    ["The Colosseum, Roman Forum & Palatine", "The Vatican: St Peter's & the Sistine Chapel", "The Pantheon, still perfect after 1,900 years", "Trevi Fountain, the Spanish Steps & Piazza Navona", "Trastevere's lanes at aperitivo hour"],
    ["Book the Colosseum & Vatican online, first slot.", "It's walkable, but hot — plan around the midday.", "Watch pockets on the metro & at Termini.", "Base in Monti or Trastevere for atmosphere."],
    ["Carbonara, cacio e pepe, supplì & artichokes", "Pizza al taglio and a proper Roman gelato", "Testaccio market for a food tour", "An evening spritz on a piazza"],
    ["Two airports; the Leonardo Express to Termini.", "Compact centre — walk, with the metro for hops.", "A great rail hub north & south.", "Skip a car entirely (ZTL everywhere)."],
    "Rome", "Rome runs on heat and timing — book the Colosseum and Vatican for the first morning slot, and save the piazzas for the cool of the evening.");
  destination("07", "Florence & Tuscany", sage, "The cradle of the Renaissance is a walkable jewel of art, and the gateway to Tuscany's cypress hills, wine roads and honey-stone towns.",
    ["The Duomo & Brunelleschi's dome", "The Uffizi & Michelangelo's David (book ahead)", "Ponte Vecchio & sunset at Piazzale Michelangelo", "Day trips: Siena, San Gimignano, Chianti", "The Val d'Orcia's cypress-lined roads"],
    ["Pre-book the Uffizi & Accademia to skip queues.", "The centre is small — walk the Oltrarno's quiet side.", "For Tuscany, hire a car (but not for the city).", "Spring & autumn are glorious; August is hot."],
    ["Bistecca alla fiorentina, ribollita, lampredotto", "A Chianti or Brunello tasting", "Gelato from an artisan gelateria", "Cicchetti-style wine bars (enoteche)"],
    ["1h30 from Rome, ~2h to Venice by fast train.", "Walkable core; buses & trains to the hill towns.", "A car unlocks the countryside.", "Pisa & Bologna airports are close."],
    "Florence & Tuscany", "Do Florence on foot and Tuscany by car — but never bring the car into the city; park outside the ZTL and walk the Renaissance in.");
  destination("08", "Venice & the North", ochre, "A city built on water, unlike anywhere on earth — and a springboard to the Dolomites, the Lakes and Milan's style. Stay a night to have it after dark.",
    ["St Mark's Basilica & the Doge's Palace", "A gondola or the No. 1 vaporetto down the Grand Canal", "Getting lost in Cannaregio & Dorsoduro", "Murano glass & Burano's painted houses", "North: Lake Como, Verona & the Dolomites"],
    ["Stay overnight — it's magic once day-trippers leave.", "Follow yellow signs (per Rialto / San Marco).", "Acqua alta (high water) can flood low areas Nov–Jan.", "It's costly; eat where the locals do (bacari)."],
    ["Cicchetti & an ombra (small wine) in a bacaro", "Sarde in saor, risotto, fresh lagoon seafood", "A spritz on a canal-side campo", "North: risotto, polenta & Prosecco"],
    ["Marco Polo airport + water/land transfers.", "No cars — walk & take the vaporetto.", "Fast trains to Milan (~2h30) & the north.", "A base for Verona, the Lakes & Dolomites."],
    "Venice & the North", "Stay the night. Venice belongs to whoever is still there after the day-trippers leave — the empty campos at dusk are the real city.");
  destination("10", "Naples, Amalfi & the South", blue, "South of Rome, Italy turns up the colour and the volume — chaotic Naples, the vertiginous Amalfi Coast, Pompeii's ghosts and whitewashed Puglia.",
    ["Naples' old town, pizza & archaeological museum", "Pompeii & Herculaneum beneath Vesuvius", "The Amalfi Coast — Positano, Ravello, boat days", "Capri & the Blue Grotto", "Puglia's trulli, sea caves & baroque Lecce"],
    ["Naples is intense — streetwise, and it rewards you.", "Amalfi in summer is packed; go May/June or Sept.", "The coast road is stunning but slow — boat it.", "The far south is best with a car."],
    ["The world's best pizza (Naples)", "Lemon everything on the Amalfi Coast", "Seafood, mozzarella di bufala, sfogliatella", "Puglia: orecchiette, burrata & focaccia"],
    ["Naples: fast train 1h10 from Rome.", "Amalfi by ferry & SITA bus (not a hire car).", "Puglia: fly to Bari/Brindisi, then drive.", "Ferries to Capri, Ischia & the islands."],
    "Naples, Amalfi & the South", "In summer the Amalfi road crawls — see the coast by ferry instead, and you'll trade traffic for the best views in Italy.");
  regionsCompare();
  cultureHistory();
  divider("IV", "Part Four", "Ready-to-use itineraries", "Four trips, planned for you — adapt and go.", ["7 days · Rome, Florence & Venice", "10 days · Rome & the South", "14 days · the grand tour", "10 days · off the beaten track"], (p, cx, cy, c) => { hills(p, cx - 150, cy - 20, 300, 56, c, 1); scooter(p, cx, cy - 24, 28, c, 1); cypress(p, cx + 120, cy - 20, 42, c, 1); }, terra);
  itinerary("11", ...classicItin); itinerary("12", ...southItin); itinerary("13", ...grandItin); itinerary("14", ...offbeatItin);
  divider("V", "Part Five", "Getting around", "How the country joins up — and the ZTL you must dodge.", ["The rail network map", "Trains, scooters & boats", "Tickets & driving"], (p, cx, cy, c) => { train(p, cx - 90, cy - 6, 30, c, 1); scooter(p, cx + 20, cy - 8, 26, c, 1); boat(p, cx + 110, cy - 8, 22, c, 1); }, sage);
  railMap(); transportModes(); railPasses();
  divider("VI", "Part Six", "Where to stay & what to eat", "From agriturismo to al dente.", ["Accommodation & agriturismi", "How to eat (and the coffee rules)", "What to order, region by region"], (p, cx, cy, c) => { duomo(p, cx - 70, cy - 20, 40, c, 1); bowl(p, cx + 70, cy - 8, 28, c, 1); cypress(p, cx, cy - 20, 34, c, 1); }, ochre);
  accommodation(); eating(); dishes1(); dishes2(); shopping();
  divider("VII", "Part Seven", "Experiences & practical tips", "What to do — and how to do it well.", ["Things to do", "Culture & etiquette", "Safety & every traveller", "An Italian phrasebook"], (p, cx, cy, c) => { hills(p, cx - 150, cy - 20, 300, 56, c, 1); arch(p, cx, cy - 20, 40, c, 1); cypress(p, cx + 110, cy - 20, 40, c, 1); }, blue);
  activities(); culture(); safety(); travellers(); phrasebook1(); phrasebook2(); resources(); appendices();
  closing(); back();
  return doc.save();
}
async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  for (const [name, size] of [["US-Letter", [612, 792]], ["A4", [595.28, 841.89]]]) {
    const bytes = await buildDoc(size); writeFileSync(join(ROOT, "dist", `Italy-The-Complete-Guide-${name}.pdf`), bytes);
    console.log(`Italy ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
