const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: "Milestone 2 Correction — Lens Scoring Architecture",
    Author: "Reliy Dev Team",
    Subject: "Ethical Insight Pro — Algorithm v2.0.1",
  },
});

const outPath = path.join(__dirname, "Milestone2_LensScoring_Correction_Report.pdf");
doc.pipe(fs.createWriteStream(outPath));

const PAGE_W = 612 - 55 - 55; // usable width
const BLACK = "#000000";
const GRAY = "#555555";
const LIGHT_GRAY = "#CCCCCC";
const WHITE = "#FFFFFF";

// ── Helpers ──
function heading(text, size = 18) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(size).fillColor(BLACK).text(text);
  doc.moveDown(0.2);
  const y = doc.y;
  doc.moveTo(55, y).lineTo(55 + PAGE_W, y).lineWidth(1.2).strokeColor(BLACK).stroke();
  doc.moveDown(0.5);
}

function subheading(text) {
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK).text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.font("Helvetica").fontSize(9.5).fillColor(BLACK).text(text, { lineGap: 3 });
}

function bullet(text) {
  doc.font("Helvetica").fontSize(9.5).fillColor(BLACK);
  const x = doc.x;
  doc.text("\u2022  " + text, x, doc.y, { indent: 8, lineGap: 2.5 });
}

function tableRow(cells, widths, opts = {}) {
  const startX = 55;
  const startY = doc.y;
  const font = opts.bold ? "Helvetica-Bold" : "Helvetica";
  const bg = opts.bg || null;
  const fontSize = opts.fontSize || 8.5;
  let maxH = 0;

  // measure heights
  const heights = cells.map((cell, i) => {
    const h = doc.font(font).fontSize(fontSize).heightOfString(cell, { width: widths[i] - 10 });
    return h + 10;
  });
  maxH = Math.max(...heights);

  // draw bg
  if (bg) {
    doc.rect(startX, startY, widths.reduce((a, b) => a + b, 0), maxH).fill(bg);
  }

  // draw borders & text
  let cx = startX;
  cells.forEach((cell, i) => {
    doc.rect(cx, startY, widths[i], maxH).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
    doc.font(font).fontSize(fontSize).fillColor(BLACK)
      .text(cell, cx + 5, startY + 5, { width: widths[i] - 10 });
    cx += widths[i];
  });

  doc.y = startY + maxH;
}

function ensureSpace(needed) {
  if (doc.y + needed > 700) doc.addPage();
}

// ══════════════════════════════════════════════════════════════════
// PAGE 1 — COVER / HEADER
// ══════════════════════════════════════════════════════════════════

doc.rect(0, 0, 612, 100).fill(BLACK);
doc.font("Helvetica-Bold").fontSize(22).fillColor(WHITE)
  .text("ETHICAL INSIGHT PRO", 55, 30, { width: PAGE_W });
doc.font("Helvetica").fontSize(12).fillColor(WHITE)
  .text("Milestone 2 Correction Report — Lens Scoring Architecture", 55, 58);
doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY)
  .text("Algorithm v2.0.1  |  February 2026  |  Reliy Dev Team", 55, 78);

doc.y = 120;

// ── Executive Summary ──
heading("Executive Summary", 16);
body(
  "The Milestone 2 build required users to manually assign 1-10 alignment scores to each of the six ethical lenses via slider inputs. " +
  "This violated the book's methodology — the algorithm must be the sole authority for lens scoring. " +
  "This report documents the defect, the correction implemented, and the verified deployment of Algorithm v2.0.1."
);
doc.moveDown(0.5);

// ── Problem ──
heading("1. Problem Identified", 14);
body(
  "The user was the source of all lens scores. The AI (Gemini 2.0 Flash) was explicitly told \"Do NOT assign numeric scores.\" " +
  "User-provided slider values were passed directly into the deterministic guardrails layer and fed into the 70/30 composite formula. " +
  "The guardrails layer was structurally correct but operated on subjective user opinion."
);
doc.moveDown(0.4);

subheading("Impact of User Self-Scoring");
bullet("Dataset becomes subjective opinion, not analytical output.");
bullet("Algorithm loses analytic authority — it echoes user bias.");
bullet("70/30 composite score reflects user consistency, not case analysis.");
bullet("Stability classification (Stable / Contested / Unstable) is user-derived.");
bullet("Research dataset integrity is compromised for publication.");
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// DIAGRAM 1: BEFORE (Incorrect Flow)
// ══════════════════════════════════════════════════════════════════
heading("2. Architecture: Before vs After", 14);
ensureSpace(200);

subheading("BEFORE — Incorrect Data Flow (v2.0)");
doc.moveDown(0.3);

// Draw flow diagram
const dY1 = doc.y;
const boxH = 32;
const boxW = 110;
const gap = 18;
const startXDiag = 70;

function drawBox(x, y, w, h, label, sublabel) {
  doc.rect(x, y, w, h).lineWidth(1).strokeColor(BLACK).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK)
    .text(label, x + 4, y + 4, { width: w - 8, align: "center" });
  if (sublabel) {
    doc.font("Helvetica").fontSize(6.5).fillColor(GRAY)
      .text(sublabel, x + 4, y + 16, { width: w - 8, align: "center" });
  }
}

