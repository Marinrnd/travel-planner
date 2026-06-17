/**
 * Explorer OS — The Travel Planner
 * A premium, fillable, print-ready PDF planner with an editorial,
 * slow-travel aesthetic. Generates both US Letter and A4 editions.
 *
 * Run:    npm run planner
 * Output: dist/Explorer-OS-Travel-Planner-US-Letter.pdf
 *         dist/Explorer-OS-Travel-Planner-A4.pdf
 */
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FDIR = join(ROOT, "assets", "fonts");
const fontBytes = {
  display: readFileSync(join(FDIR, "Italiana-Regular.ttf")),
  serif: readFileSync(join(FDIR, "Lora-Regular.ttf")),
  serifB: readFileSync(join(FDIR, "Lora-Bold.ttf")),
  serifI: readFileSync(join(FDIR, "Lora-Italic.ttf")),
  sans: readFileSync(join(FDIR, "Outfit-Regular.ttf")),
  sansB: readFileSync(join(FDIR, "Outfit-Bold.ttf")),
};

// ---- Warm editorial palette ----------------------------------------------
const paper = rgb(0.984, 0.969, 0.945); // warm cream
const ink = rgb(0.176, 0.165, 0.141); // warm charcoal
const sub = rgb(0.545, 0.518, 0.471); // muted taupe
const hair = rgb(0.866, 0.835, 0.788); // hairline
const panel = rgb(0.953, 0.933, 0.898); // soft cream panel
const terra = rgb(0.725, 0.376, 0.247); // terracotta
const sage = rgb(0.443, 0.498, 0.376); // sage
const blue = rgb(0.357, 0.471, 0.529); // dusty blue
const ochre = rgb(0.78, 0.6, 0.27); // ochre
const white = rgb(1, 1, 1);

// ---- Module-level state (set per document/size) --------------------------
let doc, W, H, M, CW, form;
let D, SF, SB, SI, SN, NB; // fonts: display, serif, serifBold, serifItalic, sans, sansBold
let nameCounter = 0;
const uid = (b) => `${b}_${nameCounter++}`;

// ---- Text helpers ---------------------------------------------------------
function text(p, str, x, y, { size = 11, font = SN, color = ink, opacity = 1 } = {}) {
  p.drawText(str, { x, y, size, font, color, opacity });
}

// Letter-spaced text (pdf-lib has no native tracking). Returns total width.
function tracked(p, str, x, y, { size = 9, font = NB, color = sub, tracking = 1.5 } = {}) {
  let cx = x;
  for (const ch of str) {
    p.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
  return cx - x - tracking;
}

function trackedWidth(str, { size = 9, font = NB, tracking = 1.5 } = {}) {
  let w = 0;
  for (const ch of str) w += font.widthOfTextAtSize(ch, size) + tracking;
  return w - tracking;
}

function center(p, str, y, { size = 11, font = SN, color = ink } = {}) {
  const w = font.widthOfTextAtSize(str, size);
  p.drawText(str, { x: (W - w) / 2, y, size, font, color });
}

function trackedCenter(p, str, y, opts = {}) {
  const w = trackedWidth(str, opts);
  return tracked(p, str, (W - w) / 2, y, opts);
}

// ---- Shape helpers --------------------------------------------------------
function paperBg(p) {
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: paper });
}
function hline(p, x1, x2, y, { thickness = 0.7, color = hair } = {}) {
  p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

// The Slow Atlas globe mark (matches assets/brand/emblem.svg).
function globe(p, cx, cy, r, color = terra, w = 1) {
  p.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: w, color: undefined });
  p.drawEllipse({ x: cx, y: cy, xScale: r * 0.421, yScale: r, borderColor: color, borderWidth: w, color: undefined });
  hline(p, cx - r, cx + r, cy, { thickness: w, color });
  const dy = r * 0.447, hw = r * 0.724;
  hline(p, cx - hw, cx + hw, cy + dy, { thickness: w, color });
  hline(p, cx - hw, cx + hw, cy - dy, { thickness: w, color });
}

// ---- Page furniture -------------------------------------------------------
function header(p, num, tag, title, accent = terra) {
  // faded display numeral, top-right
  text(p, num, W - M - D.widthOfTextAtSize(num, 64), H - M - 58, {
    size: 64, font: D, color: accent, opacity: 0.16,
  });
  tracked(p, tag.toUpperCase(), M, H - M - 14, { size: 8.5, font: NB, color: accent, tracking: 2.2 });
  text(p, title, M, H - M - 46, { size: 27, font: D, color: ink });
  hline(p, M, W - M, H - M - 60, { thickness: 0.8 });
}

