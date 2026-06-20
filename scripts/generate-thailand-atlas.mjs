/**
 * The Slow Atlas — Thailand Road Trip Atlas
 * A comprehensive, beautifully designed travel ebook (PDF) covering the
 * legendary road trips of Thailand — with vector route maps, a day-by-day
 * Mae Hong Son Loop, practical essentials, food, phrases, and fillable
 * planning pages. Generates US Letter + A4 editions.
 *
 * Run:    npm run thailand
 * Output: dist/Thailand-Road-Trip-Atlas-US-Letter.pdf
 *         dist/Thailand-Road-Trip-Atlas-A4.pdf
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

// palette
const paper = rgb(0.984, 0.969, 0.945);
const ink = rgb(0.176, 0.165, 0.141);
const sub = rgb(0.545, 0.518, 0.471);
const hair = rgb(0.866, 0.835, 0.788);
const panel = rgb(0.953, 0.933, 0.898);
const terra = rgb(0.725, 0.376, 0.247);
const sage = rgb(0.443, 0.498, 0.376);
const blue = rgb(0.357, 0.471, 0.529);
const ochre = rgb(0.78, 0.6, 0.27);
const white = rgb(1, 1, 1);

let doc, W, H, M, CW, form, PAGE;
let D, SF, SB, SI, SN, NB;
let nameCounter = 0;
const uid = (b) => `${b}_${nameCounter++}`;

// ---- text helpers ----
const text = (p, s, x, y, { size = 11, font = SN, color = ink, opacity = 1 } = {}) =>
  p.drawText(s, { x, y, size, font, color, opacity });

function tracked(p, s, x, y, { size = 9, font = NB, color = sub, tracking = 1.5 } = {}) {
  let cx = x;
  for (const ch of s) { p.drawText(ch, { x: cx, y, size, font, color }); cx += font.widthOfTextAtSize(ch, size) + tracking; }
  return cx - x - tracking;
}
const trackedW = (s, { size = 9, font = NB, tracking = 1.5 } = {}) => {
  let w = 0; for (const ch of s) w += font.widthOfTextAtSize(ch, size) + tracking; return w - tracking;
};
const center = (p, s, y, { size = 11, font = SN, color = ink } = {}) =>
  p.drawText(s, { x: (W - font.widthOfTextAtSize(s, size)) / 2, y, size, font, color });
const trackedCenter = (p, s, y, o = {}) => tracked(p, s, (W - trackedW(s, o)) / 2, y, o);

// word-wrapped paragraph; returns the y below the last line
function para(p, s, x, y, w, { size = 10.5, font = SF, color = ink, leading = 15 } = {}) {
  let line = "", yy = y;
  for (const word of s.split(" ")) {
    const t = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(t, size) > w) { text(p, line, x, yy, { size, font, color }); yy -= leading; line = word; }
    else line = t;
  }
  if (line) { text(p, line, x, yy, { size, font, color }); yy -= leading; }
  return yy;
}

function bullets(p, items, x, y, w, { accent = terra, gap = 19, size = 10.5 } = {}) {
  let yy = y;
  for (const it of items) {
    p.drawCircle({ x: x + 2.5, y: yy + 3.4, size: 1.8, color: accent });
    const end = para(p, it, x + 12, yy, w - 12, { size, leading: 14.5 });
    yy = end - (gap - 14.5);
  }
  return yy;
}

// ---- shapes ----
const hline = (p, x1, x2, y, { thickness = 0.7, color = hair } = {}) =>
  p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
const paperBg = (p) => p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });

function globe(p, cx, cy, r, color = terra, w = 1) {
  p.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: w, color: undefined });
  p.drawEllipse({ x: cx, y: cy, xScale: r * 0.421, yScale: r, borderColor: color, borderWidth: w, color: undefined });
  hline(p, cx - r, cx + r, cy, { thickness: w, color });
  const dy = r * 0.447, hw = r * 0.724;
  hline(p, cx - hw, cx + hw, cy + dy, { thickness: w, color });
  hline(p, cx - hw, cx + hw, cy - dy, { thickness: w, color });
}

function header(p, num, tag, title, accent = terra) {
  text(p, num, W - M - D.widthOfTextAtSize(num, 64), H - M - 58, { size: 64, font: D, color: accent, opacity: 0.16 });
  tracked(p, tag.toUpperCase(), M, H - M - 14, { size: 8.5, font: NB, color: accent, tracking: 2.2 });
  text(p, title, M, H - M - 46, { size: 27, font: D, color: ink });
  hline(p, M, W - M, H - M - 60, { thickness: 0.8 });
}
function footer(p, label) {
  hline(p, M, W - M, 46, { thickness: 0.6 });
  tracked(p, "THE SLOW ATLAS", M, 32, { size: 7.5, font: NB, color: sub, tracking: 2 });
  const r = label.toUpperCase(), rw = trackedW(r, { size: 7.5, font: NB, tracking: 2 });
  tracked(p, r, W - M - rw, 32, { size: 7.5, font: NB, color: sub, tracking: 2 });
  const pg = `— ${String(PAGE).padStart(2, "0")} —`;
  center(p, pg, 32, { size: 8, font: SN, color: sub });
  PAGE++;
}

// fillable field (underline) + label
function field(p, x, y, w, { label = null, size = 11 } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + 17, { size: 7.5, font: NB, color: sub, tracking: 1.6 });
  hline(p, x, x + w, y - 2, { thickness: 0.8, color: hair });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: x + 2, y, width: w - 4, height: 15, borderWidth: 0, backgroundColor: paper, font: SN });
  tf.setFontSize(size);
}
function panelField(p, x, y, w, h, { label = null } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + h + 6, { size: 7.5, font: NB, color: sub, tracking: 1.6 });
  p.drawRectangle({ x, y, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  const tf = form.createTextField(uid("f")); tf.enableMultiline();
  tf.addToPage(p, { x: x + 8, y: y + 6, width: w - 16, height: h - 12, borderWidth: 0, backgroundColor: panel, font: SN });
  tf.setFontSize(11);
}
function checkRow(p, x, y, label, w, accent = terra) {
  const cb = form.createCheckBox(uid("c"));
  cb.addToPage(p, { x, y, width: 11, height: 11, borderWidth: 1, borderColor: accent });
  if (label) text(p, label, x + 22, y, { size: 10.5, font: SF, color: ink });
  hline(p, x + 22, x + w, y - 4, { thickness: 0.5 });
}

const newPage = () => { const p = doc.addPage([W, H]); paperBg(p); return p; };

// schematic map: nodes {key,name,x,y} positions normalized 0..1, routes = [{color,keys,loop}]
function drawMap(p, bx, by, bw, bh, nodes, routes, { labels = true } = {}) {
  const px = (nx) => bx + nx * bw;
  const py = (ny) => by + ny * bh; // ny: 0 south (bottom) .. 1 north (top)
  // routes
  for (const r of routes) {
    const pts = r.keys.map((k) => nodes.find((n) => n.key === k)).filter(Boolean);
    for (let i = 0; i < pts.length - 1; i++)
      p.drawLine({ start: { x: px(pts[i].x), y: py(pts[i].y) }, end: { x: px(pts[i + 1].x), y: py(pts[i + 1].y) }, thickness: 1.6, color: r.color });
    if (r.loop && pts.length > 1)
      p.drawLine({ start: { x: px(pts[pts.length - 1].x), y: py(pts[pts.length - 1].y) }, end: { x: px(pts[0].x), y: py(pts[0].y) }, thickness: 1.6, color: r.color });
  }
  // nodes
  for (const n of nodes) {
    p.drawCircle({ x: px(n.x), y: py(n.y), size: n.big ? 4 : 2.6, color: n.big ? terra : ink });
    if (labels) text(p, n.name, px(n.x) + (n.lx ?? 7), py(n.y) + (n.ly ?? -3), { size: n.big ? 9 : 8, font: n.big ? NB : SN, color: ink });
  }
}

// ============================ PAGES ============================
function cover() {
  const p = newPage();
  const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  trackedCenter(p, "THE SLOW ATLAS", H - 138, { size: 9, font: NB, color: terra, tracking: 5 });
  globe(p, W / 2, H - 232, 30, terra, 1);
  center(p, "Thailand", H / 2 + 36, { size: 70, font: D, color: ink });
  center(p, "Road Trip Atlas", H / 2 - 18, { size: 40, font: D, color: terra });
  hline(p, W / 2 - 66, W / 2 + 66, H / 2 - 44, { thickness: 0.8, color: ink });
  center(p, "Legendary routes, slowly travelled.", H / 2 - 74, { size: 14, font: SI, color: sub });
  trackedCenter(p, "ROUTES  ·  ITINERARIES  ·  FOOD  ·  PHRASES  ·  PLANNING PAGES", 232, { size: 8, font: NB, color: sub, tracking: 2.4 });
  trackedCenter(p, "A SLOW ATLAS GUIDE  ·  VOLUME I", 150, { size: 8.5, font: NB, color: terra, tracking: 3 });
}

function contents() {
  const p = newPage();
  header(p, "00", "Welcome", "How to use this atlas", sage);
  let y = H - M - 92;
  y = para(p, "This is a road-tripper's companion to Thailand — written for travellers who would rather wind through mountain villages and roadside noodle stalls than rush between airports. Inside you'll find the country's most rewarding self-drive routes, a full day-by-day for the legendary Mae Hong Son Loop, and everything practical you need to do it well.", M, y, CW, { leading: 16 });
  y -= 14;
  const rows = [
    ["Thailand at a glance", "The land, the regions, and the four great routes"],
    ["Before you go", "When to travel, and the season that makes or breaks a trip"],
    ["Driving in Thailand", "Licences, scooter vs. car, fuel, and staying safe"],
    ["Money, SIM & health", "Cash, connectivity, and looking after yourself"],
    ["Culture & useful Thai", "Etiquette that earns smiles, plus phrases to know"],
    ["The four great routes", "Mae Hong Son Loop, the Andaman coast, Isaan & the west"],
    ["Mae Hong Son Loop", "A seven-day, turn-by-turn slow itinerary"],
    ["Food on the road", "What to order, region by region"],
    ["Plan your trip", "Bucket list, budget, packing & itinerary pages to fill in"],
  ];
  tracked(p, "INSIDE THIS ATLAS", M, y, { size: 8.5, font: NB, color: sub, tracking: 2 });
  hline(p, M, W - M, y - 8); y -= 28;
  rows.forEach(([t, d], i) => {
    text(p, String(i + 1).padStart(2, "0"), M, y, { size: 11, font: SB, color: terra });
    text(p, t, M + 28, y, { size: 12, font: SB, color: ink });
    text(p, d, M + 28, y - 15, { size: 9.5, font: SF, color: sub });
    y -= 40;
  });
  footer(p, "Welcome");
}

function glance() {
  const p = newPage();
  header(p, "01", "Orientation", "Thailand at a glance", terra);
  // map on left, facts on right
  const nodes = [
    { key: "cnx", name: "Chiang Mai", x: 0.32, y: 0.92, big: true },
    { key: "pai", name: "Pai", x: 0.22, y: 0.97 },
    { key: "mhs", name: "Mae Hong Son", x: 0.10, y: 0.84, lx: -78, ly: -2 },
    { key: "cri", name: "Chiang Rai", x: 0.45, y: 0.99 },
    { key: "skt", name: "Sukhothai", x: 0.38, y: 0.72 },
    { key: "ayu", name: "Ayutthaya", x: 0.46, y: 0.50 },
    { key: "bkk", name: "Bangkok", x: 0.47, y: 0.43, big: true },
    { key: "kan", name: "Kanchanaburi", x: 0.33, y: 0.46, lx: -92 },
    { key: "kyai", name: "Khao Yai", x: 0.60, y: 0.52 },
    { key: "isn", name: "Isaan", x: 0.74, y: 0.62 },
    { key: "huahin", name: "Hua Hin", x: 0.45, y: 0.30, lx: -54 },
    { key: "krabi", name: "Krabi", x: 0.40, y: 0.10, lx: -42 },
    { key: "phuket", name: "Phuket", x: 0.33, y: 0.07, lx: -48 },
    { key: "samui", name: "Ko Samui", x: 0.55, y: 0.16 },
  ];
  const routes = [
    { color: terra, keys: ["cnx", "pai", "mhs", "cnx"], loop: false },
    { color: blue, keys: ["bkk", "huahin", "krabi", "phuket"], loop: false },
    { color: sage, keys: ["bkk", "kyai", "isn"], loop: false },
    { color: ochre, keys: ["bkk", "kan"], loop: false },
  ];
  drawMap(p, M + 40, 130, CW * 0.5 - 40, H - M - 110 - 130, nodes, routes);
  // facts column
  const fx = M + CW * 0.56, fw = CW * 0.44;
  let y = H - M - 96;
  tracked(p, "THE ESSENTIALS", fx, y, { size: 8.5, font: NB, color: terra, tracking: 2 }); y -= 22;
  const facts = [
    ["Capital", "Bangkok (Krung Thep)"],
    ["Language", "Thai · English widely used in tourism"],
    ["Currency", "Thai baht (THB)"],
    ["Drives on", "The LEFT"],
    ["Best months", "November – February (cool & dry)"],
    ["Avoid", "March – April (haze in the north)"],
    ["Plug", "Type A / B / C · 230V"],
    ["Time", "GMT +7"],
  ];
  for (const [k, v] of facts) {
    text(p, k, fx, y, { size: 9, font: NB, color: ink });
    para(p, v, fx, y - 13, fw, { size: 10, font: SF, color: sub, leading: 13 });
    y -= 36;
  }
  // legend under map
  let ly = 110;
  const leg = [[terra, "Mae Hong Son Loop"], [blue, "Andaman coast"], [sage, "Isaan / north-east"], [ochre, "Bangkok – Kanchanaburi"]];
  leg.forEach(([c, l], i) => {
    const lx = M + (i % 2) * (CW * 0.27);
    const yy = ly - Math.floor(i / 2) * 16;
    p.drawLine({ start: { x: lx, y: yy + 3 }, end: { x: lx + 16, y: yy + 3 }, thickness: 2, color: c });
    text(p, l, lx + 22, yy, { size: 8.5, font: SN, color: sub });
  });
  text(p, "Schematic map — not to scale.", M, 84, { size: 8, font: SI, color: sub });
  footer(p, "At a Glance");
}

function beforeYouGo() {
  const p = newPage();
  header(p, "02", "Timing", "Before you go", sage);
  let y = H - M - 92;
  y = para(p, "Thailand has three broad seasons, and choosing the right window matters more here than almost anywhere. Get it right and you'll have warm days and clear mountain views; get it wrong and you'll meet either monsoon downpours or a smoky northern sky.", M, y, CW, { leading: 16 });
  y -= 18;
  const seasons = [
    ["Cool & dry", "Nov – Feb", sage, "The sweet spot. Comfortable days, cool evenings in the hills, clear skies. Peak season — book ahead."],
    ["Hot", "Mar – May", ochre, "Very hot, and Mar–Apr brings agricultural haze across the north (Chiang Mai, Pai). Songkran (Thai New Year) mid-April is a joyous water festival."],
    ["Green & wet", "Jun – Oct", blue, "Warm monsoon rains — usually short, heavy afternoon bursts. Lush, quiet and cheap. Some mountain roads get slippery; ride with care."],
  ];
  for (const [name, when, accent, desc] of seasons) {
    p.drawRectangle({ x: M, y: y - 44, width: 3, height: 56, color: accent });
    text(p, name, M + 14, y, { size: 13, font: SB, color: ink });
    tracked(p, when.toUpperCase(), M + 14, y - 17, { size: 8.5, font: NB, color: accent, tracking: 1.5 });
    para(p, desc, M + 150, y + 2, CW - 150, { size: 10.5, leading: 14.5 });
    y -= 70;
  }
  y -= 4;
  p.drawRectangle({ x: M, y: y - 52, width: CW, height: 64, color: panel, borderColor: hair, borderWidth: 0.8 });
  tracked(p, "SLOW ATLAS TIP", M + 14, y - 2, { size: 8.5, font: NB, color: terra, tracking: 2 });
  para(p, "For the Mae Hong Son Loop specifically, aim for late November to February. You'll get the famous sea of mist over the valleys at dawn and dry, grippy roads for those 1,864 curves.", M + 14, y - 18, CW - 28, { size: 10.5, font: SI, color: ink, leading: 14 });
  footer(p, "Before You Go");
}

function driving() {
  const p = newPage();
  header(p, "03", "On the road", "Driving in Thailand", blue);
  let y = H - M - 92;
  const half = (CW - 30) / 2;
  // left column
  tracked(p, "THE NON-NEGOTIABLES", M, y, { size: 8.5, font: NB, color: terra, tracking: 1.8 });
  let ly = y - 22;
  ly = bullets(p, [
    "Carry an International Driving Permit (IDP) plus your home licence — police checks are common and your insurance depends on it.",
    "Drive on the LEFT. Give way to anything bigger; the road hierarchy is by size.",
    "Helmets are mandatory on scooters — and genuinely life-saving. Wear closed shoes.",
    "Avoid driving at night: unlit vehicles, animals, and the odd pothole.",
  ], M, ly, half, { accent: blue });
  // right column
  tracked(p, "SCOOTER  VS.  CAR", M + half + 30, y, { size: 8.5, font: NB, color: terra, tracking: 1.8 });
  let ry = y - 22;
  text(p, "Scooter / motorbike", M + half + 30, ry, { size: 11, font: SB, color: ink });
  ry = para(p, "The classic way to ride the northern loops — freeing and cheap (around THB 200–300/day). Only if you're confident; mountain bends are unforgiving. Rent 125–150cc+ for the hills.", M + half + 30, ry - 15, half, { size: 10, leading: 13.5 });
  ry -= 10;
  text(p, "Car", M + half + 30, ry, { size: 11, font: SB, color: ink });
  ry = para(p, "Safer for families and the rainy season; air-con is a blessing in the heat. From around THB 900–1,400/day. International rental desks are at every major airport.", M + half + 30, ry - 15, half, { size: 10, leading: 13.5 });
  // bottom practicalities
  y = Math.min(ly, ry) - 24;
  hline(p, M, W - M, y); y -= 22;
  tracked(p, "GOOD TO KNOW", M, y, { size: 8.5, font: NB, color: sage, tracking: 1.8 }); y -= 20;
  bullets(p, [
    "Fuel is cheap and stations (PTT, Bangchak) are frequent — but fill up before remote stretches like Mae Sariang to Mae Chaem.",
    "Download offline maps (Maps.me or Google offline) — signal drops in the mountains.",
    "Petrol stations often have clean toilets, good coffee (Café Amazon) and 7-Eleven snacks.",
    "An app like Grab is handy in cities when you'd rather not drive.",
  ], M, y, CW, { accent: sage });
  footer(p, "Driving");
}

function moneyHealth() {
  const p = newPage();
  header(p, "04", "Practical", "Money, SIM & health", ochre);
  let y = H - M - 92;
  const blocks = [
    ["Money", terra, [
      "The baht is cash-first once you leave the cities — carry small notes for stalls and tolls.",
      "ATMs are everywhere but charge around THB 220 per foreign withdrawal; take out larger amounts less often.",
      "Tipping isn't expected, but rounding up or leaving THB 20–50 is kind.",
    ]],
    ["Connectivity", blue, [
      "Buy a tourist SIM (AIS, TrueMove, dtac) at the airport, or an eSIM before you fly. Data is fast and cheap.",
      "Coverage is excellent except deep in the mountains — hence offline maps.",
    ]],
    ["Health & safety", sage, [
      "Tap water isn't drinkable — buy big bottles or use a filter. Ice in cafés is generally fine.",
      "Travel insurance that covers motorbike riding is essential (many policies exclude it).",
      "Carry a small kit: rehydration salts, plasters, antiseptic, and any meds you need.",
      "Emergency: dial 191 (police) or 1669 (ambulance). Tourist Police: 1155.",
    ]],
  ];
  for (const [title, accent, items] of blocks) {
    tracked(p, title.toUpperCase(), M, y, { size: 9, font: NB, color: accent, tracking: 1.8 });
    y = bullets(p, items, M, y - 20, CW, { accent }) - 14;
  }
  footer(p, "Money & Health");
}

function culture() {
  const p = newPage();
  header(p, "05", "Respect", "Culture & useful Thai", terra);
  let y = H - M - 92;
  const half = (CW - 30) / 2;
  tracked(p, "ETIQUETTE THAT EARNS SMILES", M, y, { size: 8.5, font: NB, color: sage, tracking: 1.6 });
  bullets(p, [
    "Return a 'wai' (palms together) with a smile — but you needn't initiate with staff.",
    "Never touch someone's head, and don't point your feet at people or Buddha images.",
    "Cover shoulders and knees at temples; remove shoes before entering.",
    "Keep your cool — visible anger makes you 'lose face' and rarely helps.",
    "Treat images of the King and monarchy with great respect (it's the law).",
  ], M, y - 20, half, { accent: sage });
  // phrases
  tracked(p, "A LITTLE THAI GOES A LONG WAY", M + half + 30, y, { size: 8.5, font: NB, color: terra, tracking: 1.6 });
  const phrases = [
    ["Hello", "Sawatdee (khrap/kha)"],
    ["Thank you", "Khop khun (khrap/kha)"],
    ["Yes / No", "Chai / Mai chai"],
    ["How much?", "Tao rai?"],
    ["Delicious", "Aroi!"],
    ["Not spicy, please", "Mai phet"],
    ["Where is…?", "…yu thi nai?"],
    ["Excuse me / sorry", "Khor thot"],
    ["Cheers!", "Chon kaew!"],
  ];
  let py = y - 22;
  for (const [en, th] of phrases) {
    text(p, en, M + half + 30, py, { size: 10, font: SB, color: ink });
    text(p, th, M + half + 30 + 140, py, { size: 10.5, font: SI, color: terra });
    hline(p, M + half + 30, W - M, py - 6, { thickness: 0.4 });
    py -= 24;
  }
  text(p, "Men end politely with 'khrap', women with 'kha'.", M + half + 30, py - 2, { size: 9, font: SI, color: sub });
  footer(p, "Culture & Language");
}

function routes() {
  const p = newPage();
  header(p, "06", "Overview", "The four great routes", blue);
  let y = H - M - 92;
  const data = [
    ["1 · Mae Hong Son Loop", terra, "≈600 km · 5–7 days", "North. The crown jewel: 1,864 curves through misty mountains, hot springs, hill-tribe villages and the bohemian town of Pai. The heart of this atlas."],
    ["2 · The Andaman Coast", blue, "≈400 km · 5–8 days", "South-west. Bangkok down to limestone-studded Krabi and Phuket — beaches, sea kayaking, and long-tail boats. Best Nov–Apr."],
    ["3 · Isaan & the North-East", sage, "≈700 km · 6–9 days", "The Thailand few visitors see: Khmer temples, silk villages, sticky-rice country and the Mekong. Authentic, warm and wonderfully cheap."],
    ["4 · Bangkok – Kanchanaburi", ochre, "≈250 km · 3–4 days", "West. Waterfalls, the River Kwai, floating markets and Erawan's emerald pools — an easy first road trip from the capital."],
  ];
  for (const [name, accent, stat, desc] of data) {
    p.drawRectangle({ x: M, y: y - 52, width: CW, height: 64, color: white, borderColor: hair, borderWidth: 0.8 });
    p.drawRectangle({ x: M, y: y - 52, width: 3, height: 64, color: accent });
    text(p, name, M + 16, y - 4, { size: 14, font: SB, color: ink });
    tracked(p, stat.toUpperCase(), M + 16, y - 22, { size: 8, font: NB, color: accent, tracking: 1.4 });
    para(p, desc, M + 16, y - 36, CW - 32, { size: 10, font: SF, color: sub, leading: 13 });
    y -= 80;
  }
  footer(p, "The Routes");
}

function loopIntro() {
  const p = newPage();
  header(p, "07", "Flagship route", "The Mae Hong Son Loop", terra);
  // loop map
  const nodes = [
    { key: "cnx", name: "Chiang Mai", x: 0.62, y: 0.50, big: true, lx: 9, ly: -3 },
    { key: "pai", name: "Pai", x: 0.40, y: 0.86, big: true },
    { key: "mhs", name: "Mae Hong Son", x: 0.14, y: 0.66, big: true, lx: -96 },
    { key: "khun", name: "Khun Yuam", x: 0.18, y: 0.40 },
    { key: "sariang", name: "Mae Sariang", x: 0.26, y: 0.16, lx: -78 },
    { key: "chaem", name: "Mae Chaem", x: 0.52, y: 0.20 },
    { key: "inth", name: "Doi Inthanon", x: 0.66, y: 0.30, lx: 9 },
  ];
  const routes = [{ color: terra, keys: ["cnx", "pai", "mhs", "khun", "sariang", "chaem", "inth", "cnx"], loop: true }];
  drawMap(p, M + CW * 0.5, 150, CW * 0.5, H - M - 96 - 150, nodes, routes);
  // text column
  const tx = M, tw = CW * 0.46;
  let y = H - M - 96;
  y = para(p, "Thailand's most loved drive traces a great circle through the north-western mountains from Chiang Mai. It is famous for its 1,864 marked curves — there's even a sticker to prove you survived them.", tx, y, tw, { leading: 15 });
  y -= 10;
  y = para(p, "But the joy is in going slowly: dawn mist pooling in the valleys, roadside coffee, waterfalls, hot springs, and Shan-culture towns that feel a world away from Bangkok.", tx, y, tw, { leading: 15 });
  y -= 16;
  tracked(p, "AT A GLANCE", tx, y, { size: 8.5, font: NB, color: terra, tracking: 1.8 }); y -= 18;
  const facts = [["Distance", "≈600 km"], ["Duration", "5–7 days (we suggest 7)"], ["Start / end", "Chiang Mai"], ["Direction", "Anti-clockwise (via Pai first)"], ["Vehicle", "Scooter 150cc+ or a small car"], ["Best season", "Nov – Feb"]];
  for (const [k, v] of facts) {
    text(p, k, tx, y, { size: 9.5, font: NB, color: ink });
    text(p, v, tx + 92, y, { size: 10, font: SF, color: sub });
    hline(p, tx, tx + tw, y - 6, { thickness: 0.4 });
    y -= 22;
  }
  footer(p, "Mae Hong Son Loop");
}

function dayCard(p, x, y, w, day, accent) {
  p.drawRectangle({ x, y: y - day.h, width: w, height: day.h + 14, color: white, borderColor: hair, borderWidth: 0.8 });
  p.drawRectangle({ x, y: y - day.h, width: 3, height: day.h + 14, color: accent });
  tracked(p, day.no.toUpperCase(), x + 14, y - 2, { size: 8, font: NB, color: accent, tracking: 1.6 });
  text(p, day.title, x + 14, y - 20, { size: 13, font: SB, color: ink });
  text(p, day.leg, x + w - 14 - SN.widthOfTextAtSize(day.leg, 9), y - 18, { size: 9, font: SN, color: sub });
  let yy = y - 38;
  yy = para(p, day.body, x + 14, yy, w - 28, { size: 10, font: SF, color: ink, leading: 13.5 });
  if (day.eat) { text(p, "Eat — ", x + 14, yy - 2, { size: 9.5, font: NB, color: terra }); para(p, day.eat, x + 14 + 34, yy - 2, w - 28 - 34, { size: 9.5, font: SF, color: sub, leading: 12.5 }); yy -= 16; }
  if (day.stay) { text(p, "Stay — ", x + 14, yy - 2, { size: 9.5, font: NB, color: sage }); para(p, day.stay, x + 14 + 38, yy - 2, w - 28 - 38, { size: 9.5, font: SF, color: sub, leading: 12.5 }); }
}

function itineraryDays(list, label) {
  const p = newPage();
  header(p, "07", "Day by day", "The Mae Hong Son Loop", terra);
  let y = H - M - 86;
  for (const d of list) { dayCard(p, M, y, CW, d, terra); y -= d.h + 30; }
  footer(p, label);
}

function food() {
  const p = newPage();
  header(p, "08", "Eat well", "Food on the road", ochre);
  let y = H - M - 92;
  y = para(p, "Some of Thailand's best meals cost a euro and come from a roadside cart. Look for stalls busy with locals, point if you can't pronounce it, and say 'mai phet' if you'd like it milder.", M, y, CW, { leading: 15 });
  y -= 16;
  const regions = [
    ["The North (around the Loop)", terra, "Khao soi (curry-noodle soup — the dish of Chiang Mai), sai ua (herby grilled sausage), nam prik num (green-chilli dip with sticky rice), and gaeng hang lay (Burmese-style pork curry)."],
    ["Central & Bangkok", blue, "Pad krapow (holy-basil stir-fry with a fried egg), boat noodles, mango sticky rice, and the green/red curries you know — done properly."],
    ["Isaan (North-East)", sage, "Som tam (green-papaya salad), larb (zingy minced-meat salad), grilled gai yang chicken and endless sticky rice. Boldly spicy."],
    ["The South", ochre, "Fierier curries rich with turmeric and coconut, fresh seafood, and massaman — fragrant and mild."],
  ];
  for (const [name, accent, desc] of regions) {
    p.drawRectangle({ x: M, y: y - 30, width: 3, height: 42, color: accent });
    text(p, name, M + 14, y, { size: 12.5, font: SB, color: ink });
    y = para(p, desc, M + 14, y - 16, CW - 14, { size: 10.5, font: SF, color: sub, leading: 14 });
    y -= 18;
  }
  footer(p, "Food");
}

function bucketList() {
  const p = newPage();
  header(p, "09", "Plan your trip", "Thailand bucket list", sage);
  center(p, "Tick off the experiences as you go.", H - M - 78, { size: 12, font: SI, color: sub });
  const items = [
    "Survive all 1,864 curves of the Mae Hong Son Loop",
    "Watch dawn mist fill the valley at Pai Canyon",
    "Soak in a natural hot spring after a day's ride",
    "Slurp a bowl of khao soi in Chiang Mai",
    "Climb to Thailand's roof at Doi Inthanon",
    "Share sticky rice with a hill-tribe family",
    "Ride a long-tail boat through Andaman limestone karsts",
    "Cook a curry at a Thai cooking class",
    "Give alms to monks at sunrise",
    "Find an empty beach with no name",
    "Eat at a night market until you can't move",
    "Learn to say 'aroi!' and mean it",
  ];
  const colX = [M, M + CW / 2 + 12], colW = CW / 2 - 12;
  let yy = [H - M - 104, H - M - 104];
  items.forEach((it, i) => {
    const c = i % 2;
    checkRow(p, colX[c], yy[c], it, colW, [terra, sage, blue, ochre][i % 4]);
    yy[c] -= 30;
  });
  footer(p, "Bucket List");
}

function budgetPage() {
  const p = newPage();
  header(p, "09", "Plan your trip", "Trip budget", terra);
  const cats = ["Flights", "Vehicle rental", "Fuel", "Accommodation", "Food & drink", "Activities", "SIM & extras", "Buffer"];
  const colP = M + CW * 0.52, colA = M + CW * 0.77, cwn = CW * 0.2;
  let y = H - M - 92;
  tracked(p, "CATEGORY", M, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "PLANNED", colP, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "ACTUAL", colA, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  y -= 12; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 26;
  for (const c of cats) { text(p, c, M, y, { size: 12, font: SF, color: ink }); field(p, colP, y - 2, cwn); field(p, colA, y - 2, cwn); y -= 33; }
  y -= 4;
  p.drawRectangle({ x: M - 8, y: y - 10, width: CW + 16, height: 34, color: panel });
  tracked(p, "TOTAL", M, y, { size: 10, font: NB, color: terra, tracking: 2 });
  field(p, colP, y - 2, cwn); field(p, colA, y - 2, cwn);
  footer(p, "Budget");
}

function packingPage() {
  const p = newPage();
  header(p, "09", "Plan your trip", "Packing for Thailand", blue);
  const groups = [
    ["Riding & safety", terra, ["Helmet (or hire a good one)", "Light gloves", "Sunglasses", "Rain poncho", "Closed shoes"]],
    ["Tropical kit", sage, ["High-SPF sunscreen", "Insect repellent (DEET)", "Reusable water bottle", "Quick-dry clothes", "Sarong / scarf"]],
    ["Health", blue, ["Travel insurance docs", "Rehydration salts", "Basic first-aid", "Hand sanitiser", "Any personal meds"]],
    ["Documents & tech", ochre, ["IDP + driving licence", "Passport + copies", "Offline maps downloaded", "Power bank", "Universal adapter"]],
  ];
  const colX = [M, M + CW / 2 + 12], colW = CW / 2 - 12;
  const startY = H - M - 96; let y = startY;
  groups.forEach(([title, accent, items], gi) => {
    const col = gi < 2 ? 0 : 1; if (col === 1 && gi === 2) y = startY;
    const x = colX[col];
    tracked(p, title.toUpperCase(), x, y, { size: 9, font: NB, color: accent, tracking: 2 });
    let yy = y - 22;
    for (const it of items) { checkRow(p, x, yy, it, colW, accent); yy -= 24; }
    y = yy - 16;
  });
  footer(p, "Packing");
}

function planPage() {
  const p = newPage();
  header(p, "09", "Plan your trip", "Daily plan", sage);
  text(p, "Copy or reprint this page for each day of your route.", M, H - M - 78, { size: 11, font: SI, color: sub });
  const half = (CW - 24) / 2;
  let y = H - M - 110;
  field(p, M, y, half, { label: "Day / date" });
  field(p, M + half + 24, y, half, { label: "Route — from / to" });
  y -= 50;
  const t3 = (CW - 48) / 3;
  field(p, M, y, t3, { label: "Distance" });
  field(p, M + t3 + 24, y, t3, { label: "Driving time" });
  field(p, M + (t3 + 24) * 2, y, t3, { label: "Overnight" });
  y -= 40;
  panelField(p, M, y - 92, CW, 104, { label: "Stops & sights along the way" });
  y -= 120;
  panelField(p, M, y - 60, half, 72, { label: "Where to eat" });
  panelField(p, M + half + 24, y - 60, half, 72, { label: "Notes & memories" });
  footer(p, "Daily Plan");
}

function back() {
  const p = newPage();
  const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  globe(p, W / 2, H / 2 + 78, 24, terra, 1);
  center(p, "Chok dee", H / 2 + 6, { size: 40, font: D, color: ink });
  center(p, "Good luck, and enjoy every curve.", H / 2 - 28, { size: 13, font: SI, color: sub });
  trackedCenter(p, "THE SLOW ATLAS  ·  RENNES, FRANCE", 120, { size: 8, font: NB, color: terra, tracking: 3 });
}

// ============================ BUILD ============================
const DAYS_A = [
  { no: "Day 1", title: "Chiang Mai – Pai", leg: "≈135 km · 3–4 h", h: 92,
    body: "Ease in with the famous climb to Pai — 762 curves of forest and viewpoints. Stop at Mok Fa waterfall and the roadside coffee stands. Arrive by mid-afternoon to settle into Pai's slow, bohemian rhythm.",
    eat: "Pai Walking Street night market for cheap, brilliant street food.", stay: "Pai — riverside bungalows or a hillside guesthouse." },
  { no: "Day 2", title: "Around Pai", leg: "Rest day", h: 88,
    body: "Leave the bike parked for a morning. Catch dawn at Pai Canyon, soak in the Tha Pai hot springs, wander to the Land Split and the white Wat Phra That Mae Yen for sunset over the valley.",
    eat: "A long, lazy café breakfast — Pai does these beautifully.", stay: "A second night in Pai." },
  { no: "Day 3", title: "Pai – Mae Hong Son", leg: "≈110 km · 3 h", h: 84,
    body: "The quietest, prettiest leg. Detour to the Tham Lod cave (by bamboo raft and lantern) and the Su Tong Pae bamboo bridge. Mae Hong Son is a calm, Shan-flavoured town ringed by mountains.",
    eat: "Lakeside stalls by Nong Jong Kham at dusk.", stay: "Mae Hong Son town, near the lake." },
];
const DAYS_B = [
  { no: "Day 4", title: "Mae Hong Son – Khun Yuam – Mae Sariang", leg: "≈160 km · 4 h", h: 90,
    body: "Climb to the Ban Rak Thai tea village near the Myanmar border for breakfast among the hills, then roll south. Khun Yuam's WWII museum makes a thoughtful stop. Mae Sariang is a sleepy riverside town — a lovely place to do nothing.",
    eat: "Riverside Thai-Shan cooking in Mae Sariang.", stay: "Mae Sariang, by the Yuam river." },
  { no: "Day 5", title: "Mae Sariang – Mae Chaem", leg: "≈170 km · 4–5 h", h: 86,
    body: "A remote, beautiful stretch — fuel up first. The road winds through forest and rice terraces to Mae Chaem, a traditional weaving town few travellers reach. Quiet nights and big stars.",
    eat: "Simple local kitchens — point and smile.", stay: "Mae Chaem — homestay or small guesthouse." },
];
const DAYS_C = [
  { no: "Day 6", title: "Mae Chaem – Doi Inthanon – Chiang Mai", leg: "≈150 km · 4 h", h: 92,
    body: "Climb to the roof of Thailand (2,565 m) at Doi Inthanon: the twin royal pagodas, cloud forest, and the Pha Dok Siew waterfall trail. Then descend the eastern side back toward Chiang Mai.",
    eat: "Karen-grown coffee and grilled corn on the mountain.", stay: "Back in Chiang Mai's old city." },
  { no: "Day 7", title: "Chiang Mai", leg: "Slow finish", h: 88,
    body: "Reward the ride: a Thai massage, a cooking class, and a wander round the old-city temples and Sunday Walking Street. Toast 1,864 curves survived. Chon kaew!",
    eat: "One last bowl of khao soi — you've earned it.", stay: "Chiang Mai." },
];

async function buildDoc([w, h]) {
  doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("The Slow Atlas — Thailand Road Trip Atlas");
  doc.setAuthor("The Slow Atlas");
  doc.setSubject("A comprehensive Thailand road-trip guide & planner");
  doc.setKeywords(["thailand", "road trip", "travel guide", "mae hong son loop", "itinerary", "ebook"]);
  W = w; H = h; M = 50; CW = W - M * 2; nameCounter = 0; PAGE = 2;
  D = await doc.embedFont(fb.display, { subset: true });
  SF = await doc.embedFont(fb.serif, { subset: true });
  SB = await doc.embedFont(fb.serifB, { subset: true });
  SI = await doc.embedFont(fb.serifI, { subset: true });
  SN = await doc.embedFont(fb.sans, { subset: true });
  NB = await doc.embedFont(fb.sansB, { subset: true });
  form = doc.getForm();

  cover(); contents(); glance(); beforeYouGo(); driving(); moneyHealth(); culture();
  routes(); loopIntro();
  itineraryDays(DAYS_A, "Loop · Days 1–3");
  itineraryDays(DAYS_B, "Loop · Days 4–5");
  itineraryDays(DAYS_C, "Loop · Days 6–7");
  food(); bucketList(); budgetPage(); packingPage(); planPage(); back();

  form.updateFieldAppearances(SN);
  return doc.save();
}

async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  for (const [name, size] of [["US-Letter", [612, 792]], ["A4", [595.28, 841.89]]]) {
    const bytes = await buildDoc(size);
    const out = join(ROOT, "dist", `Thailand-Road-Trip-Atlas-${name}.pdf`);
    writeFileSync(out, bytes);
    console.log(`Thailand ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