function arrow(x1, y1, x2, y2, label) {
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(1).strokeColor(BLACK).stroke();
  // arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 6;
  doc.moveTo(x2, y2)
    .lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4))
    .lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4))
    .closePath().fill(BLACK);
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 8;
    doc.font("Helvetica").fontSize(6).fillColor(GRAY).text(label, mx - 30, my, { width: 60, align: "center" });
  }
}

// Boxes
const bx1 = startXDiag;
const bx2 = bx1 + boxW + gap + 20;
const bx3 = bx2 + boxW + gap + 20;
const bx4 = bx3 + boxW + gap + 20;

drawBox(bx1, dY1, boxW, boxH, "USER", "6 Sliders (1-10)");
drawBox(bx2, dY1, boxW, boxH, "FRONTEND", "Sends lensScores");
drawBox(bx3, dY1, boxW, boxH, "GUARDRAILS", "Uses USER scores");
drawBox(bx1 + 60, dY1 + boxH + 30, boxW, boxH, "AI (Gemini)", "Reasoning ONLY");

// Arrows
arrow(bx1 + boxW, dY1 + boxH / 2, bx2, dY1 + boxH / 2, "scores + narrative");
arrow(bx2 + boxW, dY1 + boxH / 2, bx3, dY1 + boxH / 2, "user scores pass-thru");
arrow(bx2 + boxW / 2, dY1 + boxH, bx1 + 60 + boxW / 2, dY1 + boxH + 30, "prompt");

// X mark on the diagram
doc.font("Helvetica-Bold").fontSize(24).fillColor("#CC0000")
  .text("X", bx3 + boxW / 2 - 8, dY1 - 18);
doc.font("Helvetica-Bold").fontSize(7).fillColor("#CC0000")
  .text("INCORRECT", bx3 + boxW / 2 - 20, dY1 + boxH + 4);

doc.y = dY1 + boxH + 30 + boxH + 20;

// ══════════════════════════════════════════════════════════════════
// DIAGRAM 2: AFTER (Correct Flow)
// ══════════════════════════════════════════════════════════════════
ensureSpace(170);
subheading("AFTER — Correct Data Flow (v2.0.1)");
doc.moveDown(0.3);

const dY2 = doc.y;

drawBox(bx1, dY2, boxW, boxH, "USER", "Narrative only");
drawBox(bx2, dY2, boxW, boxH, "AI (Gemini)", "Scores + Reasoning");
drawBox(bx3, dY2, boxW, boxH, "GUARDRAILS", "Clamp + Composite");
drawBox(bx3, dY2 + boxH + 25, boxW, boxH, "OUTPUT", "Non-prescriptive report");

arrow(bx1 + boxW, dY2 + boxH / 2, bx2, dY2 + boxH / 2, "narrative + codes");
arrow(bx2 + boxW, dY2 + boxH / 2, bx3, dY2 + boxH / 2, "AI scores (1-10)");
arrow(bx3 + boxW / 2, dY2 + boxH, bx3 + boxW / 2, dY2 + boxH + 25, "validated");

doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
  .text("CORRECT", bx3 + boxW / 2 - 22, dY2 - 14);

doc.y = dY2 + boxH + 25 + boxH + 25;

// ══════════════════════════════════════════════════════════════════
// ROLE SEPARATION TABLE
// ══════════════════════════════════════════════════════════════════
ensureSpace(120);
heading("3. Role Separation", 14);

const tw = [90, 180, PAGE_W - 270];
tableRow(["Actor", "Role", "Provides"], tw, { bold: true, bg: "#E8E8E8" });
tableRow(["User", "Subject-matter expert", "Narrative text, stakeholder context, professional codes"], tw);
tableRow(["AI (Gemini)", "Analytical engine", "Qualitative reasoning + numeric alignment scores (1-10) per lens"], tw);
tableRow(["Guardrails", "Deterministic safety net", "Score clamping, composite computation, stability classification, violation caps"], tw);
tableRow(["Output", "Non-prescriptive report", "Lens cards, radar chart, composite score, conflict alerts, reflective questions"], tw);
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// CHANGES IMPLEMENTED
// ══════════════════════════════════════════════════════════════════
ensureSpace(160);
heading("4. Changes Implemented", 14);

const cw = [160, PAGE_W - 160];
tableRow(["File", "Change"], cw, { bold: true, bg: "#E8E8E8" });
tableRow(
  ["src/pages/CaseIntake.tsx",
   "Removed Slider import, lensScores state (6 sliders), entire Ethical Lens Scoring UI section, lensScores from analyzeCase() call. Form now collects: Title, Description, Stakeholders, Professional Codes, Consent only."],
  cw
);
tableRow(
  ["src/services/aiAnalysis.ts",
   "Removed lensScores from AnalysisRequest interface and request body payload. Response interfaces unchanged."],
  cw
);
tableRow(
  ["supabase/functions/analyze-case/index.ts",
   "Updated AI prompt to request numeric scores (1-10) + reasoning per lens. Changed JSON schema from lensReasoning (flat strings) to lensAnalysis (score + reasoning objects). Rewired applyGuardrails() to extract AI scores. Removed user score passthrough. Bumped to v2.0.1."],
  cw
);
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// PRESERVED (UNCHANGED)
// ══════════════════════════════════════════════════════════════════
ensureSpace(160);
heading("5. What Was Preserved (Unchanged)", 14);

