/**
 * The Slow Atlas — Japan: The Complete Guide
 * Same engine & palette as the Thailand guide (a cohesive collection), with
 * Japan content and motifs (Mt Fuji, torii, pagoda, shinkansen, sakura).
 * Original vector illustrations only — no third-party photos.
 * Generates US Letter + A4.  Run: npm run japan
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
// Mt Fuji — broad concave slopes + snow cap
function fuji(p, cx, baseY, w, h, c, ww = 1) {
  polyl(p, [{ x: cx - w / 2, y: baseY }, { x: cx - w * 0.16, y: baseY + h * 0.74 }, { x: cx, y: baseY + h }, { x: cx + w * 0.16, y: baseY + h * 0.74 }, { x: cx + w / 2, y: baseY }], c, ww);
  hline(p, cx - w / 2, cx + w / 2, baseY, { thickness: ww, color: c });
  polyl(p, [{ x: cx - w * 0.17, y: baseY + h * 0.73 }, { x: cx - w * 0.08, y: baseY + h * 0.66 }, { x: cx, y: baseY + h * 0.8 }, { x: cx + w * 0.08, y: baseY + h * 0.66 }, { x: cx + w * 0.17, y: baseY + h * 0.73 }], c, ww);
}
// torii gate
function torii(p, cx, baseY, s, c, ww = 1) {
  seg(p, cx - 0.42 * s, baseY, cx - 0.42 * s, baseY + 1.05 * s, c, ww); seg(p, cx + 0.42 * s, baseY, cx + 0.42 * s, baseY + 1.05 * s, c, ww);
  polyl(p, [{ x: cx - 0.62 * s, y: baseY + 1.02 * s }, { x: cx - 0.55 * s, y: baseY + 1.14 * s }, { x: cx + 0.55 * s, y: baseY + 1.14 * s }, { x: cx + 0.62 * s, y: baseY + 1.02 * s }], c, ww);
  hline(p, cx - 0.52 * s, cx + 0.52 * s, baseY + 1.0 * s, { thickness: ww, color: c });
  hline(p, cx - 0.47 * s, cx + 0.47 * s, baseY + 0.74 * s, { thickness: ww, color: c });
  seg(p, cx - 0.06 * s, baseY + 1.0 * s, cx - 0.06 * s, baseY + 0.86 * s, c, ww); seg(p, cx + 0.06 * s, baseY + 1.0 * s, cx + 0.06 * s, baseY + 0.86 * s, c, ww);
}
// five-tier pagoda
function pagoda(p, cx, baseY, s, c, ww = 1) {
  for (let i = 0; i < 5; i++) { const rw = (0.9 - i * 0.13) * s, ry = baseY + 0.28 * s + i * 0.46 * s; polyl(p, [{ x: cx - rw / 2 - 0.06 * s, y: ry }, { x: cx - rw / 2, y: ry + 0.13 * s }, { x: cx + rw / 2, y: ry + 0.13 * s }, { x: cx + rw / 2 + 0.06 * s, y: ry }], c, ww); if (i < 4) { seg(p, cx - rw * 0.32, ry + 0.13 * s, cx - rw * 0.32, ry + 0.46 * s, c, ww); seg(p, cx + rw * 0.32, ry + 0.13 * s, cx + rw * 0.32, ry + 0.46 * s, c, ww); } }
  seg(p, cx, baseY + 2.52 * s, cx, baseY + 2.95 * s, c, ww); sun(p, cx, baseY + 3.02 * s, 0.06 * s, c, ww);
  seg(p, cx - 0.28 * s, baseY, cx - 0.28 * s, baseY + 0.28 * s, c, ww); seg(p, cx + 0.28 * s, baseY, cx + 0.28 * s, baseY + 0.28 * s, c, ww); hline(p, cx - 0.34 * s, cx + 0.34 * s, baseY, { thickness: ww, color: c });
}
// shinkansen (bullet train, side profile with pointed nose)
function shinkansen(p, cx, cy, s, c, ww = 1) {
  polyl(p, [{ x: cx - 1.1 * s, y: cy }, { x: cx - 1.1 * s, y: cy + 0.5 * s }, { x: cx + 0.7 * s, y: cy + 0.5 * s }, { x: cx + 1.25 * s, y: cy + 0.24 * s }, { x: cx + 1.1 * s, y: cy }], c, ww, true);
  hline(p, cx - 1.1 * s, cx + 1.0 * s, cy + 0.24 * s, { thickness: ww, color: c });
  for (const dx of [-0.85, -0.5, -0.15, 0.2, 0.55]) polyl(p, [{ x: cx + dx * s, y: cy + 0.3 * s }, { x: cx + dx * s, y: cy + 0.44 * s }, { x: cx + (dx + 0.22) * s, y: cy + 0.44 * s }, { x: cx + (dx + 0.22) * s, y: cy + 0.3 * s }], c, ww);
}
// cherry blossom
function sakura(p, cx, cy, s, c, ww = 1) { for (let i = 0; i < 5; i++) { const a = i * (2 * Math.PI / 5) - Math.PI / 2; const px = cx + Math.cos(a) * 0.5 * s, py = cy + Math.sin(a) * 0.5 * s; arc(p, px, py, 0.3 * s, 0.3 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 12 }); } sun(p, cx, cy, 0.12 * s, c, ww); }
function lantern(p, cx, y, s, c, ww = 1) { hline(p, cx - 0.35 * s, cx + 0.35 * s, y + s, { thickness: ww, color: c }); arc(p, cx, y + 0.5 * s, 0.5 * s, 0.5 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 26 }); seg(p, cx, y + s, cx, y + 1.2 * s, c, ww); for (const dx of [-0.12, 0, 0.12]) seg(p, cx + dx * s, y - 0.02 * s, cx + dx * s, y - 0.32 * s, c, ww); }
function bowl(p, cx, y, s, c, ww = 1) { arc(p, cx, y + 0.5 * s, s, 0.5 * s, Math.PI, 2 * Math.PI, { color: c, w: ww, seg: 20 }); hline(p, cx - s * 1.06, cx + s * 1.06, y + 0.5 * s, { thickness: ww, color: c }); for (const dx of [-0.35, 0, 0.35]) arc(p, cx + dx * s, y + 0.9 * s, 0.12 * s, 0.22 * s, -Math.PI / 2, Math.PI / 2, { color: c, w: ww, seg: 8 }); seg(p, cx + 0.5 * s, y + s, cx + 1.2 * s, y + 1.5 * s, c, ww); seg(p, cx + 0.62 * s, y + 0.96 * s, cx + 1.3 * s, y + 1.42 * s, c, ww); }
function plane(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - s, y: cy }, { x: cx + 0.7 * s, y: cy }, { x: cx + s, y: cy + 0.12 * s }, { x: cx + 0.7 * s, y: cy + 0.24 * s }, { x: cx - s, y: cy + 0.24 * s }], c, ww, true); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy + 0.6 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); polyl(p, [{ x: cx, y: cy + 0.12 * s }, { x: cx - 0.3 * s, y: cy - 0.36 * s }, { x: cx + 0.1 * s, y: cy + 0.12 * s }], c, ww); }
function train(p, cx, cy, s, c, ww = 1) { polyl(p, [{ x: cx - 0.9 * s, y: cy }, { x: cx - 0.9 * s, y: cy + 0.7 * s }, { x: cx + 0.5 * s, y: cy + 0.7 * s }, { x: cx + 0.9 * s, y: cy + 0.4 * s }, { x: cx + 0.9 * s, y: cy }], c, ww, true); hline(p, cx - 0.9 * s, cx + 0.5 * s, cy + 0.42 * s, { thickness: ww, color: c }); for (const dx of [-0.6, 0, 0.55]) arc(p, cx + dx * s, cy, 0.14 * s, 0.14 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }
function bus(p, cx, cy, s, c, ww = 1) { const x0 = cx - 0.9 * s, x1 = cx + 0.9 * s, y0 = cy + 0.1 * s, y1 = cy + 0.8 * s; polyl(p, [{ x: x0, y: y0 }, { x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y0 }], c, ww, true); hline(p, x0, x1, y0 + 0.42 * s, { thickness: ww, color: c }); for (let i = 0; i < 4; i++) seg(p, x0 + (0.18 + i * 0.42) * s, y0 + 0.44 * s, x0 + (0.18 + i * 0.42) * s, y1 - 0.04 * s, c, ww); arc(p, cx - 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); arc(p, cx + 0.55 * s, y0, 0.16 * s, 0.16 * s, 0, 2 * Math.PI, { color: c, w: ww, seg: 14 }); }

function sceneBand(p, yBase, { c = hair } = {}) { hline(p, M, W - M, yBase, { thickness: 0.8, color: c }); fuji(p, M + CW * 0.28, yBase, 150, 66, c, 0.9); torii(p, M + CW * 0.62, yBase, 34, terra, 0.9); pagoda(p, M + CW * 0.82, yBase, 20, c, 0.9); sakura(p, M + CW * 0.1, yBase + 30, 16, sage, 0.9); shinkansen(p, M + CW * 0.45, yBase + 8, 14, blue, 0.9); }
function motif(p, x, w, cy, accent = terra) { fuji(p, x + w * 0.42, cy, w * 0.5, 56, hair, 1); torii(p, x + w * 0.74, cy, 28, terra, 1); pagoda(p, x + w * 0.9, cy, 16, hair, 1); sakura(p, x + w * 0.14, cy + 26, 15, sage, 1); }

// ---------- furniture (identical engine) ----------
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
  const defArt = art || ((pp, cx, cy) => { torii(pp, cx - 6, cy - 20, 22, terra, 1); sakura(pp, cx + 30, cy - 8, 13, sage, 1); });
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

// ---------- shared big pages ----------
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
  center(p, "Japan", H - 236, { size: 82, font: D, color: ink });
  center(p, "The Complete Guide", H - 278, { size: 34, font: D, color: terra });
  hline(p, W / 2 - 72, W / 2 + 72, H - 302, { thickness: 0.8, color: ink });
  center(p, "Where to go, what to eat, and how to travel it slowly.", H - 328, { size: 13, font: SI, color: sub });
  const yB = 196; fuji(p, W / 2, yB, CW - 90, 96, hair, 1); torii(p, M + 96, yB, 44, terra, 1); pagoda(p, W - M - 96, yB, 26, ink, 1); sakura(p, M + 150, yB + 66, 20, sage, 1); sakura(p, W - M - 160, yB + 74, 16, sage, 1); shinkansen(p, W / 2, yB - 6, 20, blue, 1);
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME II", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}
function intro() {
  pageW("", "Welcome", "Yokoso — welcome", terra, (p, y0) => {
    let y = para(p, "There is nowhere quite like Japan. In one trip you can stand beneath a thousand vermilion torii, eat sushi at a seven-seat counter, soak in a mountain onsen as snow falls, and cross the world's busiest intersection — all with a courtesy and precision that feel like a kind of art. It is ancient and hyper-modern at once, and astonishingly easy to travel.", M, y0, CW, { leading: 15.5 }) - 6;
    y = para(p, "This guide is built to help you travel slowly and well: to understand the country, plan with confidence, and leave room for the unhurried afternoons that become the best memories — from your first rail-pass question to your last bowl of ramen.", M, y, CW, { leading: 15.5 }) - 14;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "What's inside", M, top);
    yl = bullets(p, ["Before you go — timing, paperwork & packing", "Budget — what it really costs, with sample spends", "Destinations — Tokyo, Kyoto, Osaka & beyond", "Four ready-to-use itineraries, 7 to 14 days", "Getting around — the rail map, passes & IC cards", "Where to stay, what to eat, what to do", "Culture, etiquette, onsen & a phrasebook"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "How to travel it slowly", x2, top, sage);
    yr = bullets(p, ["Do fewer places, more deeply — Japan rewards it.", "Sit at the counter; order what the chef suggests.", "Learn ten words; a bow and a 'sumimasen' open doors.", "Take the local train sometimes, not just the bullet.", "Build in an aimless afternoon in a single neighbourhood.", "Follow the quiet rules — they're half the magic."], x2, yr, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Welcome", "Carry a coin purse, an IC card and an empty afternoon — Japan fills the last one better than any itinerary.", (pp, cx, cy) => { lantern(pp, cx, cy - 14, 24, terra, 1); });
}

function whenToGo() {
  pageW("01", "Before you go", "When to go", ochre, (p, y0) => {
    let y = para(p, "Japan is a country of four vivid seasons — and timing is half the trip. Two windows are golden; two are quieter and cheaper.", M, y0, CW, { leading: 14 }) - 6;
    for (const [n, w, a, d] of [["Spring", "Mar – May", terra, "Cherry blossom (late Mar–early Apr, later up north). Mild, beautiful, busy — book months ahead."], ["Autumn", "Oct – Nov", ochre, "Fiery foliage (koyo), crisp air and clear skies. The connoisseur's season, rivalling spring."], ["Summer", "Jun – Aug", blue, "Hot, humid; a rainy spell (tsuyu) in June. But festivals, fireworks and cool Hokkaido & the Alps."], ["Winter", "Dec – Feb", sage, "Cold and clear on the Pacific side; world-class snow in Hokkaido & Nagano; onsen weather; fewer crowds."]]) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 14, y, { size: 12.5, font: SB, color: ink }); tracked(p, w.toUpperCase(), M + 14, y - 15, { size: 8, font: NB, color: a, tracking: 1.3 }); para(p, d, M + 150, y + 1, CW - 150, { size: 9.3, leading: 12.5 }); y -= 42; }
    y -= 4; y = subhead(p, "A month-by-month almanac", M, y, terra);
    const half = CW / 2 - 10, cols = [{ h: "Month", w: half * 0.22 }, { h: "Weather", w: half * 0.42 }, { h: "Don't miss", w: half * 0.36 }];
    table(p, M, y, cols, [["Jan", "Cold, clear, dry", "New Year, snow"], ["Feb", "Cold; deep snow N.", "Sapporo Snow Fest."], ["Mar", "Warming", "Blossom begins (S.)"], ["Apr", "Mild, lovely", "Cherry blossom peak"], ["May", "Warm, pleasant", "Green, fewer crowds"], ["Jun", "Rainy (tsuyu)", "Hydrangeas"]], { rowH: 18, fontSize: 9 });
    table(p, M + CW / 2 + 10, y, cols.map((c) => ({ ...c })), [["Jul", "Hot, humid", "Gion Matsuri (Kyoto)"], ["Aug", "Hottest", "Fireworks, Obon"], ["Sep", "Warm; typhoons", "Quiet shoulder"], ["Oct", "Crisp, clear", "Foliage begins (N.)"], ["Nov", "Cool, superb", "Autumn leaves peak"], ["Dec", "Cold; illuminations", "Snow, onsen"]], { rowH: 18, fontSize: 9 });
    return 0;
  }, "When to Go");
}
function documents() {
  pageW("02", "Before you go", "Documents, health & money", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Entry & visas", M, yl);
    yl = bullets(p, ["Many nationalities (EU, UK, US, Australia, Canada…) enter visa-free for up to 90 days — confirm your own rule before you fly.", "Passport valid for your stay; an onward/return ticket may be checked.", "Fill the online arrival/customs forms (Visit Japan Web) to speed up airports.", "No mandatory vaccines; be up to date on routine jabs."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Health & safety net", M, yl, sage);
    yl = bullets(p, ["Excellent healthcare, but pricey without cover — take travel insurance.", "Tap water is safe to drink everywhere.", "Pharmacies (kusuriya) are widely stocked; bring your own prescriptions + a doctor's note for strong meds (some are restricted).", "Japan is very safe; the main hazards are natural (see §11)."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Money", x2, yr, blue);
    yr = bullets(p, ["Currency: the yen (¥ / JPY) — ≈ ¥165 = €1 (indicative, re-check).", "Cash still matters; carry some, especially for small shops, shrines & rural areas.", "Cards & IC cards are increasingly accepted in cities.", "For cash, use 7-Eleven or Japan Post ATMs — they take foreign cards.", "No tipping — it isn't customary and can confuse."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Connectivity", x2, yr, ochre);
    yr = bullets(p, ["Rent a pocket Wi-Fi or load an eSIM/SIM at the airport.", "Coverage is superb nationwide; free Wi-Fi at stations & konbini.", "Google Maps works brilliantly for trains door-to-door."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Documents", "Register on 'Visit Japan Web' before you land — the QR codes for immigration and customs turn a long queue into a quick scan.");
}
function packing() {
  pageW("03", "Before you go", "What to pack", sage, (p, y0) => {
    let y = para(p, "You'll walk a great deal and take your shoes off often — pack light, comfortable and layered. Coin-laundry is everywhere, so a week's clothes is plenty.", M, y0, CW, { leading: 14 }) - 8;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Clothing", M, top, terra); yl = bullets(p, ["Very comfortable walking shoes (slip-on saves time)", "Layers for changeable weather & strong A/C", "Neat-casual for nicer restaurants", "Modest cover for temples & shrines", "Season-specific: warm layers (winter), light & breathable (summer)", "A compact umbrella (sold everywhere too)"], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Essentials", x2, top, sage); yr = bullets(p, ["Clean, hole-free socks (you'll show them often!)", "A coin purse — you'll accumulate ¥ coins fast", "Power adapter (Type A/B, 100V) + power bank", "Small towel/handkerchief (many toilets lack dryers)", "Any prescriptions + doctor's note", "A foldable bag for shopping"], x2, yr, colW, { accent: sage });
    let yy = Math.min(yl, yr) - 12;
    yy = subhead(p, "Smart to have", M, yy, blue);
    yy = bullets(p, ["An IC-card-ready phone (mobile Suica) or a physical IC card", "Cash + a card that works at 7-Eleven ATMs", "Offline maps & a translation app", "Hand sanitiser & a few masks (still common indoors)"], M, yy, CW, { accent: blue });
    return yy;
  }, "Packing", "Slip-on shoes are a genuine hack: you remove them at temples, ryokan, some restaurants and homes — laces get old fast.", (pp, cx, cy) => { torii(pp, cx, cy - 18, 22, sage, 1); });
}
function budget() {
  pageW("04", "Budget", "What Japan costs", terra, (p, y0) => {
    let y = para(p, "Japan has a reputation for being expensive — but a weak yen and legendary konbini and set-lunch culture make it far gentler than most expect. Here's what to expect per person, per day, on the ground.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Style", w: CW * 0.18 }, { h: "Per day", w: CW * 0.22 }, { h: "What it looks like", w: CW * 0.6 }], [["Budget", "¥8,000–12,000", "Hostels/capsules, konbini & set lunches, local trains, IC card"], ["Comfort", "¥18,000–30,000", "Business hotels & the odd ryokan, restaurants, some bullet trains"], ["Luxury", "¥45,000+", "Ryokan & design hotels, kaiseki, reserved seats, guides"]], { rowH: 26, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Sample 10-day comfort budget", M, top, sage);
    let yl2 = table(p, M, yl, [{ h: "Item", w: colW * 0.62 }, { h: "≈ ¥", w: colW * 0.38 }], [["Accommodation (9 nights)", "120,000"], ["Food & drink", "70,000"], ["Trains & 1 rail pass/tickets", "55,000"], ["Activities & entries", "30,000"], ["IC card, extras, buffer", "25,000"]], { rowH: 18, fontSize: 9, headerColor: sage });
    text(p, "≈ ¥300,000  ·  about €1,800 / £1,550 / $1,950", M, yl2 - 4, { size: 9.5, font: SB, color: terra });
    let yr = subhead(p, "Prices to anchor on", x2, top, blue);
    yr = bullets(p, ["Konbini meal: ¥400–700", "Ramen / set lunch: ¥800–1,200", "Mid restaurant dinner: ¥2,000–4,000", "Coffee: ¥400–600", "Beer: ¥400–700", "Metro ride: ¥180–320", "Tokyo–Kyoto bullet train: ¥14,000", "Temple/museum entry: ¥300–1,000", "Onsen day bath: ¥500–1,500", "Business hotel double: ¥10,000–16,000"], x2, yr, colW, { accent: blue, gap: 2 });
    colRule(p, top, yl2 - 18, yr); return Math.min(yl2 - 18, yr);
  }, "Budget", "The set lunch (teishoku) is Japan's great value: the same kitchen that charges ¥6,000 at dinner often serves a beautiful ¥1,200 tray at noon.");
}
function regionsMap() {
  pageW("05", "Destinations", "The lie of the land", blue, (p, y0) => {
    let y = para(p, "Japan is a long archipelago of four main islands. Most first trips focus on Honshu's 'Golden Route'; go deeper by adding one region.", M, y0, CW * 0.5, { leading: 14 }) - 8;
    for (const [n, a, d] of [["Kanto & Tokyo", terra, "The mega-capital and its day trips: Nikko, Kamakura, Hakone & Mt Fuji."], ["Kansai", blue, "The cultural heart: Kyoto's temples, Osaka's food, Nara's deer, Himeji's castle."], ["Chubu & the Alps", sage, "Takayama, Shirakawa-go, Kanazawa and the mountains between."], ["The far ends", ochre, "Snowy Hokkaido, southern Kyushu, and tropical Okinawa."]]) { p.drawRectangle({ x: M, y: y - 22, width: 3, height: 34, color: a }); text(p, n, M + 12, y, { size: 12, font: SB, color: ink }); y = para(p, d, M + 12, y - 14, CW * 0.5 - 12, { size: 9.3, leading: 12.5 }) - 9; }
    encadre(p, M, y - 2, CW * 0.5, "Insider tip", "Each region has its own colour on the map opposite. First visit? Ride the Golden Route (Tokyo–Kyoto–Osaka) and add just one: the Alps, Hiroshima or Hokkaido.");
    const nodes = [
      { key: "sap", name: "Sapporo", x: 0.62, y: 0.97, big: true, c: sage }, { key: "sen", name: "Sendai", x: 0.6, y: 0.78, c: terra },
      { key: "tok", name: "Tokyo", x: 0.66, y: 0.62, big: true, c: terra }, { key: "hak", name: "Hakone/Fuji", x: 0.58, y: 0.55, lx: -78, c: terra }, { key: "kan", name: "Kanazawa", x: 0.44, y: 0.66, lx: -66, c: sage }, { key: "tak", name: "Alps", x: 0.5, y: 0.6, lx: 6, c: sage },
      { key: "kyo", name: "Kyoto", x: 0.44, y: 0.5, lx: -46, c: blue }, { key: "osa", name: "Osaka", x: 0.42, y: 0.44, lx: -44, c: blue }, { key: "nar", name: "Nara", x: 0.47, y: 0.44, c: blue },
      { key: "hir", name: "Hiroshima", x: 0.28, y: 0.4, lx: -70, c: ochre }, { key: "fuk", name: "Fukuoka", x: 0.16, y: 0.33, lx: -6, ly: 8, c: ochre }, { key: "oki", name: "Okinawa", x: 0.1, y: 0.08, c: ochre },
    ];
    const routes = [
      { color: terra, keys: ["sen", "tok", "hak"] },
      { color: blue, keys: ["kyo", "nar", "osa"] },
      { color: sage, keys: ["kan", "tak"] },
      { color: ochre, keys: ["hir", "fuk"] },
    ];
    drawMap(p, M + CW * 0.56, 116, CW * 0.42, H - M - 106 - 116, nodes, routes);
    text(p, "Schematic — not to scale", M + CW * 0.56, 98, { size: 7.5, font: SI, color: sub });
    return 0;
  }, "Regions");
}
function regionsCompare() {
  pageW("09", "Destinations", "Which base for you?", ochre, (p, y0) => {
    let y = para(p, "You can't see it all — and you shouldn't try. Here's how the great bases compare, so you can match the trip to your mood.", M, y0, CW, { leading: 14 }) - 8;
    const cols = [{ h: "Base", w: CW * 0.18 }, { h: "Vibe", w: CW * 0.4 }, { h: "Best for", w: CW * 0.42 }];
    y = table(p, M, y, cols, [
      ["Tokyo", "Electric, endless, hyper-modern", "First-timers, food, nightlife, day trips"],
      ["Kyoto", "Temples, gardens, geisha districts", "Culture, walking, slow mornings"],
      ["Osaka", "Brash, funny, food-obsessed", "Street food, nightlife, a Kansai base"],
      ["Kanazawa/Alps", "Craft towns & mountains", "Off the Golden Route, autumn/winter"],
      ["Hokkaido", "Big nature, seafood, powder snow", "Skiing, summer hiking, food"],
      ["Okinawa", "Subtropical beaches & reefs", "Sun, diving, a different Japan"],
    ], { rowH: 24, fontSize: 9.2 }) - 8;
    return encadre(p, M, y, CW, "Did you know?", "Tokyo and Kyoto are just 2h15 apart by bullet train — close enough that many travellers base in one and day-trip freely, luggage forwarded ahead by takkyubin courier.");
  }, "Which Base", "Can't choose? Tokyo plus Kyoto covers most first trips beautifully — the modern and the ancient, two hours apart by bullet train.");
}
function cultureHistory() {
  pageW("11", "Culture & heritage", "A short history & the arts", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "A timeline, in brief", M, y0, terra);
    for (const [a, b] of [["Nara & Heian, 8th–12th c.", "The imperial court, the first capitals, and 'The Tale of Genji'."], ["Samurai era, 12th–19th c.", "Shogun rule from Kamakura to Edo; castles, tea, and Zen."], ["Edo, 1603–1868", "Two centuries of peace & isolation; ukiyo-e, kabuki, sushi."], ["Meiji, 1868", "Rapid modernisation opens Japan to the world."], ["Post-war to now", "From reconstruction to a global capital of design, food & pop culture."]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 3;
    yl -= 4; yl = encadre(p, M, yl, colW, "Did you know?", "Temples (o-tera) are Buddhist; shrines (jinja) are Shinto — and most Japanese happily visit both. Look for a torii gate: it marks a shrine.");
    let yr = subhead(p, "Heritage to seek out", x2, y0, sage);
    yr = bullets(p, ["Kyoto & Nara's temples, gardens & Great Buddha.", "Himeji — the white 'egret' castle.", "Hiroshima's Peace Memorial & Miyajima's floating torii.", "Shirakawa-go's thatched farmhouses (UNESCO).", "Nikko's lavish shrines in the cedars."], x2, yr, colW, { accent: sage }) - 6;
    yr = subhead(p, "The living arts", x2, yr, blue);
    yr = bullets(p, ["Ceramics, lacquer, knives, washi paper, indigo.", "Ukiyo-e prints & the world's finest stationery.", "Anime, design & architecture (Ando, SANAA).", "Tea ceremony, ikebana & the craft of hospitality."], x2, yr, colW, { accent: blue });
    return Math.min(yl, yr);
  }, "Culture & History", "Pair a temple at dawn with a design museum at noon — Japan tells its story through both its shrines and its makers.");
}

// ---- Getting around (rail-led) ----
function railMap() {
  pageW("13", "Getting around", "The rail network", blue, (p, y0) => {
    let y = para(p, "Japan runs on rails. The shinkansen (bullet train) links the big cities at up to 320 km/h — punctual to the second — while dense local lines and metros do the rest. This map shows the main high-speed spine.", M, y0, CW * 0.56, { leading: 14 }) - 6;
    const bx = M, by = 88, bw = CW * 0.56, bh = y - 88 - 8;
    const N = { sap: [0.7, 0.96], sen: [0.66, 0.72], tok: [0.72, 0.52], nag: [0.5, 0.6], kan: [0.34, 0.66], kyo: [0.44, 0.44], osa: [0.4, 0.38], hir: [0.22, 0.3], fuk: [0.1, 0.2] };
    const px = (k) => bx + N[k][0] * bw, py = (k) => by + N[k][1] * bh;
    const edge = (a, b, color, dash) => p.drawLine({ start: { x: px(a), y: py(a) }, end: { x: px(b), y: py(b) }, thickness: 1.4, color, ...(dash ? { dashArray: dash } : {}) });
    for (const [a, b] of [["fuk", "hir"], ["hir", "osa"], ["osa", "kyo"], ["kyo", "tok"], ["tok", "sen"], ["sen", "sap"]]) edge(a, b, terra); // Tokaido/Sanyo + Tohoku/Hokkaido
    for (const [a, b] of [["tok", "nag"], ["nag", "kan"]]) edge(a, b, blue, [4, 3]); // Hokuriku
    const names = { sap: "Sapporo", sen: "Sendai", tok: "Tokyo", nag: "Nagano", kan: "Kanazawa", kyo: "Kyoto", osa: "Osaka", hir: "Hiroshima", fuk: "Fukuoka" };
    for (const k of Object.keys(N)) { const big = k === "tok"; p.drawCircle({ x: px(k), y: py(k), size: big ? 4.5 : 3, color: big ? terra : ink }); text(p, names[k], px(k) + 7, py(k) - 3, { size: big ? 9 : 8, font: big ? NB : SN, color: ink }); }
    const x2 = M + CW * 0.6, colW = CW * 0.4;
    let yr = subhead(p, "Legend", x2, y0 - 4, terra);
    for (const [c, dash, lab] of [[terra, null, "Tokaido–Sanyo & Tohoku shinkansen"], [blue, [4, 3], "Hokuriku shinkansen"], [sage, [1.4, 3], "Local JR & metro (everywhere)"]]) { p.drawLine({ start: { x: x2, y: yr + 3 }, end: { x: x2 + 22, y: yr + 3 }, thickness: 1.4, color: c, ...(dash ? { dashArray: dash } : {}) }); text(p, lab, x2 + 30, yr, { size: 8.6, font: SF, color: sub }); yr -= 16; }
    yr -= 6; yr = subhead(p, "Rules of thumb", x2, yr, blue);
    yr = bullets(p, ["Tokyo–Kyoto: 2h15. Tokyo–Osaka: 2h30. Tokyo–Hiroshima: ~4h.", "Reserve a seat on busy days; non-reserved cars exist too.", "Google Maps gives exact platforms & connections.", "Stand in the marked spot — the doors stop exactly there.", "Forward luggage ahead (takkyubin) and travel light."], x2, yr, colW, { accent: blue });
    return 0;
  }, "Rail Map");
}
function transportModes() {
  pageW("14", "Getting around", "Getting around", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = y0;
    for (const [ic, c, t, d] of [[shinkansen, terra, "Shinkansen", "The bullet train — fast, frequent, uncannily punctual. Reserve seats in peak seasons; eat an ekiben (station bento) aboard."], [train, blue, "Local & rapid trains", "Dense JR and private lines reach almost everywhere; rapid/limited-express trains cover the gaps between bullet stops."]]) { ic(p, M + 14, yl - 6, 18, c, 1.1); text(p, t, M + 44, yl, { size: 12.5, font: SB, color: ink }); yl = para(p, d, M, yl - 18, colW, { size: 9.4, leading: 12.8 }) - 12; }
    let yr = y0;
    for (const [ic, c, t, d] of [[bus, sage, "Metro & buses", "City subways are the daily workhorse; buses matter in Kyoto and rural areas. Tap an IC card and go."], [plane, ochre, "Flights & ferries", "Cheap domestic flights (ANA, JAL, Peach) suit Hokkaido & Okinawa; ferries link smaller islands."]]) { ic(p, x2 + 14, yr - 6, 18, c, 1.1); text(p, t, x2 + 44, yr, { size: 12.5, font: SB, color: ink }); yr = para(p, d, x2, yr - 18, colW, { size: 9.4, leading: 12.8 }) - 12; }
    let y = Math.min(yl, yr) - 6; y = subhead(p, "In the city", M, y, terra);
    y = bullets(p, ["An IC card (Suica/Pasmo/ICOCA, or mobile Suica on your phone) taps you onto every train, metro, bus and konbini.", "Stand on the correct escalator side: left in Tokyo, right in Osaka.", "Trains fall silent — no phone calls; keep bags off seats.", "Cycling is a joy in Kyoto, Kanazawa and the countryside.", "Taxis are excellent but pricey; doors open automatically."], M, y, CW, { accent: terra });
    return y;
  }, "Getting Around", "Put Suica or Pasmo in your phone's wallet on day one — one tap then covers every train, bus, metro and konbini in the country.");
}
function railPasses() {
  pageW("15", "Getting around", "Passes & IC cards", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "The Japan Rail Pass", M, yl, terra);
    yl = bullets(p, ["A nationwide pass for unlimited JR trains, including most shinkansen.", "Its price rose sharply in Oct 2023 — it's now only worth it for long, fast-moving trips (do the maths first).", "For a Golden-Route loop, point-to-point tickets are often cheaper.", "Buy online or in Japan; activate when your travel days start."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Regional passes", M, yl, sage);
    yl = bullets(p, ["Often better value: JR-West Kansai/Hiroshima, JR-East, Hokkaido, Takayama–Hokuriku, and more.", "Match the pass to your route, not the other way round."], M, yl, colW, { accent: sage });
    yr = subhead(p, "IC cards — your daily key", x2, yr, blue);
    yr = bullets(p, ["Suica, Pasmo, ICOCA — rechargeable smart cards for trains, metros, buses, lockers and konbini.", "Simplest of all: add Suica/Pasmo to your phone's wallet (mobile Suica).", "'Welcome Suica' and mobile options cover any temporary card-supply limits — re-check availability.", "Top up with cash at any machine; tap in and out."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "Reserving & apps", x2, yr, ochre);
    yr = bullets(p, ["Reserve shinkansen seats free with a pass, or via app/machine.", "Google Maps for routing; Japan Travel by Navitime for rail detail.", "Green cars = first class; worth it on long legs."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Passes", "Before buying any pass, add up your actual point-to-point fares on a fare site. Since 2023 the JR Pass rarely pays off unless you're crossing the country.");
}
function accommodation() {
  pageW("16", "Where to stay", "Accommodation", sage, (p, y0) => {
    let y = para(p, "Japan's lodging is a highlight in itself — from a ¥3,000 capsule to a ryokan where dinner is a fourteen-course work of art. Book the big cities and blossom/foliage season well ahead.", M, y0, CW, { leading: 14 }) - 8;
    y = table(p, M, y, [{ h: "Type", w: CW * 0.24 }, { h: "≈ /night", w: CW * 0.22 }, { h: "Best for", w: CW * 0.54 }], [["Capsule / pod hotel", "¥3,000–6,000", "Solo, budget, a night by the station"], ["Business hotel", "¥8,000–16,000", "Clean, compact, reliable city base"], ["Ryokan (inn)", "¥15,000–50,000", "Tatami, onsen, kaiseki — do it once"], ["Machiya / design hotel", "¥18,000–40,000", "Character in Kyoto & the cities"], ["Hostel", "¥3,000–6,000", "Backpackers, meeting people"]], { rowH: 22, fontSize: 9.5 }) - 12;
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = subhead(p, "Where to base yourself", M, top, terra); yl = bullets(p, ["Tokyo: Shinjuku/Shibuya (buzz) or Ueno/Asakusa (old-town, value).", "Kyoto: near Kyoto Station or in Higashiyama for temples on foot.", "Osaka: Namba/Dotonbori for food & nightlife.", "Rural: a ryokan with onsen is worth a special night."], M, yl, colW, { accent: terra });
    let yr = subhead(p, "Ryokan know-how", x2, top, blue); yr = bullets(p, ["Shoes off at the entrance; wear the yukata robe.", "Dinner & breakfast are often included — and glorious.", "Futons are laid out on tatami while you dine.", "Onsen etiquette applies (see Activities).", "Book 'half-board' ryokan a few months ahead."], x2, yr, colW, { accent: blue });
    colRule(p, top, yl, yr); return Math.min(yl, yr);
  }, "Accommodation", "Spend one night in a ryokan with a private or public onsen — it's not just a bed but the single most Japanese experience you can book.", (pp, cx, cy) => { pagoda(pp, cx, cy - 24, 16, sage, 1); });
}
function eating() {
  pageW("17", "Food & drink", "How to eat in Japan", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "How it works", M, yl);
    yl = bullets(p, ["Specialists rule: a shop does sushi, or ramen, or tempura — brilliantly.", "Many places have ticket machines: buy at the machine, hand the stub to the cook.", "Set lunches (teishoku) are superb value.", "Konbini (7-Eleven, Lawson, FamilyMart) food is genuinely good.", "Depachika — department-store food halls — are a wonderland."], M, yl, colW, { accent: ochre }) - 4;
    yl = subhead(p, "Table manners", M, yl, terra);
    yl = bullets(p, ["Slurping noodles is fine — even polite.", "Never stick chopsticks upright in rice, or pass food chopstick-to-chopstick (funeral rites).", "Say 'itadakimasu' before, 'gochisousama' after.", "No tipping — pay at the till, often on a small tray."], M, yl, colW, { accent: terra });
    yr = subhead(p, "Dietary needs", x2, yr, sage);
    yr = bullets(p, ["Vegetarian/vegan is growing but tricky — dashi (fish stock) hides in much. Learn 'bejitarian' and carry a card.", "Shojin ryori (Buddhist temple cuisine) is fully vegetarian.", "Halal & gluten-free options exist in big cities; ask ahead.", "Allergy cards in Japanese are invaluable."], x2, yr, colW, { accent: sage }) - 4;
    yr = subhead(p, "What to drink", x2, yr, blue);
    yr = bullets(p, ["Sake (nihonshu), shochu & superb whisky.", "Ice-cold beer; highballs in every izakaya.", "Matcha & sencha green tea; vending machines everywhere.", "'Kanpai!' — cheers — and pour for others, not yourself."], x2, yr, colW, { accent: blue });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Eating");
}
function dishes1() {
  pageW("18", "Food & drink", "What to order · the classics", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "The icons", M, y0, terra);
    for (const [a, b] of [["Sushi & sashimi", "at a counter, chef's choice (omakase) if you can"], ["Ramen", "shoyu, shio, miso or rich tonkotsu — slurp it hot"], ["Tempura", "feather-light battered seafood & vegetables"], ["Tonkatsu", "crisp breaded pork cutlet with shredded cabbage"], ["Udon & soba", "thick wheat vs nutty buckwheat noodles"], ["Unagi", "grilled eel glazed over rice — a summer treat"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "Comfort & share plates", x2, y0, blue);
    for (const [a, b] of [["Yakitori", "grilled skewers, the soul of the izakaya"], ["Okonomiyaki", "savoury cabbage pancake (Osaka & Hiroshima styles)"], ["Takoyaki", "molten octopus dumplings, Osaka street food"], ["Gyoza", "pan-fried dumplings"], ["Donburi", "rice bowls — gyudon, katsudon, oyakodon"], ["Kaiseki", "the multi-course seasonal tasting menu — a splurge"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    return Math.min(yl, yr);
  }, "Dishes I", "Sit at the counter whenever you can. Watching the chef work — and a quiet 'omakase' (I'll leave it to you) — turns a meal into a memory.", (pp, cx, cy) => { bowl(pp, cx, cy - 14, 20, ochre, 1); });
}
function dishes2() {
  pageW("18", "Food & drink", "What to order · regions & sweets", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Regional specialities", M, y0, sage);
    for (const [a, b] of [["Osaka", "takoyaki, okonomiyaki, kushikatsu — 'kuidaore' (eat till you drop)"], ["Kyoto", "kaiseki, yudofu (tofu), matcha sweets, pickles"], ["Hiroshima", "its own layered okonomiyaki with noodles"], ["Fukuoka", "tonkotsu ramen & yatai street stalls"], ["Hokkaido", "seafood, crab, dairy, soup curry, miso ramen"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 13.5 }) - 2;
    let yr = subhead(p, "Sweets & snacks", x2, y0, ochre);
    for (const [a, b] of [["Wagashi", "delicate seasonal confections with matcha"], ["Mochi & dango", "chewy rice cakes, sweet or grilled"], ["Taiyaki", "fish-shaped cakes filled with red bean"], ["Matcha soft-serve", "everywhere, and worth it"], ["Konbini sweets", "surprisingly excellent — try the pudding"], ["Kit-Kats", "wild regional flavours — great gifts"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 13.5 }) - 2;
    let y = Math.min(yl, yr) - 12; y = subhead(p, "Market & hall wisdom", M, y, blue);
    y = bullets(p, ["Nishiki Market (Kyoto), Kuromon (Osaka), Toyosu (Tokyo, for tuna).", "Depachika food halls at closing time discount beautiful bento.", "Follow the queue — the Japanese line up only for the very good."], M, y, CW, { accent: blue });
    return y;
  }, "Dishes II", "Follow the queue. The Japanese line up only for the genuinely excellent, so a long, orderly line is the surest recommendation there is.");
}
function shopping() {
  pageW("12", "Take a little home", "Shopping & craft", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Where to shop", M, yl, terra);
    yl = bullets(p, ["Depachika food halls & department stores.", "100-yen shops (Daiso) & Don Quijote for everything.", "Konbini — snacks, socks, brilliant stationery.", "Akihabara (Tokyo) for electronics & anime; Nakamise (Asakusa) for souvenirs.", "Craft streets in Kyoto & Kanazawa."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Worth carrying home", M, yl, sage);
    yl = bullets(p, ["Ceramics, lacquer, a good kitchen knife.", "Washi paper, tenugui cloths, incense.", "Matcha, sencha & beautiful sweets.", "Stationery — the world's best."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Buy smart", x2, yr, blue);
    yr = bullets(p, ["Tax-free: show your passport, spend ¥5,000+ at participating shops.", "Fixed prices — no haggling (it's not the culture).", "Prices are honest; quality is high; fakes are rare.", "Check voltage (100V) & region-locking on electronics."], x2, yr, colW, { accent: blue }) - 6;
    yr = encadre(p, x2, yr, colW, "Insider tip", "Omiyage — edible souvenirs, beautifully boxed — are a national ritual. A box of regional sweets is the perfect, expected gift to bring home.");
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Shopping", "Spend ¥5,000+ at a tax-free shop with your passport to hand — the duty-free saving adds up fast across a trip.");
}
function activities() {
  pageW("19", "Experiences", "Things to do", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Culture & calm", M, yl, terra);
    yl = bullets(p, ["Temple-and-shrine hop; catch one at opening, empty and still.", "A tea ceremony, or Zen meditation (zazen).", "Kabuki or sumo (seasonal tournaments).", "teamLab digital-art museums (Tokyo).", "Hanami (blossom) or koyo (autumn leaves) picnics."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Onsen — how to bathe", M, yl, sage);
    yl = bullets(p, ["Wash and rinse thoroughly at the seated showers first.", "Bathe naked; no swimwear; tie long hair up.", "Small towel out of the water; keep quiet.", "Tattoos may be restricted — seek tattoo-friendly or private (kashikiri) baths."], M, yl, colW, { accent: sage });
    yr = subhead(p, "Nature & seasons", x2, yr, blue);
    yr = bullets(p, ["Climb (or admire) Mt Fuji; hike the Kumano Kodo pilgrim trails.", "Ski or snowboard Hokkaido & Nagano's famous powder.", "The Japanese Alps: Kamikochi, Takayama, Shirakawa-go.", "Cycle the Shimanami Kaido island bridges."], x2, yr, colW, { accent: blue }) - 4;
    yr = subhead(p, "City thrills", x2, yr, ochre);
    yr = bullets(p, ["Shibuya Crossing & a golden-hour skyline bar.", "An izakaya crawl down a lantern-lit alley (yokocho).", "Karaoke, a baseball game, a robot-era arcade.", "Day trips: Nikko, Kamakura, Nara, Hakone."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Activities", "Book the big-ticket experiences — a sumo tournament, teamLab, a kaiseki dinner — before you fly; the best ones sell out weeks ahead.");
}
function culture() {
  pageW("20", "Practical tips", "Culture & etiquette", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Do", M, yl, sage);
    yl = bullets(p, ["Bow slightly in greeting and thanks.", "Take your shoes off where you see a step up (genkan) or slippers.", "Keep quiet on trains; no phone calls.", "Queue neatly; wait for people to exit first.", "Carry your rubbish — bins are rare — and sort it."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Don't", M, yl, terra);
    yl = bullets(p, ["Tip — it isn't done and can confuse.", "Eat or drink while walking (mostly frowned upon).", "Point with one finger, or blow your nose at the table.", "Be loud in temples, ryokan or trains.", "Stick chopsticks upright or pass food between them."], M, yl, colW, { accent: terra });
    yr = subhead(p, "The ideas behind it", x2, yr, blue);
    yr = para(p, "So much of Japan flows from consideration for others — 'meiwaku' (avoiding causing trouble), 'omotenashi' (whole-hearted hospitality) and 'wa' (harmony). You'll rarely be corrected; simply watching and matching the people around you is the whole etiquette in one move.", x2, yr, colW, { leading: 13.5 }) - 8;
    yr = subhead(p, "Temple vs shrine", x2, yr, ochre);
    yr = bullets(p, ["Shrine (Shinto): bow at the torii; rinse hands; two bows, two claps, one bow.", "Temple (Buddhist): quiet bow, no clapping; light incense.", "Photos: fine outside, often not inside halls."], x2, yr, colW, { accent: ochre });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Culture", "When unsure, simply watch and copy the person beside you — quiet observation is the whole of Japanese etiquette in one move.");
}
function safety() {
  pageW("21", "Practical tips", "Safety & staying well", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "One of the safest places on earth", M, yl, sage);
    yl = bullets(p, ["Violent crime is very rare; lost wallets are often returned.", "Solo and night travel are comfortable for most.", "Still: keep the usual sense in nightlife districts.", "Police boxes (koban) on many corners will help with directions."], M, yl, colW, { accent: sage }) - 4;
    yl = subhead(p, "Nature's hazards", M, yl, blue);
    yl = bullets(p, ["Earthquakes happen — if one hits, protect your head, stay put, follow staff.", "Typhoons (Aug–Oct) can disrupt trains & flights — watch forecasts.", "Summer heat & humidity are fierce; hydrate and pace yourself.", "Download the NHK World or Safety Tips alert app."], M, yl, colW, { accent: blue });
    yr = subhead(p, "Good to know", x2, yr, ochre);
    yr = bullets(p, ["Pharmacies are everywhere; convenience stores are 24/7.", "Coin lockers at stations swallow your bags for the day.", "Lost something? Ask staff — Japan's lost-and-found is legendary.", "Travel insurance still matters for medical costs & delays."], x2, yr, colW, { accent: ochre }) - 4;
    yr = subhead(p, "Emergency numbers", x2, yr, terra);
    yr = bullets(p, ["Police 110 · Fire & ambulance 119", "Japan Visitor Hotline (24/7, English): 050-3816-2787", "Your embassy for lost passports"], x2, yr, colW, { accent: terra });
    yr -= 6; yr = subhead(p, "Travel responsibly", x2, yr, sage);
    yr = bullets(p, ["Keep your voice down; don't block narrow lanes for photos.", "Never chase or touch geisha in Kyoto's Gion.", "Carry out litter; respect private streets & homes."], x2, yr, colW, { accent: sage });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Safety", "Lost something on a train? Ask staff — Japan's lost-and-found is so reliable that wallets and phones routinely find their way home.");
}
function travellers() {
  pageW("21", "Practical tips", "For every traveller", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16; let yl = y0, yr = y0;
    yl = subhead(p, "Solo & solo women", M, yl, terra);
    yl = bullets(p, ["Exceptionally safe and easy; night transport is fine.", "Women-only train cars run at rush hour on some lines.", "Counter dining is made for solo travellers."], M, yl, colW, { accent: terra }) - 4;
    yl = subhead(p, "Accessibility", M, yl, sage);
    yl = bullets(p, ["Excellent overall: lifts, tactile paving, accessible shinkansen & toilets.", "Older temples & some stations still have steps.", "Reserve accessible seats in advance; staff are very helpful."], M, yl, colW, { accent: sage });
    yr = subhead(p, "LGBTQ+", x2, yr, ochre);
    yr = bullets(p, ["Legal and generally safe; public displays are low-key.", "Lively scenes in Shinjuku Ni-chome (Tokyo) & Osaka.", "Same-sex marriage isn't yet national — check details for formalities."], x2, yr, colW, { accent: ochre }) - 4;
    yr = subhead(p, "Nomads & business", x2, yr, blue);
    yr = bullets(p, ["Superb Wi-Fi; pocket Wi-Fi & coworking widespread; a digital-nomad visa launched in 2024 (re-check terms).", "Business: exchange cards (meishi) with both hands & a bow; bring omiyage gifts; punctuality is sacred."], x2, yr, colW, { accent: blue });
    colRule(p, y0, yl, yr); return Math.min(yl, yr);
  }, "Travellers", "Whoever you are, Japan rewards the same approach: travel light, keep your voice low, and let the country's precision carry you.");
}
function phrasebook1() {
  pageW("22", "Useful expressions", "A Japanese phrasebook · I", blue, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Essentials", M, y0);
    for (const [a, b] of [["Hello", "konnichiwa"], ["Thank you", "arigatou (gozaimasu)"], ["Excuse me / sorry", "sumimasen"], ["Please", "onegaishimasu"], ["Yes / No", "hai / iie"], ["Do you speak English?", "eigo o hanasemasu ka?"], ["I don't understand", "wakarimasen"], ["Goodbye", "sayounara"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    yl -= 4; yl = subhead(p, "Numbers", M, yl, sage);
    yl = para(p, "1 ichi · 2 ni · 3 san · 4 yon/shi · 5 go · 6 roku · 7 nana/shichi · 8 hachi · 9 kyuu · 10 juu · 100 hyaku · 1,000 sen", M, yl, colW, { size: 9.5, leading: 14 });
    let yr = subhead(p, "Getting around", x2, y0, terra);
    for (const [a, b] of [["Where is…?", "…wa doko desu ka?"], ["How much?", "ikura desu ka?"], ["Station", "eki"], ["Ticket", "kippu"], ["This train to…?", "…ni ikimasu ka?"], ["Left / right", "hidari / migi"], ["Straight on", "massugu"], ["Toilet", "toire"], ["Entrance / exit", "iriguchi / deguchi"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook I", "You don't need much Japanese — but 'sumimasen' (excuse me / sorry / thank you) is a magic word that works in almost any situation.");
}
function phrasebook2() {
  pageW("22", "Useful expressions", "A Japanese phrasebook · II", ochre, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "At the table", M, y0, terra);
    for (const [a, b] of [["Before eating", "itadakimasu"], ["After a meal (thanks)", "gochisousama deshita"], ["Delicious!", "oishii!"], ["The bill, please", "o-kaikei onegaishimasu"], ["Water", "o-mizu"], ["I'm vegetarian", "bejitarian desu"], ["Cheers!", "kanpai!"], ["I'll leave it to you", "omakase de"]]) yl = entry(p, a, "— " + b, M, yl, colW, { size: 9.5, leading: 14.5 });
    let yr = subhead(p, "Small talk & shops", x2, y0, sage);
    for (const [a, b] of [["Good morning", "ohayou gozaimasu"], ["How are you?", "o-genki desu ka?"], ["It's beautiful", "kirei desu"], ["Can I take a photo?", "shashin ii desu ka?"], ["Tax-free?", "menzei dekimasu ka?"], ["Good luck / take care", "ki o tsukete"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    yr -= 4; yr = subhead(p, "Help", x2, yr, terra);
    for (const [a, b] of [["Help!", "tasukete!"], ["Hospital", "byouin"], ["Police", "keisatsu"], ["I'm lost", "michi ni mayoimashita"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14.5 });
    return Math.min(yl, yr);
  }, "Phrasebook II", "A little Japanese, offered with a bow, is met with real warmth. Don't worry about grammar — 'sumimasen', 'arigatou' and a smile carry you a long way.");
}
function resources() {
  pageW("23", "Before you leave the book", "Resources & a few words", sage, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Trusted & official", M, y0, terra);
    yl = bullets(p, ["Japan National Tourism Org — japan.travel", "Visit Japan Web (immigration/customs) — vjw-lp.digital.go.jp", "Japan Rail & fares — hyperdia / Google Maps / Navitime", "Weather & alerts — JMA; NHK World; Safety Tips app", "Tickets & tours — Klook / local sites", "Getting online — pocket Wi-Fi / eSIM providers"], M, yl, colW, { accent: terra }) - 6;
    yl = encadre(p, M, yl, colW, "Insider tip", "Save the Japan Visitor Hotline — 050-3816-2787, English, 24/7 — for anything from lost bags to medical help.");
    let yr = subhead(p, "A few words of Japanese", x2, y0, blue);
    for (const [a, b] of [["Hello", "konnichiwa"], ["Thank you", "arigatou gozaimasu"], ["Excuse me / sorry", "sumimasen"], ["Please", "onegaishimasu"], ["Delicious!", "oishii!"], ["How much?", "ikura desu ka?"], ["Where is…?", "…wa doko desu ka?"], ["Cheers!", "kanpai!"]]) yr = entry(p, a, "— " + b, x2, yr, colW, { size: 9.5, leading: 14 });
    yr -= 2; text(p, "A bow with your thanks is always welcome.", x2, yr, { size: 9, font: SI, color: sub });
    return Math.min(yl, yr);
  }, "Resources", "Bookmark the official sites before you fly — Japan's visa rules, rail-pass prices and park hours do change, and the source of truth beats a forum thread.");
}
function appendices() {
  pageW("24", "Appendices", "Before-you-go checklists", terra, (p, y0) => {
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16;
    let yl = subhead(p, "Before you go", M, y0, terra); let yy = yl;
    for (const it of ["Passport valid for your stay", "Check visa-free rule (up to 90 days)", "Travel insurance (medical + delays)", "Register on Visit Japan Web", "Flights & first/last night booked", "Decide on rail pass vs point-to-point", "Pocket Wi-Fi / eSIM arranged", "IC card plan (mobile Suica?)"]) { checkBoxLine(p, M, yy - 9, it, colW, terra); yy -= 22; }
    yy -= 6; let yl2 = subhead(p, "Day bag", M, yy, blue);
    for (const it of ["Coin purse + some cash", "IC card / phone wallet", "Small towel & hand sanitiser", "Umbrella; refillable bottle", "Portable charger"]) { checkBoxLine(p, M, yl2 - 9, it, colW, blue); yl2 -= 22; }
    let yr = subhead(p, "Packing", x2, y0, sage); let yry = yr;
    for (const it of ["Very comfortable walking shoes (slip-on)", "Neat-casual outfit for dinners", "Clean socks (shoes come off often)", "Layers + compact umbrella", "Season gear (warm / breathable)", "Type A/B adapter + power bank", "Prescriptions + doctor's note", "Foldable shopping bag"]) { checkBoxLine(p, x2, yry - 9, it, colW, sage); yry -= 22; }
    yry -= 6; let yr2 = subhead(p, "Documents", x2, yry, ochre);
    for (const it of ["Passport + copies", "Insurance details", "Booking confirmations", "Rail pass voucher (if bought)", "Allergy/dietary card in Japanese"]) { checkBoxLine(p, x2, yr2 - 9, it, colW, ochre); yr2 -= 22; }
    return Math.min(yl2, yr2);
  }, "Appendices", "Screenshot this page to your phone — with Japan's queues and precise platforms, a quick pre-flight check saves real time.");
}
function closing() {
  pageW("", "One last thing", "Go slowly, see deeply", sage, (p, y0) => {
    let y = para(p, "If there's one idea to carry into Japan, it's restraint. The travellers who fall hardest for this country are the ones who resist the checklist — who spend a whole morning in one temple garden, who return three nights to the same tiny counter until the chef nods hello, who let the local train rock them past rice fields with nowhere particular to be.", M, y0, CW, { leading: 15.5 }) - 8;
    y = para(p, "Bow a little. Learn ten words. Follow the quiet rules. Japan will meet your care with a courtesy that stays with you for years.", M, y, CW, { leading: 15.5 }) - 16;
    y = subhead(p, "A few good resources", M, y, terra);
    const colW = CW / 2 - 16, x2 = M + CW / 2 + 16, top = y;
    let yl = bullets(p, ["Japan National Tourism Org — japan.travel", "Visit Japan Web — for immigration & customs", "Google Maps & Navitime — for the rails"], M, top, colW, { accent: terra });
    let yr = bullets(p, ["A fare calculator — before any rail pass", "Mobile Suica / IC card — for daily travel", "Your travel insurer's 24-hour line"], x2, top, colW, { accent: sage });
    return Math.min(yl, yr);
  }, "Go Slowly", "Leave one day completely unplanned in a single neighbourhood. In Japan, the aimless wander down one back-street is where the magic hides.", (pp, cx, cy) => { lantern(pp, cx, cy - 12, 20, terra, 1); });
}
function back() {
  const p = newPage(); const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  torii(p, W / 2, H / 2 + 30, 60, ink, 1);
  center(p, "Ki o tsukete", H / 2 - 30, { size: 40, font: D, color: ink });
  center(p, "Take care, and travel gently.", H / 2 - 64, { size: 13, font: SI, color: sub });
  sceneBand(p, 150);
  trackedCenter(p, "THE SLOW ATLAS  ·  RENNES, FRANCE", 96, { size: 8, font: NB, color: terra, tracking: 3 });
}

// ---- itinerary data ----
const goldenItin = ["7 days · The Golden Route", terra, "The classic first trip: Tokyo, the Fuji foothills, and old Kyoto & Osaka, linked by bullet train. Fly into Tokyo, out of Osaka (Kansai).",
  [{ key: "tok", name: "Tokyo", x: 0.72, y: 0.7, big: true, lx: 9 }, { key: "hak", name: "Hakone", x: 0.6, y: 0.52, lx: -60 }, { key: "kyo", name: "Kyoto", x: 0.42, y: 0.4, big: true, lx: 9 }, { key: "nar", name: "Nara", x: 0.5, y: 0.28 }, { key: "osa", name: "Osaka", x: 0.36, y: 0.24, big: true, lx: -46 }],
  ["tok", "hak", "kyo", "nar", "osa"],
  [["D1–3", "Tokyo", "Asakusa & Senso-ji, Meiji Shrine, Shibuya, teamLab and a day's wander; eat everywhere."], ["D4", "Hakone", "Onsen and Mt Fuji views; a ryokan night if you can."], ["D5–6", "Kyoto", "Fushimi Inari at dawn, Arashiyama bamboo, Gion; day-trip to Nara's deer & Great Buddha."], ["D7", "Osaka", "Dotonbori neon and street food before flying out of Kansai."]],
  "Add 2–3 days and Hiroshima + Miyajima's floating torii for the 10-day version."];
const classicItin = ["10 days · Classic Japan", blue, "The Golden Route plus Hiroshima & Miyajima — the fullest first-timer's loop, all by rail.",
  [{ key: "tok", name: "Tokyo", x: 0.74, y: 0.72, big: true, lx: 9 }, { key: "hak", name: "Hakone", x: 0.62, y: 0.56, lx: -60 }, { key: "kyo", name: "Kyoto", x: 0.44, y: 0.44, big: true, lx: 9 }, { key: "osa", name: "Osaka", x: 0.38, y: 0.34, big: true, lx: -46 }, { key: "hir", name: "Hiroshima", x: 0.2, y: 0.2, big: true, lx: 9 }],
  ["tok", "hak", "kyo", "osa", "hir"],
  [["D1–3", "Tokyo", "The capital in full, plus a day trip (Nikko or Kamakura)."], ["D4", "Hakone", "Fuji, onsen, open-air art."], ["D5–7", "Kyoto & Nara", "Temples, gardens, Gion; Nara's deer and Todai-ji."], ["D8", "Osaka", "Food, castle, Kuromon market."], ["D9–10", "Hiroshima & Miyajima", "The Peace Park and the floating torii, then home."]],
  "Swap Hiroshima for the Japanese Alps (Takayama & Shirakawa-go) if mountains call more than history."];
const grandItin = ["14 days · The grand tour", sage, "Two weeks to go deeper: the classics plus the craft towns and mountains of the Chubu region.",
  [{ key: "tok", name: "Tokyo", x: 0.74, y: 0.74, big: true, lx: 9 }, { key: "kan", name: "Kanazawa", x: 0.44, y: 0.6, big: true, lx: -66 }, { key: "tak", name: "Takayama", x: 0.56, y: 0.52, lx: 9 }, { key: "kyo", name: "Kyoto", x: 0.44, y: 0.42, big: true, lx: -46 }, { key: "osa", name: "Osaka", x: 0.4, y: 0.3, big: true, lx: -46 }, { key: "hir", name: "Hiroshima", x: 0.22, y: 0.18, lx: 9 }],
  ["tok", "kan", "tak", "kyo", "osa", "hir"],
  [["D1–4", "Tokyo", "The capital, unhurried, with two day trips."], ["D5–6", "Kanazawa", "Kenroku-en garden, geisha & samurai districts, gold-leaf craft."], ["D7–8", "Takayama & Shirakawa-go", "Old-town mornings and thatched-roof villages in the Alps."], ["D9–11", "Kyoto & Nara", "Temples at dawn, tea, and the deer park."], ["D12–13", "Osaka & Hiroshima", "Food, then the Peace Park and Miyajima."], ["D14", "Home", "One last bowl before the airport."]],
  "Travelling in winter? Swap the Alps for Hokkaido's snow and seafood, linked by a short flight."];
const offbeatItin = ["10 days · Off the beaten track", ochre, "The Japan beyond the headline sights: mountain trails, craft towns, hot springs and the slow north-west.",
  [{ key: "tok", name: "Tokyo", x: 0.74, y: 0.78, big: true, lx: 9 }, { key: "kan", name: "Kanazawa", x: 0.44, y: 0.62, big: true, lx: -66 }, { key: "tak", name: "Takayama", x: 0.58, y: 0.5, lx: 9 }, { key: "kii", name: "Kumano Kodo", x: 0.5, y: 0.24, lx: 9 }, { key: "kyo", name: "Kyoto", x: 0.42, y: 0.36, big: true, lx: -46 }],
  ["tok", "kan", "tak", "kyo", "kii"],
  [["D1–2", "Tokyo & west", "Ease out of the capital toward the mountains."], ["D3–4", "Kanazawa", "Gardens, craft and superb seafood, minus the crowds."], ["D5–6", "Takayama & Shirakawa-go", "Sake breweries, morning markets, thatched villages."], ["D7–8", "Kyoto (quiet side)", "Northern temples, Ohara, an evening in a machiya."], ["D9–10", "Kumano Kodo", "Walk a stretch of the ancient pilgrim trail; onsen at Yunomine."]],
  "Prefer the sea? Swap Kumano for the Setouchi art islands (Naoshima & Teshima)."];

async function buildDoc([w, h]) {
  doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Japan: The Complete Guide"); doc.setAuthor("The Slow Atlas");
  doc.setSubject("A complete illustrated travel guide to Japan"); doc.setKeywords(["japan", "travel guide", "ebook", "itinerary", "tokyo", "kyoto"]);
  W = w; H = h; M = 50; CW = W - M * 2; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true }); SF = await doc.embedFont(fb.serif, { subset: true }); SB = await doc.embedFont(fb.serifB, { subset: true });
  SI = await doc.embedFont(fb.serifI, { subset: true }); SN = await doc.embedFont(fb.sans, { subset: true }); NB = await doc.embedFont(fb.sansB, { subset: true });

  cover(); intro();
  divider("I", "Part One", "Before you go", "Timing, paperwork and packing — sorted.", ["When to go & festivals", "Documents, health & money", "What to pack"], (p, cx, cy, c) => { fuji(p, cx, cy - 24, 300, 78, c, 1); torii(p, cx - 130, cy - 24, 40, c, 1); sakura(p, cx + 120, cy + 20, 20, c, 1); }, ochre);
  whenToGo(); documents(); packing();
  divider("II", "Part Two", "Budget", "What it really costs — and how it's gentler than you think.", ["Daily budgets, low to lavish", "A sample ten-day spend", "Prices to anchor on"], (p, cx, cy, c) => { lantern(p, cx - 70, cy - 6, 26, c, 1); lantern(p, cx, cy + 10, 32, c, 1); lantern(p, cx + 72, cy - 8, 24, c, 1); }, terra);
  budget();
  divider("III", "Part Three", "Destinations", "The unmissable places, region by region.", ["The lie of the land", "Tokyo · Kyoto · Osaka", "Which base is for you?", "A short history & the arts"], (p, cx, cy, c) => { fuji(p, cx, cy - 24, 320, 84, c, 1); pagoda(p, cx - 150, cy - 24, 22, c, 1); torii(p, cx + 130, cy - 24, 40, c, 1); }, blue);
  regionsMap();
  destination("06", "Tokyo", terra, "The world's greatest city hides in plain sight: a hundred villages stitched together, each with its own temples, food and mood. Give it three or four days and it never stops giving.",
    ["Senso-ji temple & old Asakusa", "Meiji Shrine and the youth theatre of Harajuku", "Shibuya Crossing and a skyline bar at dusk", "teamLab's immersive digital-art worlds", "Toyosu tuna auction & a sushi breakfast"],
    ["It's a rail city — get an IC card and ride.", "Neighbourhoods are the unit: pick one per half-day.", "Superb day trips: Nikko, Kamakura, Hakone.", "Base in Shinjuku/Shibuya (buzz) or Asakusa (value)."],
    ["Sushi, ramen, tempura, tonkatsu — all world-class", "An izakaya crawl down a lantern-lit yokocho", "Depachika food halls under the big stores", "The best coffee and pastry in Asia"],
    ["Two airports (Narita & Haneda); trains into town.", "JR Yamanote loop + metro cover everything.", "Walk — Tokyo is a city best read on foot.", "The bullet-train hub for the whole country."],
    "Tokyo", "Base in one area per half-day — Tokyo is really a hundred villages, and dashing between them is how you miss it.");
  destination("07", "Kyoto & Nara", sage, "A thousand years of capital: 1,600 temples, raked-gravel gardens, geisha districts and tea. Kyoto rewards early starts and slow afternoons — and Nara's deer park is a half-hour away.",
    ["Fushimi Inari's tunnels of vermilion torii (go at dawn)", "Kinkaku-ji, the Golden Pavilion", "Arashiyama's bamboo grove & monkey park", "Gion & Higashiyama's lantern lanes", "Nara — bowing deer & the Great Buddha of Todai-ji"],
    ["Temples open early — beat the crowds and heat.", "Cycle or bus; buy a day pass in Kyoto.", "Autumn & blossom seasons are magical but packed.", "Save an evening for a quiet machiya dinner."],
    ["Kaiseki, yudofu (tofu), matcha sweets & pickles", "Nishiki Market for tastes and knives", "Kyo-ryori — refined Kyoto cuisine", "A tea house for matcha and wagashi"],
    ["2h15 from Tokyo by bullet train.", "Nara: 45 min by local train.", "Compact centre; bikes are a joy here.", "A perfect base for all of Kansai."],
    "Kyoto & Nara", "Kyoto's temples open early and empty; a 7am start at Fushimi Inari or the bamboo grove is a different, quieter country.");
  destination("08", "Osaka & Kansai", ochre, "Japan's kitchen and its funniest city: brash, warm and food-obsessed, with a castle, a market and neon-drenched canals. A great-value base for the whole Kansai region.",
    ["Dotonbori's neon, canal & giant signs", "Osaka Castle and its park", "Kuromon Ichiba market", "Kushikatsu & takoyaki in Shinsekai", "Day trips: Himeji Castle, Kobe, Koyasan"],
    ["'Kuidaore' — eat till you drop — is the local motto.", "Cheaper hotels than Kyoto, 15 min away.", "Stand right on escalators here (opposite to Tokyo).", "Great late-night city."],
    ["Takoyaki, okonomiyaki, kushikatsu — the holy trinity", "Kuromon market for seafood & fruit", "Michelin sushi to counter dives", "Highballs and yakitori under the tracks"],
    ["Kansai Airport (KIX) is the region's gateway.", "20 min from Kyoto; 15 from Nara.", "Dense metro; IC card for everything.", "Bullet-train links west to Hiroshima."],
    "Osaka & Kansai", "Base in Osaka to save on hotels and eat late — Kyoto and Nara are both a short train ride away.");
  destination("10", "Hiroshima, the Alps & beyond", blue, "Past the Golden Route lies a quieter, deeply rewarding Japan — moving history, craft towns, thatched villages and big northern nature.",
    ["Hiroshima's Peace Memorial Park & Museum", "Miyajima's 'floating' torii at high tide", "Kanazawa — Kenroku-en garden & gold-leaf craft", "Takayama & Shirakawa-go's thatched farmhouses", "Hokkaido's powder snow, seafood & wide-open north"],
    ["Hiroshima: 1h40 from Osaka by bullet train.", "The Alps reward autumn colour & winter snow.", "Hokkaido & Okinawa are quick by domestic flight.", "Regional rail passes shine out here."],
    ["Hiroshima-style okonomiyaki with noodles", "Kanazawa's superb sushi & gold-leaf ice cream", "Hida beef in Takayama", "Hokkaido crab, dairy & miso ramen"],
    ["All reachable by shinkansen or a short flight.", "Buses reach Shirakawa-go & trailheads.", "Ferries to Miyajima & the art islands.", "Consider a car for rural Hokkaido."],
    "Beyond the Golden Route", "One region beyond the Golden Route transforms a trip — pick the Alps, Hiroshima or Hokkaido and give it three unhurried days.");
  regionsCompare();
  cultureHistory();
  divider("IV", "Part Four", "Ready-to-use itineraries", "Four trips, planned for you — adapt and go.", ["7 days · the Golden Route", "10 days · classic Japan", "14 days · the grand tour", "10 days · off the beaten track"], (p, cx, cy, c) => { fuji(p, cx, cy - 24, 300, 78, c, 1); shinkansen(p, cx, cy - 30, 22, c, 1); torii(p, cx - 130, cy - 24, 38, c, 1); }, terra);
  itinerary("11", ...goldenItin); itinerary("12", ...classicItin); itinerary("13", ...grandItin); itinerary("14", ...offbeatItin);
  divider("V", "Part Five", "Getting around", "How the country joins up — the world's best trains.", ["The rail network map", "Shinkansen, metros & more", "Passes & IC cards"], (p, cx, cy, c) => { shinkansen(p, cx, cy + 4, 34, c, 1); torii(p, cx + 100, cy - 16, 34, c, 1); pagoda(p, cx - 100, cy - 20, 18, c, 1); }, sage);
  railMap(); transportModes(); railPasses();
  divider("VI", "Part Six", "Where to stay & what to eat", "From capsules to kaiseki.", ["Accommodation & ryokan", "How to eat in Japan", "What to order, region by region"], (p, cx, cy, c) => { pagoda(p, cx - 70, cy - 20, 18, c, 1); bowl(p, cx + 70, cy - 8, 28, c, 1); sakura(p, cx, cy + 16, 16, c, 1); }, ochre);
  accommodation(); eating(); dishes1(); dishes2(); shopping();
  divider("VII", "Part Seven", "Experiences & practical tips", "What to do — and how to do it well.", ["Things to do & onsen", "Culture & etiquette", "Safety & every traveller", "A Japanese phrasebook"], (p, cx, cy, c) => { fuji(p, cx, cy - 24, 300, 76, c, 1); torii(p, cx + 120, cy - 24, 38, c, 1); lantern(p, cx - 120, cy - 6, 24, c, 1); }, blue);
  activities(); culture(); safety(); travellers(); phrasebook1(); phrasebook2(); resources(); appendices();
  closing(); back();
  return doc.save();
}
async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  for (const [name, size] of [["US-Letter", [612, 792]], ["A4", [595.28, 841.89]]]) {
    const bytes = await buildDoc(size); writeFileSync(join(ROOT, "dist", `Japan-The-Complete-Guide-${name}.pdf`), bytes);
    console.log(`Japan ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