function footer(p, label, n) {
  hline(p, M, W - M, 46, { thickness: 0.6 });
  tracked(p, "THE SLOW ATLAS", M, 32, { size: 7.5, font: NB, color: sub, tracking: 2 });
  const r = label.toUpperCase();
  const rw = trackedWidth(r, { size: 7.5, font: NB, tracking: 2 });
  tracked(p, r, W - M - rw, 32, { size: 7.5, font: NB, color: sub, tracking: 2 });
  const pg = `— ${String(n).padStart(2, "0")} —`;
  center(p, pg, 32, { size: 8, font: SN, color: sub });
}

// ---- Field primitives -----------------------------------------------------
// Underline-style field: tracked label above a hairline, transparent input.
function field(p, x, y, w, { label = null, size = 11 } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + 17, { size: 7.5, font: NB, color: sub, tracking: 1.6 });
  hline(p, x, x + w, y - 2, { thickness: 0.8, color: hair });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: x + 2, y, width: w - 4, height: 15, borderWidth: 0, backgroundColor: paper, font: SN });
  tf.setFontSize(size);
  return tf;
}

// Soft panel with optional label, holding a multiline field.
function panelField(p, x, y, w, h, { label = null } = {}) {
  if (label) tracked(p, label.toUpperCase(), x, y + h + 6, { size: 7.5, font: NB, color: sub, tracking: 1.6 });
  p.drawRectangle({ x, y, width: w, height: h, color: panel, borderColor: hair, borderWidth: 0.8 });
  const tf = form.createTextField(uid("f"));
  tf.enableMultiline();
  tf.addToPage(p, { x: x + 8, y: y + 6, width: w - 16, height: h - 12, borderWidth: 0, backgroundColor: panel, font: SN });
  tf.setFontSize(11);
  return tf;
}

// Checkbox + serif label sitting on a hairline baseline.
function checkRow(p, x, y, label, w, accent = terra) {
  const cb = form.createCheckBox(uid("c"));
  cb.addToPage(p, { x, y, width: 11, height: 11, borderWidth: 1, borderColor: accent });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: x + 22, y: y - 3, width: w - 24, height: 17, borderWidth: 0, backgroundColor: paper, font: SN });
  tf.setFontSize(10.5);
  if (label) tf.setText(label);
  hline(p, x + 22, x + w, y - 4, { thickness: 0.5 });
}

// Several ruled writing lines (visual guide under a multiline field).
function ruledField(p, x, y, w, lines, gap = 22) {
  for (let i = 0; i < lines; i++) hline(p, x, x + w, y + 4 + i * gap, { thickness: 0.5 });
  const tf = form.createTextField(uid("f"));
  tf.enableMultiline();
  tf.addToPage(p, { x: x + 2, y: y, width: w - 4, height: lines * gap, borderWidth: 0, backgroundColor: paper, font: SN });
  tf.setFontSize(11);
  return tf;
}

// ---- Pages ----------------------------------------------------------------
function cover() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  // double-rule editorial frame
  const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: ink, borderWidth: 1, color: undefined });
  p.drawRectangle({ x: pad + 5, y: pad + 5, width: W - (pad + 5) * 2, height: H - (pad + 5) * 2, borderColor: hair, borderWidth: 0.6, color: undefined });

  // maker's mark
  trackedCenter(p, "THE SLOW ATLAS", H - 138, { size: 9, font: NB, color: terra, tracking: 5 });

  // globe emblem
  globe(p, W / 2, H - 240, 30, terra, 1);

  // wordmark
  center(p, "Explorer OS", H / 2 - 8, { size: 62, font: D, color: ink });
  hline(p, W / 2 - 60, W / 2 + 60, H / 2 - 34, { thickness: 0.8, color: ink });
  center(p, "Plan every trip for the rest of your life.", H / 2 - 64, { size: 14, font: SI, color: sub });

  // editorial volume mark
  trackedCenter(p, "A SLOW ATLAS TRAVEL PLANNER  •  VOLUME I", 230, { size: 8.5, font: NB, color: sub, tracking: 3 });

  // belongs-to
  tracked(p, "THIS PLANNER BELONGS TO", M + 14, 168, { size: 8, font: NB, color: sub, tracking: 2 });
  hline(p, M + 14, W - M - 14, 150, { thickness: 0.8, color: ink });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: M + 16, y: 152, width: CW - 32, height: 16, borderWidth: 0, backgroundColor: paper, font: SN });
  tf.setFontSize(13);

  trackedCenter(p, "FILLABLE   ·   PRINTABLE   ·   REUSABLE", 96, { size: 8, font: NB, color: terra, tracking: 3 });
}

