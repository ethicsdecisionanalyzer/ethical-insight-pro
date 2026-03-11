import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MARGIN_LEFT = 54;
const MARGIN_RIGHT = 54;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

// Colors
const CLR_PRIMARY = rgb(0.12, 0.29, 0.49);    // dark navy
const CLR_ACCENT = rgb(0.20, 0.47, 0.73);     // medium blue
const CLR_BODY = rgb(0.15, 0.15, 0.15);       // near-black
const CLR_MUTED = rgb(0.40, 0.40, 0.40);      // gray
const CLR_LIGHT_BG = rgb(0.95, 0.96, 0.97);   // light gray bg
const CLR_RULE = rgb(0.80, 0.82, 0.85);        // subtle rule
const CLR_RED = rgb(0.75, 0.15, 0.15);         // violation red
const CLR_GREEN = rgb(0.12, 0.55, 0.25);       // stable green
const CLR_AMBER = rgb(0.75, 0.55, 0.10);       // contested amber
const CLR_WHITE = rgb(1, 1, 1);

function sanitize(text: string): string {
  return (text || "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\xFF]/g, " ");
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = sanitize(text).split("\n");
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { caseId } = await req.json();
    if (!caseId) return json({ error: "Missing caseId" }, 400);

    const { data: caseData, error: caseErr } = await supabase
      .from("case_submissions")
      .select("*")
      .eq("id", caseId)
      .single();
    if (caseErr || !caseData) return json({ error: "Case not found" }, 404);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (caseData.user_id !== user.id && !isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    if (!caseData.analysis_result) {
      return json({ error: "Analysis not ready" }, 409);
    }

    const analysis = caseData.analysis_result as Record<string, unknown>;

    // ===== PDF Generation =====
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

    let page = doc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN_TOP;
    let pageNum = 1;

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN_BOTTOM) {
        drawFooter();
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN_TOP;
        pageNum++;
      }
    };

    const drawFooter = () => {
      const footText = `Ethical Decision-Making Analyzer  |  Page ${pageNum}`;
      const fw = font.widthOfTextAtSize(footText, 7);
      page.drawText(footText, {
        x: (PAGE_W - fw) / 2,
        y: 30,
        size: 7,
        font,
        color: CLR_MUTED,
      });
      page.drawLine({
        start: { x: MARGIN_LEFT, y: 42 },
        end: { x: PAGE_W - MARGIN_RIGHT, y: 42 },
        thickness: 0.4,
        color: CLR_RULE,
      });
    };

    // --- TITLE BAND ---
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 90,
      width: PAGE_W,
      height: 90,
      color: CLR_PRIMARY,
    });
    page.drawText("Ethics Case Analysis Report", {
      x: MARGIN_LEFT,
      y: PAGE_H - 42,
      size: 22,
      font: bold,
      color: CLR_WHITE,
    });
    const subtitle = `${String(caseData.title || "Untitled Case")}`;
    page.drawText(sanitize(subtitle.length > 70 ? subtitle.slice(0, 67) + "..." : subtitle), {
      x: MARGIN_LEFT,
      y: PAGE_H - 62,
      size: 11,
      font: italic,
      color: rgb(0.80, 0.85, 0.92),
    });
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    page.drawText(dateStr, {
      x: MARGIN_LEFT,
      y: PAGE_H - 78,
      size: 8,
      font,
      color: rgb(0.65, 0.72, 0.82),
    });
    y = PAGE_H - 110;

    // --- Helper: Section Header ---
    const sectionHeader = (title: string) => {
      ensureSpace(32);
      y -= 10;
      page.drawText(sanitize(title), {
        x: MARGIN_LEFT,
        y,
        size: 13,
        font: bold,
        color: CLR_PRIMARY,
      });
      y -= 4;
      page.drawLine({
        start: { x: MARGIN_LEFT, y },
        end: { x: MARGIN_LEFT + CONTENT_W, y },
        thickness: 1.2,
        color: CLR_ACCENT,
      });
      y -= 12;
    };

    // --- Helper: Sub-header ---
    const subHeader = (title: string) => {
      ensureSpace(20);
      y -= 4;
      page.drawText(sanitize(title), {
        x: MARGIN_LEFT,
        y,
        size: 10.5,
        font: bold,
        color: CLR_ACCENT,
      });
      y -= 14;
    };

    // --- Helper: Label-value pair ---
    const labelValue = (label: string, value: string, size = 9.5) => {
      ensureSpace(size + 6);
      const lw = bold.widthOfTextAtSize(label, size);
      page.drawText(sanitize(label), { x: MARGIN_LEFT, y, size, font: bold, color: CLR_BODY });
      page.drawText(sanitize(value), { x: MARGIN_LEFT + lw + 3, y, size, font, color: CLR_BODY });
      y -= size + 6;
    };

    // --- Helper: Body text ---
    const bodyText = (text: string, size = 9, indent = 0, color = CLR_BODY) => {
      const lines = wrapText(text, font, size, CONTENT_W - indent);
      for (const line of lines) {
        ensureSpace(size + 3.5);
        page.drawText(line, { x: MARGIN_LEFT + indent, y, size, font, color });
        y -= size + 3.5;
      }
    };

    // --- Helper: Bullet ---
    const bullet = (text: string, size = 9, color = CLR_BODY) => {
      ensureSpace(size + 3.5);
      page.drawText("\u2022", { x: MARGIN_LEFT + 8, y: y + 0.5, size: size + 1, font, color: CLR_ACCENT });
      const lines = wrapText(text, font, size, CONTENT_W - 22);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) ensureSpace(size + 3.5);
        page.drawText(lines[i], { x: MARGIN_LEFT + 22, y, size, font, color });
        y -= size + 3.5;
      }
    };

    // --- Helper: Score box ---
    const scoreBox = (lensName: string, score: number, reasoning: string) => {
      const boxH = 14;
      ensureSpace(boxH + 60);

      // Lens label
      page.drawText(sanitize(lensName), {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: bold,
        color: CLR_PRIMARY,
      });

      // Score badge
      const scoreStr = `${score}/10`;
      const sw = bold.widthOfTextAtSize(scoreStr, 9);
      const badgeX = MARGIN_LEFT + CONTENT_W - sw - 14;
      const scoreBg = score <= 3 ? CLR_RED : score <= 6 ? CLR_AMBER : CLR_GREEN;
      page.drawRectangle({
        x: badgeX,
        y: y - 3,
        width: sw + 14,
        height: 16,
        color: scoreBg,
        borderWidth: 0,
      });
      page.drawText(scoreStr, {
        x: badgeX + 7,
        y: y,
        size: 9,
        font: bold,
        color: CLR_WHITE,
      });
      y -= 16;

      // Reasoning
      if (reasoning) {
        bodyText(reasoning, 8.5, 0, CLR_MUTED);
      }
      y -= 4;
    };

    // ===============================================
    // SECTION 1: CASE INFORMATION
    // ===============================================
    sectionHeader("Case Information");
    labelValue("Title:  ", String(caseData.title || "Untitled"));
    y -= 2;
    bodyText(String(caseData.narrative || ""), 9);
    y -= 4;
    labelValue("Stakeholders:  ", String(caseData.stakeholders || "Not specified"));
    labelValue("Professional Codes:  ",
      Array.isArray(caseData.selected_codes) ? caseData.selected_codes.join(", ") : "");

    // ===============================================
    // SECTION 2: ANALYSIS SUMMARY (boxed)
    // ===============================================
    sectionHeader("Analysis Summary");
    const compositeScore = Number(analysis.compositeScore ?? 0);
    const stability = String(analysis.ethicalStability ?? "N/A");
    const conflictLevel = Number(analysis.conflictLevel ?? 1);

    // Summary box
    ensureSpace(55);
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 40,
      width: CONTENT_W,
      height: 50,
      color: CLR_LIGHT_BG,
      borderWidth: 0,
    });

    // Composite Score
    const csStr = compositeScore.toFixed(1);
    page.drawText("Composite Score", { x: MARGIN_LEFT + 14, y: y - 4, size: 7.5, font, color: CLR_MUTED });
    page.drawText(csStr, { x: MARGIN_LEFT + 14, y: y - 20, size: 18, font: bold, color: compositeScore <= 4.9 ? CLR_RED : compositeScore <= 7 ? CLR_AMBER : CLR_GREEN });
    page.drawText("/ 10", { x: MARGIN_LEFT + 14 + bold.widthOfTextAtSize(csStr, 18) + 3, y: y - 18, size: 9, font, color: CLR_MUTED });

    // Ethical Stability
    const stabColor = stability === "Stable" ? CLR_GREEN : stability === "Contested" ? CLR_AMBER : CLR_RED;
    page.drawText("Ethical Stability", { x: MARGIN_LEFT + 140, y: y - 4, size: 7.5, font, color: CLR_MUTED });
    page.drawText(sanitize(stability), { x: MARGIN_LEFT + 140, y: y - 18, size: 12, font: bold, color: stabColor });

    // Conflict Level
    page.drawText("Conflict Level", { x: MARGIN_LEFT + 320, y: y - 4, size: 7.5, font, color: CLR_MUTED });
    page.drawText(`${conflictLevel} / 3`, { x: MARGIN_LEFT + 320, y: y - 18, size: 12, font: bold, color: conflictLevel >= 3 ? CLR_RED : conflictLevel >= 2 ? CLR_AMBER : CLR_GREEN });

    // Algorithm version (small)
    page.drawText(`Algorithm v${analysis._algorithmVersion || "2.1"}`, { x: MARGIN_LEFT + 420, y: y - 34, size: 7, font, color: CLR_MUTED });

    y -= 56;

    // ===============================================
    // SECTION 3: SIX-LENS ETHICAL ANALYSIS
    // ===============================================
    sectionHeader("Six-Lens Ethical Analysis");
    const lensNames: Record<string, string> = {
      utilitarian: "Utilitarian (Consequences)",
      duty: "Deontological / Duty",
      justice: "Justice / Fairness",
      virtue: "Virtue Ethics",
      care: "Care Ethics",
      commonGood: "Common Good",
    };
    const lensScores = (analysis.lensScores || {}) as Record<string, Record<string, unknown>>;
    for (const [key, label] of Object.entries(lensNames)) {
      const lens = lensScores[key] || {};
      scoreBox(label, Number(lens.score ?? 0), String(lens.reasoning || ""));
    }

    // ===============================================
    // SECTION 4: VIOLATION DETECTION
    // ===============================================
    const vd = (analysis.violationDetection || {}) as Record<string, unknown>;
    const hasViolation = vd.hasViolation === true;
    sectionHeader("Violation Detection");

    ensureSpace(20);
    if (hasViolation) {
      const sevLabel = String(vd.violationSeverity ?? "none").replace(/_/g, " ").toUpperCase();
      page.drawText(`VIOLATION DETECTED  -  ${sevLabel}`, {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: bold,
        color: CLR_RED,
      });
      y -= 14;
      if (Array.isArray(vd.violatedCodes) && vd.violatedCodes.length) {
        labelValue("Violated Codes:  ", vd.violatedCodes.join(", "));
      }
    } else {
      page.drawText("No professional code violations detected.", {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font,
        color: CLR_GREEN,
      });
      y -= 14;
    }
    if (vd.violationDetails) {
      y -= 2;
      bodyText(String(vd.violationDetails), 8.5, 0, CLR_MUTED);
    }

    // ===============================================
    // SECTION 5: PROFESSIONAL CODE IMPLICATIONS
    // ===============================================
    const ca = (analysis.conflictAnalysis || {}) as Record<string, unknown>;
    const implications = (ca.professionalCodeImplications || {}) as Record<string, unknown>;
    if (Object.keys(implications).length) {
      sectionHeader("Professional Code Implications");
      for (const [code, text] of Object.entries(implications)) {
        subHeader(code);
        bodyText(String(text), 8.5, 0, CLR_MUTED);
        y -= 4;
      }
    }

    // ===============================================
    // SECTION 6: PRIMARY TENSIONS
    // ===============================================
    const tensions = Array.isArray(ca.primaryTensions) ? ca.primaryTensions : [];
    if (tensions.length) {
      sectionHeader("Primary Tensions");
      for (const t of tensions) bullet(String(t), 9);
    }

    // ===============================================
    // SECTION 7: ANALYTICAL OBSERVATIONS
    // ===============================================
    const obs = Array.isArray(analysis.analyticalObservations) ? analysis.analyticalObservations : [];
    if (obs.length) {
      sectionHeader("Analytical Observations");
      for (const o of obs) bullet(String(o), 9);
    }

    // ===============================================
    // SECTION 8: QUESTIONS FOR REFLECTION
    // ===============================================
    const qs = Array.isArray(analysis.questionsForReflection) ? analysis.questionsForReflection : [];
    if (qs.length) {
      sectionHeader("Questions for Reflection");
      for (const q of qs) bullet(String(q), 9);
    }

    // ===============================================
    // SECTION 9: WARNING FLAGS
    // ===============================================
    const flags = Array.isArray(analysis.warningFlags) ? analysis.warningFlags : [];
    if (flags.length) {
      sectionHeader("Warning Flags");
      for (const f of flags) bullet(String(f), 9, CLR_RED);
    }

    // ===============================================
    // DISCLAIMER
    // ===============================================
    ensureSpace(40);
    y -= 14;
    page.drawLine({
      start: { x: MARGIN_LEFT, y: y + 6 },
      end: { x: MARGIN_LEFT + CONTENT_W, y: y + 6 },
      thickness: 0.4,
      color: CLR_RULE,
    });
    bodyText(
      "DISCLAIMER: This report provides a structured analytical framework based on six ethical lenses and professional codes of conduct. It does not constitute legal, medical, or professional advice. Independent professional judgment remains essential. Prepared using the Ethical Decision-Making Analyzer, a companion tool for Ethical Decision-making in Environmental and Occupational Health and Safety (Wiley, 2026).",
      7.5,
      0,
      CLR_MUTED
    );

    // Final page footer
    drawFooter();
    // Footer for all previous pages already drawn via ensureSpace

    // ===== Save + Upload =====
    const pdfBytes = await doc.save();

    const hashBuf = await crypto.subtle.digest("SHA-256", pdfBytes as unknown as ArrayBuffer);
    const sha256 = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const storagePath = `${user.id}/${caseId}/export-${ts}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("case-pdf-exports")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) {
      await supabase.from("case_pdf_exports").insert({
        case_submission_id: caseId,
        user_id: user.id,
        storage_path: storagePath,
        file_size_bytes: pdfBytes.length,
        sha256,
        generation_status: "failed",
        error_message: uploadErr.message,
      });
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }

    const { data: exportRow, error: insertErr } = await supabase
      .from("case_pdf_exports")
      .insert({
        case_submission_id: caseId,
        user_id: user.id,
        storage_path: storagePath,
        file_size_bytes: pdfBytes.length,
        sha256,
        generation_status: "completed",
      })
      .select()
      .single();

    if (insertErr) {
      throw new Error(`Metadata insert failed: ${insertErr.message}`);
    }

    const { data: signedData, error: signErr } = await supabase.storage
      .from("case-pdf-exports")
      .createSignedUrl(storagePath, 3600);

    if (signErr) {
      throw new Error(`Signed URL failed: ${signErr.message}`);
    }

    return json({
      exportId: exportRow.id,
      storagePath,
      signedUrl: signedData.signedUrl,
      expiresIn: 3600,
      fileSizeBytes: pdfBytes.length,
      generatedAt: exportRow.created_at,
    });
  } catch (error) {
    console.error("export-case-pdf error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "PDF export failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