subheading("Deterministic Guardrails Logic");
bullet("clampScore() — validates and clamps all scores to integers 1-10");
bullet("standardDeviation() — unchanged");
bullet("70/30 formula: lensComponent = lensAverage * 0.30, codeComponent = codeScore * 0.70");
bullet("Violation cap: composite <= 4.9 when any professional code violation detected");
bullet("Stability thresholds: stdDev > 2.5 = Contested, violation = Ethically Unstable");
bullet("Code compliance mapping: multi_violation=1, single_violation=3, tension=6, none=9");
doc.moveDown(0.3);

subheading("Frontend & Infrastructure");
bullet("All 9 results display components — zero changes");
bullet("Authentication, authorization, usage limits, consent flows — zero changes");
bullet("Admin dashboard — zero changes");
bullet("Database schema — no migration required");
bullet("_internal metadata fields preserved for research dataset integrity");
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// AI PROMPT SCHEMA CHANGE
// ══════════════════════════════════════════════════════════════════
ensureSpace(160);
heading("6. AI Response Schema: Before vs After", 14);

const sw = [PAGE_W / 2, PAGE_W / 2];
tableRow(["BEFORE (v2.0)", "AFTER (v2.0.1)"], sw, { bold: true, bg: "#E8E8E8" });
tableRow(
  ['lensReasoning: {\n  utilitarian: "<reasoning>",\n  duty: "<reasoning>",\n  ...\n}',
   'lensAnalysis: {\n  utilitarian: { score: 8, reasoning: "..." },\n  duty: { score: 3, reasoning: "..." },\n  ...\n}'],
  sw, { fontSize: 7.5 }
);
doc.moveDown(0.3);
body("The AI now returns both a numeric alignment score and qualitative reasoning for each lens. The guardrails layer extracts, validates, and clamps these AI scores before computing the composite.");
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// COMPOSITE FORMULA DIAGRAM
// ══════════════════════════════════════════════════════════════════
ensureSpace(130);
heading("7. Composite Score Formula (Unchanged)", 14);
doc.moveDown(0.2);

const fY = doc.y;
const fX = 80;
const fW = PAGE_W - 50;
const fH = 80;

doc.rect(fX, fY, fW, fH).lineWidth(1).strokeColor(BLACK).stroke();

doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
  .text("Lens Average = mean(6 AI-computed lens scores)", fX + 15, fY + 8);
doc.font("Helvetica").fontSize(9).fillColor(BLACK)
  .text("Lens Component = Lens Average x 0.30", fX + 15, fY + 22);
doc.font("Helvetica").fontSize(9).fillColor(BLACK)
  .text("Code Component = Code Compliance Score x 0.70", fX + 15, fY + 36);
doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK)
  .text("Composite Score = Lens Component + Code Component", fX + 15, fY + 52);
doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY)
  .text("IF violation detected: Composite = min(Composite, 4.9)", fX + 15, fY + 66);

doc.y = fY + fH + 15;

// ══════════════════════════════════════════════════════════════════
// VERIFICATION
// ══════════════════════════════════════════════════════════════════
ensureSpace(120);
heading("8. Verification & Deployment", 14);

const vw = [200, PAGE_W - 200];
tableRow(["Check", "Result"], vw, { bold: true, bg: "#E8E8E8" });
tableRow(["TypeScript compilation (tsc --noEmit)", "PASS — zero errors"], vw);
tableRow(["Vite production build", "PASS — built in 19s"], vw);
tableRow(["Vitest test suite", "PASS — 1/1 tests"], vw);
tableRow(["Git commit", "30e9945 on main"], vw);
tableRow(["Edge function deployment", "Deployed to dlucayewqghjkylwhnot"], vw);
tableRow(["Algorithm version", "2.0.1 (live)"], vw);
doc.moveDown(0.5);

// ══════════════════════════════════════════════════════════════════
// SIGN-OFF
// ══════════════════════════════════════════════════════════════════
ensureSpace(80);
heading("9. Status", 14);
body("COMPLETED. Algorithm v2.0.1 is deployed and live. Lens scores are now computed exclusively by the AI analysis engine and validated by the deterministic guardrails layer. The user submits narrative context only. Ready to proceed to Milestone 3.");

doc.moveDown(1.5);
const lineY = doc.y;
doc.moveTo(55, lineY).lineTo(250, lineY).lineWidth(0.8).strokeColor(BLACK).stroke();
doc.moveDown(0.3);
doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK).text("Reliy Dev Team");
doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("February 2026");

doc.moveDown(2);
doc.font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY)
  .text("Ethical Insight Pro — Confidential", 55, 720, { width: PAGE_W, align: "center" });

doc.end();
console.log("PDF generated: " + outPath);