function welcome() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "00", "Welcome aboard", "How to use this planner", sage);
  const items = [
    ["Make it yours", "Open in any reader that supports forms — Adobe Acrobat, Apple Books or Preview, or a tablet app like GoodNotes — then tap any line and type. Or simply print it."],
    ["One planner, every trip", "Reprint or duplicate the day, budget, and packing pages for each new journey. It is designed to last you for years."],
    ["Plan in gentle order", "Begin with the Trip Overview, then drift through Itinerary, Budget, Packing and Reservations. Keep the Journal close while you travel."],
    ["Made to be beautiful", "Warm paper tones, an elegant serif, and plenty of room to breathe — a planner that feels as considered as the trip itself."],
  ];
  let y = H - M - 96;
  for (const [t, d] of items) {
    text(p, t, M, y, { size: 14, font: SB, color: terra });
    // wrap body
    let lineStr = "", yy = y - 19;
    for (const word of d.split(" ")) {
      const test = lineStr ? lineStr + " " + word : word;
      if (SN.widthOfTextAtSize(test, 11) > CW - 10) {
        text(p, lineStr, M, yy, { size: 11, font: SN, color: ink });
        yy -= 16; lineStr = word;
      } else lineStr = test;
    }
    text(p, lineStr, M, yy, { size: 11, font: SN, color: ink });
    y = yy - 34;
  }
  // contents
  y -= 6;
  tracked(p, "WHAT'S INSIDE", M, y, { size: 8.5, font: NB, color: sub, tracking: 2 });
  hline(p, M, W - M, y - 8);
  const toc = [
    "Trip Overview", "Pre-Trip Checklist", "Daily Itinerary  ·  five days",
    "Budget Planner", "Expense Log", "Packing List",
    "Reservations", "Travel Journal", "Travel Bucket List",
  ];
  let ty = y - 30;
  toc.forEach((t, i) => {
    const col = i % 2;
    const cx = M + col * (CW / 2);
    const row = Math.floor(i / 2);
    const yy = ty - row * 24;
    text(p, String(i + 1).padStart(2, "0"), cx, yy, { size: 10, font: SB, color: terra });
    text(p, t, cx + 26, yy, { size: 11, font: SN, color: ink });
  });
  footer(p, "Welcome", 2);
}

function overview() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "01", "Section One", "Trip Overview", terra);
  const half = (CW - 24) / 2;
  let y = H - M - 100;
  field(p, M, y, half, { label: "Trip name" });
  field(p, M + half + 24, y, half, { label: "Destination" });
  y -= 58;
  const t3 = (CW - 48) / 3;
  field(p, M, y, t3, { label: "Start date" });
  field(p, M + t3 + 24, y, t3, { label: "End date" });
  field(p, M + (t3 + 24) * 2, y, t3, { label: "Duration" });
  y -= 58;
  field(p, M, y, half, { label: "Travelers" });
  field(p, M + half + 24, y, half, { label: "Travel type" });
  y -= 58;
  field(p, M, y, half, { label: "Total budget" });
  field(p, M + half + 24, y, half, { label: "Accommodation" });
  y -= 132;
  panelField(p, M, y, CW, 90, { label: "Three intentions for this trip" });
  y -= 118;
  panelField(p, M, y, CW, 82, { label: "Notes" });
  footer(p, "Trip Overview", 3);
}

function checklist() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "02", "Section Two", "Pre-Trip Checklist", sage);
  const groups = [
    ["Eight weeks before", sage, ["Book flights / transport", "Reserve accommodation", "Check passport validity", "Apply for any visas"]],
    ["Two weeks before", blue, ["Arrange travel insurance", "Notify your bank", "Book airport transfer", "Download offline maps"]],
    ["A few days before", terra, ["Check in online", "Charge devices & power bank", "Save copies of reservations", "Confirm pet / plant / home care"]],
  ];
  let y = H - M - 96;
  for (const [title, accent, items] of groups) {
    tracked(p, title.toUpperCase(), M, y, { size: 9, font: NB, color: accent, tracking: 2 });
    y -= 24;
    for (const it of items) { checkRow(p, M, y, it, CW, accent); y -= 25; }
    y -= 16;
  }
  footer(p, "Pre-Trip Checklist", 4);
}

