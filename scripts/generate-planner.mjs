/**
 * Explorer OS — Travel Planner
 * Generates a premium, fillable, print-ready PDF travel planner.
 *
 * Run: node scripts/generate-planner.mjs
 * Output: dist/Explorer-OS-Travel-Planner.pdf
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdirSync, writeFileSync } from "node:fs";

// ---- Page + palette -------------------------------------------------------
const W = 612; // US Letter
const H = 792;
const M = 50; // margin
const CW = W - M * 2; // content width

const ink = rgb(0.11, 0.11, 0.18);
const sub = rgb(0.46, 0.46, 0.55);
const accent = rgb(0.486, 0.424, 1.0); // #7c6cff
const accent2 = rgb(1.0, 0.494, 0.714); // #ff7eb6
const teal = rgb(0.42, 0.83, 0.71);
const amber = rgb(1.0, 0.78, 0.36);
const fill = rgb(0.965, 0.965, 0.98);
const line = rgb(0.86, 0.86, 0.9);
const white = rgb(1, 1, 1);

let doc, F, FB, form;
let nameCounter = 0;
const uid = (base) => `${base}_${nameCounter++}`;

// ---- Drawing helpers ------------------------------------------------------
function page() {
  return doc.addPage([W, H]);
}

function text(p, str, x, y, { size = 11, font = F, color = ink, opacity = 1 } = {}) {
  p.drawText(str, { x, y, size, font, color, opacity });
}

function centerText(p, str, y, { size = 11, font = F, color = ink } = {}) {
  const w = font.widthOfTextAtSize(str, size);
  p.drawText(str, { x: (W - w) / 2, y, size, font, color });
}

function softBox(p, x, y, w, h, { color = fill, border = null } = {}) {
  p.drawRectangle({ x, y, width: w, height: h, color, ...(border ? { borderColor: border, borderWidth: 1 } : {}) });
}

// Section header with a colored tag chip + title + divider.
function header(p, tag, title, accentColor = accent) {
  p.drawRectangle({ x: M, y: H - M - 6, width: 26, height: 6, color: accentColor });
  text(p, tag.toUpperCase(), M + 34, H - M - 9, { size: 9, font: FB, color: sub });
  text(p, title, M, H - M - 38, { size: 22, font: FB, color: ink });
  p.drawLine({ start: { x: M, y: H - M - 50 }, end: { x: W - M, y: H - M - 50 }, thickness: 1, color: line });
}

function footer(p, label, n) {
  p.drawLine({ start: { x: M, y: 44 }, end: { x: W - M, y: 44 }, thickness: 0.8, color: line });
  text(p, "Explorer OS • The Travel Planner", M, 30, { size: 8, font: F, color: sub });
  const r = `${label}`;
  const rw = F.widthOfTextAtSize(r, 8);
  text(p, r, W - M - rw, 30, { size: 8, font: F, color: sub });
}

// Fillable text field rendered as a soft input box.
function field(p, x, y, w, h, { multiline = false, size = 11, label = null } = {}) {
  if (label) text(p, label, x, y + h + 4, { size: 8, font: FB, color: sub });
  softBox(p, x, y, w, h);
  const tf = form.createTextField(uid("f"));
  if (multiline) tf.enableMultiline();
  tf.addToPage(p, { x, y, width: w, height: h, borderWidth: 0, backgroundColor: fill, font: F });
  tf.setFontSize(size);
  return tf;
}

// Labeled line of writing (printable underline) + fillable field on top.
function checkboxRow(p, x, y, label, w = CW) {
  const cb = form.createCheckBox(uid("c"));
  cb.addToPage(p, { x, y, width: 12, height: 12, borderWidth: 1.2, borderColor: accent });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: x + 22, y: y - 3, width: w - 24, height: 18, borderWidth: 0, backgroundColor: white, font: F });
  tf.setFontSize(10);
  if (label) tf.setText(label);
  p.drawLine({ start: { x: x + 22, y: y - 4 }, end: { x: x + w - 2, y: y - 4 }, thickness: 0.6, color: line });
}

// A simple writing line.
function writeLine(p, x, y, w) {
  p.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.6, color: line });
}

// ---- Pages ----------------------------------------------------------------
function coverPage() {
  const p = page();
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.07, 0.07, 0.12) });
  // decorative glow circles
  p.drawCircle({ x: 120, y: 660, size: 150, color: accent, opacity: 0.22 });
  p.drawCircle({ x: 500, y: 150, size: 170, color: accent2, opacity: 0.18 });
  p.drawCircle({ x: 470, y: 600, size: 90, color: teal, opacity: 0.16 });

  centerText(p, "EXPLORER OS", 470, { size: 46, font: FB, color: white });
  centerText(p, "T H E   T R A V E L   P L A N N E R", 432, { size: 13, font: F, color: rgb(0.8, 0.8, 0.9) });
  p.drawLine({ start: { x: 206, y: 410 }, end: { x: 406, y: 410 }, thickness: 1, color: rgb(0.5, 0.5, 0.65) });
  centerText(p, "Plan every trip for the rest of your life.", 380, { size: 12, font: F, color: rgb(0.78, 0.78, 0.88) });

  // "belongs to" field
  text(p, "THIS PLANNER BELONGS TO", M, 230, { size: 9, font: FB, color: rgb(0.7, 0.7, 0.82) });
  const tf = form.createTextField(uid("f"));
  tf.addToPage(p, { x: M, y: 196, width: CW, height: 28, borderWidth: 0, backgroundColor: rgb(0.16, 0.16, 0.24), font: F, textColor: white });
  tf.setFontSize(13);

  centerText(p, "Fillable  •  Reusable  •  Unlimited trips", 120, { size: 11, font: F, color: rgb(0.7, 0.7, 0.85) });
}

function welcomePage() {
  const p = page();
  header(p, "Start here", "How to use your planner");
  const items = [
    ["1.  Make it yours", "Open this PDF in any reader that supports forms (Adobe Acrobat, Apple Books / Preview, or a tablet app like GoodNotes). Tap any soft-gray box and start typing."],
    ["2.  One planner, unlimited trips", "Duplicate the day, budget, and packing pages for each new trip — or print them as many times as you like."],
    ["3.  Plan in order", "Trip Overview, then Itinerary, Budget, Packing, and Reservations. Finish with the Journal while you travel."],
    ["4.  Print or go digital", "Designed for clean printing on US Letter, and fully fillable on screen. Checkboxes tick on tap."],
  ];
  let y = H - M - 90;
  for (const [t, d] of items) {
    text(p, t, M, y, { size: 13, font: FB, color: accent });
    // wrap description
    const words = d.split(" ");
    let lineStr = "";
    let yy = y - 18;
    for (const w of words) {
      const test = lineStr ? lineStr + " " + w : w;
      if (F.widthOfTextAtSize(test, 11) > CW) {
        text(p, lineStr, M, yy, { size: 11, color: sub });
        yy -= 15;
        lineStr = w;
      } else lineStr = test;
    }
    text(p, lineStr, M, yy, { size: 11, color: sub });
    y = yy - 34;
  }
  // contents
  text(p, "WHAT'S INSIDE", M, y, { size: 9, font: FB, color: sub });
  const toc = ["Trip Overview", "Pre-Trip Checklist", "Daily Itinerary (×5)", "Budget Planner", "Expense Log", "Packing List", "Reservations", "Travel Journal", "Bucket List"];
  let ty = y - 20;
  toc.forEach((t, i) => {
    const col = i % 2;
    const cx = M + col * (CW / 2);
    if (col === 0 && i > 0) ty -= 0;
    text(p, "•  " + t, cx, ty - Math.floor(i / 2) * 20, { size: 11, color: ink });
  });
  footer(p, "Welcome", 2);
}

function overviewPage() {
  const p = page();
  header(p, "Section 01", "Trip Overview");
  let y = H - M - 92;
  const half = (CW - 16) / 2;
  field(p, M, y, half, 26, { label: "TRIP NAME" });
  field(p, M + half + 16, y, half, 26, { label: "DESTINATION" });
  y -= 64;
  const third = (CW - 32) / 3;
  field(p, M, y, third, 26, { label: "START DATE" });
  field(p, M + third + 16, y, third, 26, { label: "END DATE" });
  field(p, M + (third + 16) * 2, y, third, 26, { label: "DURATION" });
  y -= 64;
  field(p, M, y, half, 26, { label: "TRAVELERS" });
  field(p, M + half + 16, y, half, 26, { label: "TRAVEL TYPE (city / beach / road trip…)" });
  y -= 64;
  field(p, M, y, half, 26, { label: "TOTAL BUDGET" });
  field(p, M + half + 16, y, half, 26, { label: "ACCOMMODATION" });
  y -= 70;
  field(p, M, y - 64, CW, 90, { label: "TOP 3 GOALS FOR THIS TRIP", multiline: true });
  y -= 150;
  field(p, M, y - 50, CW, 70, { label: "NOTES", multiline: true });
  footer(p, "Trip Overview", 3);
}

function checklistPage() {
  const p = page();
  header(p, "Section 02", "Pre-Trip Checklist", accent2);
  const groups = {
    "8 weeks before": ["Book flights / transport", "Book accommodation", "Check passport validity", "Apply for visas if needed"],
    "2 weeks before": ["Travel insurance", "Notify bank of travel", "Arrange airport transfer", "Download offline maps"],
    "Few days before": ["Check in online", "Charge devices & power bank", "Print / save reservations", "Confirm pet / plant / house care"],
  };
  let y = H - M - 84;
  for (const [title, items] of Object.entries(groups)) {
    text(p, title.toUpperCase(), M, y, { size: 10, font: FB, color: accent });
    y -= 22;
    for (const it of items) {
      checkboxRow(p, M, y, it);
      y -= 24;
    }
    y -= 14;
  }
  footer(p, "Pre-Trip Checklist", 4);
}

function itineraryPage(n) {
  const p = page();
  header(p, `Section 03 • Day ${n}`, "Daily Itinerary");
  // date + place row
  let y = H - M - 92;
  const half = (CW - 16) / 2;
  field(p, M, y, half, 24, { label: "DATE" });
  field(p, M + half + 16, y, half, 24, { label: "CITY / AREA" });
  y -= 54;
  const blocks = ["Morning", "Afternoon", "Evening"];
  for (const b of blocks) {
    softBox(p, M, y - 70, 6, 92, { color: b === "Morning" ? amber : b === "Afternoon" ? accent : accent2 });
    text(p, b.toUpperCase(), M + 16, y + 8, { size: 10, font: FB, color: ink });
    field(p, M + 16, y - 70, CW - 16, 74, { multiline: true });
    y -= 104;
  }
  // meals + notes
  field(p, M, y - 30, half, 50, { label: "MEALS / RESTAURANTS", multiline: true });
  field(p, M + half + 16, y - 30, half, 50, { label: "BUDGET TODAY", multiline: true });
  footer(p, `Itinerary • Day ${n}`, 4 + n);
}

function budgetPage() {
  const p = page();
  header(p, "Section 04", "Budget Planner", teal);
  const cats = ["Flights", "Accommodation", "Food & Drink", "Activities", "Transport", "Shopping", "Insurance", "Miscellaneous"];
  // table header
  let y = H - M - 84;
  const c1 = M, c2 = M + 230, c3 = M + 360;
  text(p, "CATEGORY", c1, y, { size: 9, font: FB, color: sub });
  text(p, "PLANNED", c2, y, { size: 9, font: FB, color: sub });
  text(p, "ACTUAL", c3, y, { size: 9, font: FB, color: sub });
  y -= 10;
  p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: line });
  y -= 30;
  for (const c of cats) {
    text(p, c, c1, y + 4, { size: 11, color: ink });
    const pf = field(p, c2, y - 2, 110, 22, {});
    const af = field(p, c3, y - 2, 110, 22, {});
    y -= 34;
  }
  // totals
  y -= 6;
  softBox(p, M, y - 8, CW, 40, { color: rgb(0.95, 0.93, 1) });
  text(p, "TOTAL", c1 + 6, y + 8, { size: 12, font: FB, color: accent });
  field(p, c2, y + 2, 110, 22, {});
  field(p, c3, y + 2, 110, 22, {});
  // budget vs spent helper
  y -= 60;
  const half = (CW - 16) / 2;
  field(p, M, y, half, 24, { label: "BUDGET REMAINING" });
  field(p, M + half + 16, y, half, 24, { label: "COST PER DAY" });
  footer(p, "Budget Planner", 10);
}

function expenseLogPage() {
  const p = page();
  header(p, "Section 04b", "Expense Log");
  let y = H - M - 84;
  const cols = [["DATE", M, 80], ["DESCRIPTION", M + 92, 250], ["CATEGORY", M + 354, 90], ["AMOUNT", M + 456, 56]];
  for (const [t, x] of cols) text(p, t, x, y, { size: 9, font: FB, color: sub });
  y -= 8;
  p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: line });
  y -= 26;
  for (let i = 0; i < 18; i++) {
    for (const [, x, w] of cols) field(p, x, y, w, 18, {});
    y -= 24;
  }
  footer(p, "Expense Log", 11);
}

function packingPage() {
  const p = page();
  header(p, "Section 05", "Packing List", accent2);
  const groups = {
    Clothing: ["", "", "", "", ""],
    Toiletries: ["", "", "", ""],
    Tech: ["", "", "", ""],
    Documents: ["Passport / ID", "Tickets", "Insurance", ""],
    "Health / Misc": ["", "", "", ""],
  };
  const colX = [M, M + CW / 2 + 8];
  let col = 0;
  let y = H - M - 84;
  const startY = y;
  for (const [title, items] of Object.entries(groups)) {
    const x = colX[col];
    text(p, title.toUpperCase(), x, y, { size: 10, font: FB, color: accent });
    y -= 22;
    for (const it of items) {
      checkboxRow(p, x, y, it, CW / 2 - 12);
      y -= 22;
    }
    y -= 16;
    if (y < 120 && col === 0) {
      col = 1;
      y = startY;
    }
  }
  footer(p, "Packing List", 12);
}

function reservationsPage() {
  const p = page();
  header(p, "Section 06", "Reservations", teal);
  const types = ["Flight", "Hotel / Airbnb", "Rental Car", "Train / Ferry"];
  let y = H - M - 88;
  for (const t of types) {
    softBox(p, M, y - 70, CW, 84, { color: rgb(0.975, 0.975, 0.99), border: line });
    text(p, t.toUpperCase(), M + 12, y - 2, { size: 11, font: FB, color: accent });
    const half = (CW - 40) / 2;
    field(p, M + 12, y - 36, half, 20, { label: null });
    text(p, "Provider / details", M + 12, y - 16, { size: 7.5, font: F, color: sub });
    field(p, M + 28 + half, y - 36, half, 20, {});
    text(p, "Confirmation #", M + 28 + half, y - 16, { size: 7.5, font: F, color: sub });
    field(p, M + 12, y - 64, half, 20, {});
    text(p, "Check-in / date", M + 12, y - 44, { size: 7.5, font: F, color: sub });
    field(p, M + 28 + half, y - 64, half, 20, {});
    text(p, "Check-out / cost", M + 28 + half, y - 44, { size: 7.5, font: F, color: sub });
    y -= 104;
  }
  footer(p, "Reservations", 13);
}

function journalPage(n) {
  const p = page();
  header(p, `Section 07 • Entry ${n}`, "Travel Journal", accent2);
  let y = H - M - 92;
  const half = (CW - 16) / 2;
  field(p, M, y, half, 24, { label: "DATE" });
  field(p, M + half + 16, y, half, 24, { label: "MOOD / RATING" });
  y -= 58;
  field(p, M, y - 70, CW, 92, { label: "TODAY'S HIGHLIGHTS", multiline: true });
  y -= 130;
  field(p, M, y - 50, half, 70, { label: "FAVORITE MOMENT", multiline: true });
  field(p, M + half + 16, y - 50, half, 70, { label: "PLACES DISCOVERED", multiline: true });
  y -= 110;
  field(p, M, y - 40, CW, 60, { label: "NOTE TO MY FUTURE SELF", multiline: true });
  footer(p, `Journal • Entry ${n}`, 13 + n);
}

function bucketListPage() {
  const p = page();
  header(p, "Section 08", "Travel Bucket List");
  text(p, "Tick a box every time a dream becomes a memory.", M, H - M - 70, { size: 11, color: sub });
  let y = H - M - 104;
  const colX = [M, M + CW / 2 + 8];
  for (let col = 0; col < 2; col++) {
    let yy = y;
    for (let i = 0; i < 16; i++) {
      checkboxRow(p, colX[col], yy, "", CW / 2 - 12);
      yy -= 26;
    }
  }
  footer(p, "Bucket List", 16);
}

function backPage() {
  const p = page();
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.07, 0.07, 0.12) });
  p.drawCircle({ x: 480, y: 660, size: 140, color: accent2, opacity: 0.18 });
  p.drawCircle({ x: 110, y: 160, size: 150, color: accent, opacity: 0.2 });
  centerText(p, "Bon voyage", 430, { size: 30, font: FB, color: white });
  centerText(p, "Thank you for planning with Explorer OS.", 396, { size: 12, font: F, color: rgb(0.8, 0.8, 0.9) });
  centerText(p, "Reuse this planner for every trip, for years to come.", 374, { size: 11, font: F, color: rgb(0.66, 0.66, 0.8) });
}

// ---- Build ----------------------------------------------------------------
async function build() {
  doc = await PDFDocument.create();
  doc.setTitle("Explorer OS — The Travel Planner");
  doc.setAuthor("Explorer OS");
  doc.setSubject("A premium fillable, printable travel planner");
  doc.setKeywords(["travel planner", "itinerary", "budget", "packing list", "printable", "fillable"]);
  F = await doc.embedFont(StandardFonts.Helvetica);
  FB = await doc.embedFont(StandardFonts.HelveticaBold);
  form = doc.getForm();

  coverPage();
  welcomePage();
  overviewPage();
  checklistPage();
  for (let d = 1; d <= 5; d++) itineraryPage(d);
  budgetPage();
  expenseLogPage();
  packingPage();
  reservationsPage();
  for (let j = 1; j <= 2; j++) journalPage(j);
  bucketListPage();
  backPage();

  // keep field appearances clean
  form.updateFieldAppearances(F);

  const bytes = await doc.save();
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/Explorer-OS-Travel-Planner.pdf", bytes);
  console.log(`Wrote dist/Explorer-OS-Travel-Planner.pdf (${doc.getPageCount()} pages, ${(bytes.length / 1024).toFixed(0)} KB)`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
