import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MARGIN = 50;
const PAGE_W = 595;
const PAGE_H = 842;
const CONTENT_W = PAGE_W - 2 * MARGIN;

function sanitize(text: string): string {
  return (text || "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\xFF]/g, "?");
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

    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // --- Request ---
    const { caseId } = await req.json();
    if (!caseId) return json({ error: "Missing caseId" }, 400);

    // --- Load case ---
    const { data: caseData, error: caseErr } = await supabase
      .from("case_submissions")
      .select("*")
      .eq("id", caseId)
      .single();
    if (caseErr || !caseData) return json({ error: "Case not found" }, 404);

    // --- Ownership check ---
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (caseData.user_id !== user.id && !isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    // --- Analysis check ---
    if (!caseData.analysis_result) {
      return json({ error: "Analysis not ready" }, 409);
    }

    const analysis = caseData.analysis_result as Record<string, unknown>;

    // ===== PDF Generation =====
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN) {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
    };

    const drawHeader = (text: string, size = 16) => {
      ensureSpace(size + 12);
      page.drawText(sanitize(text), {
        x: MARGIN,
        y,
        size,
        font: boldFont,
      });
      y -= size + 12;
    };

    const drawLabel = (label: string, value: string, size = 10) => {
      ensureSpace(size + 6);
      const lw = boldFont.widthOfTextAtSize(label, size);
      page.drawText(label, { x: MARGIN, y, size, font: boldFont });
      page.drawText(sanitize(value), {
        x: MARGIN + lw + 4,
        y,
        size,
        font,
      });
      y -= size + 6;
    };

    const drawBody = (text: string, size = 10) => {
      const lines = wrapText(text, font, size, CONTENT_W);
      for (const line of lines) {
        ensureSpace(size + 4);
        page.drawText(line, { x: MARGIN, y, size, font });
        y -= size + 4;
      }
    };

    const drawBullet = (text: string, size = 10) => {
      const bw = font.widthOfTextAtSize("- ", size);
      const lines = wrapText(text, font, size, CONTENT_W - bw);
      for (let i = 0; i < lines.length; i++) {
        ensureSpace(size + 4);
        if (i === 0) page.drawText("- ", { x: MARGIN, y, size, font });
        page.drawText(lines[i], { x: MARGIN + bw, y, size, font });
        y -= size + 4;
      }
    };

    const drawLine = () => {
      ensureSpace(10);
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_W - MARGIN, y },
        thickness: 0.5,
      });
      y -= 10;
    };

    const gap = (n = 8) => {
      y -= n;
    };

    // -- Cover --
    drawHeader("Ethics Case Analysis Report", 20);
    gap(4);
    drawLabel("Generated: ", new Date().toISOString().split("T")[0]);
    drawLabel(
      "Algorithm Version: ",
      String((analysis as Record<string, unknown>)._algorithmVersion || "Unknown")
    );
    drawLine();

    // -- Case Info --
    drawHeader("Case Information", 14);
    drawLabel("Title: ", String(caseData.title || "Untitled"));
    gap(4);
    drawBody(String(caseData.narrative || ""));
    gap(4);
    drawLabel("Stakeholders: ", String(caseData.stakeholders || "Not specified"));
    drawLabel(
      "Professional Codes: ",
      Array.isArray(caseData.selected_codes)
        ? caseData.selected_codes.join(", ")
        : ""
    );
    drawLine();

    // -- Scores --
    drawHeader("Analysis Summary", 14);
    drawLabel("Composite Score: ", String(analysis.compositeScore ?? "N/A"));
    drawLabel(
      "Ethical Stability: ",
      String(analysis.ethicalStability ?? "N/A")
    );
    drawLabel("Conflict Level: ", String(analysis.conflictLevel ?? "N/A"));
    drawLine();

    // -- Six Lenses --
    drawHeader("Six-Lens Ethical Analysis", 14);
    const lensNames: Record<string, string> = {
      utilitarian: "Utilitarian",
      duty: "Deontological / Duty",
      justice: "Justice / Fairness",
      virtue: "Virtue",
      care: "Care",
      commonGood: "Common Good",
    };
    const lensScores = (analysis.lensScores || {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [key, label] of Object.entries(lensNames)) {
      const lens = lensScores[key] || {};
      gap(4);
      drawLabel(`${label}: `, `${lens.score ?? "N/A"} / 10`);
      if (lens.reasoning) drawBody(String(lens.reasoning), 9);
    }
    drawLine();

    // -- Violation Detection --
    drawHeader("Violation Detection", 14);
    const vd = (analysis.violationDetection || {}) as Record<string, unknown>;
    drawLabel("Has Violation: ", String(vd.hasViolation ?? false));
    drawLabel("Severity: ", String(vd.violationSeverity ?? "none"));
    if (Array.isArray(vd.violatedCodes) && vd.violatedCodes.length) {
      drawLabel("Violated Codes: ", vd.violatedCodes.join(", "));
    }
    if (vd.violationDetails) {
      gap(4);
      drawBody(String(vd.violationDetails), 9);
    }
    drawLine();

    // -- Code Implications --
    const ca = (analysis.conflictAnalysis || {}) as Record<string, unknown>;
    const implications = (ca.professionalCodeImplications || {}) as Record<
      string,
      unknown
    >;
    if (Object.keys(implications).length) {
      drawHeader("Professional Code Implications", 14);
      for (const [code, text] of Object.entries(implications)) {
        drawLabel(`${code}: `, "");
        drawBody(String(text), 9);
        gap(2);
      }
      drawLine();
    }

    // -- Tensions --
    const tensions = Array.isArray(ca.primaryTensions) ? ca.primaryTensions : [];
    if (tensions.length) {
      drawHeader("Primary Tensions", 14);
      for (const t of tensions) drawBullet(String(t), 9);
      drawLine();
    }

    // -- Observations --
    const obs = Array.isArray(analysis.analyticalObservations)
      ? analysis.analyticalObservations
      : [];
    if (obs.length) {
      drawHeader("Analytical Observations", 14);
      for (const o of obs) drawBullet(String(o), 9);
      drawLine();
    }

    // -- Reflection --
    const qs = Array.isArray(analysis.questionsForReflection)
      ? analysis.questionsForReflection
      : [];
    if (qs.length) {
      drawHeader("Questions for Reflection", 14);
      for (const q of qs) drawBullet(String(q), 9);
      drawLine();
    }

    // -- Warnings --
    const flags = Array.isArray(analysis.warningFlags)
      ? analysis.warningFlags
      : [];
    if (flags.length) {
      drawHeader("Warning Flags", 14);
      for (const f of flags) drawBullet(String(f), 9);
      drawLine();
    }

    // -- Disclaimer --
    gap(12);
    drawBody(
      "DISCLAIMER: This tool provides a structured analytical framework and does not constitute legal, medical, or professional advice. Independent professional judgment remains essential.",
      8
    );

    // ===== Save + Upload =====
    const pdfBytes = await doc.save();

    const hashBuf = await crypto.subtle.digest("SHA-256", pdfBytes);
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