function itinerary(n, pageNo) {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "03", `Section Three  ·  Day ${n}`, "Daily Itinerary", blue);
  const half = (CW - 24) / 2;
  let y = H - M - 100;
  field(p, M, y, half, { label: "Date" });
  field(p, M + half + 24, y, half, { label: "City / area" });
  y -= 44;
  const blocks = [["Morning", ochre], ["Afternoon", terra], ["Evening", blue]];
  for (const [b, accent] of blocks) {
    p.drawRectangle({ x: M, y: y - 58, width: 3, height: 70, color: accent });
    tracked(p, b.toUpperCase(), M + 14, y, { size: 9, font: NB, color: accent, tracking: 2 });
    ruledField(p, M + 14, y - 54, CW - 14, 2, 22);
    y -= 86;
  }
  panelField(p, M, y - 44, half, 56, { label: "Meals & restaurants" });
  panelField(p, M + half + 24, y - 44, half, 56, { label: "Today's spend" });
  footer(p, `Itinerary · Day ${n}`, pageNo);
}

function budget() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "04", "Section Four", "Budget Planner", sage);
  const cats = ["Flights", "Accommodation", "Food & Drink", "Activities", "Transport", "Shopping", "Insurance", "Miscellaneous"];
  const colP = M + CW * 0.5;
  const colA = M + CW * 0.76;
  const cwn = CW * 0.22;
  let y = H - M - 92;
  tracked(p, "CATEGORY", M, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "PLANNED", colP, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "ACTUAL", colA, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  y -= 12; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 26;
  for (const c of cats) {
    text(p, c, M, y, { size: 12, font: SF, color: ink });
    field(p, colP, y - 2, cwn, {});
    field(p, colA, y - 2, cwn, {});
    y -= 33;
  }
  // total row
  y -= 4;
  p.drawRectangle({ x: M - 8, y: y - 10, width: CW + 16, height: 34, color: panel });
  tracked(p, "TOTAL", M, y, { size: 10, font: NB, color: terra, tracking: 2 });
  field(p, colP, y - 2, cwn, {});
  field(p, colA, y - 2, cwn, {});
  y -= 64;
  const half = (CW - 24) / 2;
  field(p, M, y, half, { label: "Budget remaining" });
  field(p, M + half + 24, y, half, { label: "Average cost per day" });
  footer(p, "Budget Planner", 10);
}

function expenseLog() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "04", "Section Four  ·  Ledger", "Expense Log", terra);
  const cDate = M, cDesc = M + CW * 0.15, cCat = M + CW * 0.62, cAmt = M + CW * 0.84;
  let y = H - M - 90;
  tracked(p, "DATE", cDate, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "DESCRIPTION", cDesc, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "CATEGORY", cCat, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  tracked(p, "AMOUNT", cAmt, y, { size: 8, font: NB, color: sub, tracking: 1.6 });
  y -= 10; hline(p, M, W - M, y, { thickness: 0.8 }); y -= 24;
  for (let i = 0; i < 17; i++) {
    field(p, cDate, y, CW * 0.13, {});
    field(p, cDesc, y, CW * 0.45, {});
    field(p, cCat, y, CW * 0.2, {});
    field(p, cAmt, y, CW * 0.16, {});
    y -= 26;
  }
  footer(p, "Expense Log", 11);
}

function packing() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "05", "Section Five", "Packing List", blue);
  const groups = [
    ["Clothing", terra, 5], ["Toiletries", sage, 4],
    ["Technology", blue, 4], ["Documents", ochre, 4], ["Health & Misc", terra, 4],
  ];
  const preset = { Documents: ["Passport / ID", "Tickets & boarding passes", "Travel insurance", ""] };
  const colX = [M, M + CW / 2 + 12];
  const colW = CW / 2 - 12;
  const startY = H - M - 96;
  let y = startY;
  groups.forEach(([title, accent, rows], gi) => {
    const col = gi < 3 ? 0 : 1; // balance: three groups left, two right
    if (col === 1 && gi === 3) y = startY;
    const x = colX[col];
    tracked(p, title.toUpperCase(), x, y, { size: 9, font: NB, color: accent, tracking: 2 });
    y -= 22;
    for (let i = 0; i < rows; i++) {
      checkRow(p, x, y, preset[title]?.[i] || "", colW, accent);
      y -= 24;
    }
    y -= 18;
  });
  footer(p, "Packing List", 12);
}

function reservations() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "06", "Section Six", "Reservations", ochre);
  const cards = [["Flight", terra], ["Hotel / Stay", sage], ["Rental Car", blue], ["Train / Ferry", ochre]];
  let y = H - M - 92;
  const ch = 86;
  for (const [t, accent] of cards) {
    p.drawRectangle({ x: M, y: y - ch + 14, width: CW, height: ch, color: white, borderColor: hair, borderWidth: 0.8 });
    p.drawRectangle({ x: M, y: y - ch + 14, width: 3, height: ch, color: accent });
    tracked(p, t.toUpperCase(), M + 16, y - 4, { size: 9, font: NB, color: accent, tracking: 2 });
    const half = (CW - 56) / 2;
    field(p, M + 16, y - 38, half, { label: "Provider / details" });
    field(p, M + 40 + half, y - 38, half, { label: "Confirmation #" });
    field(p, M + 16, y - 64, half, { label: "Check-in / date" });
    field(p, M + 40 + half, y - 64, half, { label: "Check-out / cost" });
    y -= ch + 16;
  }
  footer(p, "Reservations", 13);
}

function journal(n, pageNo) {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "07", `Section Seven  ·  Entry ${n}`, "Travel Journal", terra);
  const half = (CW - 24) / 2;
  let y = H - M - 100;
  field(p, M, y, half, { label: "Date" });
  field(p, M + half + 24, y, half, { label: "Mood / rating" });
  y -= 40;
  center(p, "“The journey itself is the reward.”", y - 6, { size: 12, font: SI, color: sub });
  y -= 34;
  panelField(p, M, y - 88, CW, 100, { label: "Today's story" });
  y -= 116;
  panelField(p, M, y - 62, half, 74, { label: "Favourite moment" });
  panelField(p, M + half + 24, y - 62, half, 74, { label: "Places discovered" });
  footer(p, `Journal · Entry ${n}`, pageNo);
}

function bucketList() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  header(p, "08", "Section Eight", "Travel Bucket List", sage);
  center(p, "Tick a box each time a dream becomes a memory.", H - M - 78, { size: 12, font: SI, color: sub });
  const colX = [M, M + CW / 2 + 12];
  const colW = CW / 2 - 12;
  const startY = H - M - 112;
  const accents = [terra, sage, blue, ochre];
  for (let col = 0; col < 2; col++) {
    let yy = startY;
    for (let i = 0; i < 15; i++) {
      checkRow(p, colX[col], yy, "", colW, accents[(i + col) % 4]);
      yy -= 27;
    }
  }
  footer(p, "Bucket List", 16);
}

function back() {
  const p = doc.addPage([W, H]);
  paperBg(p);
  const pad = 38;
  p.drawRectangle({ x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, borderColor: hair, borderWidth: 0.6, color: undefined });
  globe(p, W / 2, H / 2 + 78, 24, terra, 1);
  center(p, "Bon voyage", H / 2 + 6, { size: 40, font: D, color: ink });
  center(p, "Thank you for planning with The Slow Atlas.", H / 2 - 28, { size: 13, font: SI, color: sub });
  trackedCenter(p, "REUSE FOR EVERY TRIP, FOR YEARS TO COME", H / 2 - 64, { size: 8, font: NB, color: sub, tracking: 3 });
  trackedCenter(p, "THE SLOW ATLAS  ·  EST. MMXXVI", 120, { size: 8, font: NB, color: terra, tracking: 3 });
}

// ---- Build one edition ----------------------------------------------------
async function buildDoc(sizeName, [w, h]) {
  doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("Explorer OS — The Travel Planner");
  doc.setAuthor("Explorer OS");
  doc.setSubject("A premium fillable, printable travel planner");
  doc.setKeywords(["travel planner", "itinerary", "budget", "packing list", "printable", "fillable"]);

  W = w; H = h; M = 50; CW = W - M * 2; nameCounter = 0;
  D = await doc.embedFont(fontBytes.display, { subset: true });
  SF = await doc.embedFont(fontBytes.serif, { subset: true });
  SB = await doc.embedFont(fontBytes.serifB, { subset: true });
  SI = await doc.embedFont(fontBytes.serifI, { subset: true });
  SN = await doc.embedFont(fontBytes.sans, { subset: true });
  NB = await doc.embedFont(fontBytes.sansB, { subset: true });
  form = doc.getForm();

  cover();
  welcome();
  overview();
  checklist();
  let pageNo = 5;
  for (let d = 1; d <= 5; d++) itinerary(d, pageNo++);
  budget();
  expenseLog();
  packing();
  reservations();
  journal(1, 14);
  journal(2, 15);
  bucketList();
  back();

  form.updateFieldAppearances(SN);
  return doc.save();
}

async function main() {
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  const editions = [
    ["US-Letter", [612, 792]],
    ["A4", [595.28, 841.89]],
  ];
  for (const [name, size] of editions) {
    const bytes = await buildDoc(name, size);
    const out = join(ROOT, "dist", `Explorer-OS-Travel-Planner-${name}.pdf`);
    writeFileSync(out, bytes);
    console.log(`✓ ${name.padEnd(9)} ${doc.getPageCount()} pages  ${(bytes.length / 1024).toFixed(0)} KB  → ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
