import { supabase } from "@/integrations/supabase/client";

// Types matching our database schema
export interface CaseSubmission {
  id: string;
  title: string;
  narrative: string;
  stakeholders: string | null;
  selected_codes: string[];
  access_code_used: string;
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  analysis_result: Record<string, unknown> | null;
}

export interface CaseSubmissionData {
  title: string;
  narrative: string;
  stakeholders?: string;
  selected_codes: string[];
  session_id: string;
  consent_no_confidential: boolean;
  consent_aggregate_use: boolean;
  user_id?: string;
}

// Session helpers
export function generateSessionId(): string {
  return `sess-${Math.random().toString(36).substring(2, 11)}`;
}

// Submit case
export async function submitCase(data: CaseSubmissionData): Promise<CaseSubmission> {
  const { data: result, error } = await supabase
    .from("case_submissions")
    .insert({
      title: data.title,
      narrative: data.narrative,
      stakeholders: data.stakeholders || null,
      selected_codes: data.selected_codes,
      access_code_used: "registered-user",
      session_id: data.session_id,
      consent_no_confidential: data.consent_no_confidential,
      consent_aggregate_use: data.consent_aggregate_use,
      user_id: data.user_id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return result as CaseSubmission;
}

// Get case by ID
export async function getCaseById(id: string, sessionId: string): Promise<CaseSubmission | null> {
  const { data, error } = await supabase
    .from("case_submissions")
    .select("*")
    .eq("id", id)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CaseSubmission;
}

// Admin functions
export async function getAdminStats(): Promise<{
  totalUsers: number;
  verifiedUsers: number;
  totalSubmissions: number;
  activeQuestions: number;
}> {
  const [profilesRes, submissionsRes, questionsRes] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("case_submissions").select("id", { count: "exact", head: true }),
    supabase.from("verification_questions").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const profiles = profilesRes.data || [];

  return {
    totalUsers: profiles.length,
    verifiedUsers: profiles.filter((p) => p.book_verified).length,
    totalSubmissions: submissionsRes.count || 0,
    activeQuestions: questionsRes.count || 0,
  };
}

export async function getRecentSubmissions(): Promise<CaseSubmission[]> {
  const { data, error } = await supabase
    .from("case_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []) as CaseSubmission[];
}

// Verification question management
export interface VerificationQuestion {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  created_at: string;
}

export async function getVerificationQuestions(): Promise<VerificationQuestion[]> {
  const { data, error } = await supabase
    .from("verification_questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as VerificationQuestion[];
}

export async function createVerificationQuestion(question: string, answer: string): Promise<void> {
  const { error } = await supabase
    .from("verification_questions")
    .insert({ question, answer, active: true });

  if (error) throw error;
}

export async function updateVerificationQuestion(id: string, updates: { question?: string; answer?: string; active?: boolean }): Promise<void> {
  const { error } = await supabase
    .from("verification_questions")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteVerificationQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from("verification_questions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// User management
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profession: string | null;
  tenure: string | null;
  usage_count: number;
  max_analyses: number;
  book_verified: boolean;
  created_at: string;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as UserProfile[];
}

export async function updateUserProfile(userId: string, updates: { usage_count?: number; max_analyses?: number }): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId);

  if (error) throw error;
}

// Professional codes options (static)
export const professionalCodes = [
  { id: "BCSP/ASSP", label: "BCSP/ASSP - Safety Professionals" },
  { id: "AIHA/ABIH", label: "AIHA/ABIH - Industrial Hygienists" },
  { id: "AAOHN", label: "AAOHN - Occupational Health Nurses" },
  { id: "ACOEM", label: "ACOEM - Occupational & Environmental Medicine Physicians" },
];

// Access code management (admin)
export interface AccessCodeRow {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodeRedemptionLog {
  id: string;
  code_id: string;
  session_id: string;
  user_id: string | null;
  created_at: string;
  code: string;
}

export interface PdfExportResult {
  exportId: string;
  storagePath: string;
  signedUrl: string;
  expiresIn: number;
  fileSizeBytes: number;
  generatedAt: string;
}

export async function getAccessCodes(): Promise<AccessCodeRow[]> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as AccessCodeRow[];
}

export async function toggleAccessCode(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("access_codes")
    .update({ active })
    .eq("id", id);

  if (error) throw error;
}

export async function resetAccessCodeUsage(id: string): Promise<void> {
  const { error } = await supabase
    .from("access_codes")
    .update({ uses_count: 0 })
    .eq("id", id);

  if (error) throw error;
}

export async function getCodeRedemptionLogs(limit = 100): Promise<CodeRedemptionLog[]> {
  const { data, error } = await supabase
    .from("code_redemptions")
    .select("id, code_id, session_id, created_at, access_codes(code)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    code_id: row.code_id as string,
    session_id: row.session_id as string,
    user_id: null,
    created_at: row.created_at as string,
    code: ((row.access_codes as Record<string, unknown>)?.code as string) || "Unknown",
  }));
}

export interface SummaryMetrics {
  totalSubmissions: number;
  stabilityDistribution: { stable: number; contested: number; unstable: number; unanalyzed: number };
  violationsByCode: Record<string, number>;
  accessCodeRedemptions: Record<string, number>;
}

export async function getAllSubmissions(dateFrom?: string, dateTo?: string): Promise<CaseSubmission[]> {
  let query = supabase
    .from("case_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CaseSubmission[];
}

export function computeSummaryMetrics(submissions: CaseSubmission[], redemptions: CodeRedemptionLog[]): SummaryMetrics {
  const stabilityDistribution = { stable: 0, contested: 0, unstable: 0, unanalyzed: 0 };
  const violationsByCode: Record<string, number> = {};

  for (const sub of submissions) {
    const ar = sub.analysis_result as Record<string, unknown> | null;
    if (!ar) { stabilityDistribution.unanalyzed++; continue; }
    const stability = String(ar.ethicalStability || "").toLowerCase();
    if (stability.includes("stable") && !stability.includes("unstable")) stabilityDistribution.stable++;
    else if (stability.includes("contested")) stabilityDistribution.contested++;
    else if (stability.includes("unstable")) stabilityDistribution.unstable++;
    else stabilityDistribution.unanalyzed++;

    const vd = ar.violationDetection as Record<string, unknown> | undefined;
    if (vd?.hasViolation) {
      const codes = Array.isArray(vd.violatedCodes) ? vd.violatedCodes : [];
      for (const c of codes) { violationsByCode[String(c)] = (violationsByCode[String(c)] || 0) + 1; }
    }
  }

  const accessCodeRedemptions: Record<string, number> = {};
  for (const r of redemptions) {
    accessCodeRedemptions[r.code] = (accessCodeRedemptions[r.code] || 0) + 1;
  }

  return { totalSubmissions: submissions.length, stabilityDistribution, violationsByCode, accessCodeRedemptions };
}

export function submissionsToCsv(submissions: CaseSubmission[]): string {
  const headers = [
    "Case ID", "Timestamp", "Title", "Professional Codes",
    "Utilitarian", "Duty", "Justice", "Virtue", "Care", "Common Good",
    "Composite Score", "Stability", "Violation", "Violation Severity",
    "Violated Codes", "Conflict Level", "Algorithm Version",
  ];
  const rows = submissions.map((s) => {
    const ar = s.analysis_result as Record<string, unknown> | null;
    const ls = (ar?.lensScores || {}) as Record<string, Record<string, unknown>>;
    const vd = (ar?.violationDetection || {}) as Record<string, unknown>;
    const score = (key: string) => ls[key]?.score ?? "";
    return [
      s.id,
      s.created_at,
      `"${(s.title || "").replace(/"/g, '""')}"`,
      `"${(s.selected_codes || []).join("; ")}"`,
      score("utilitarian"), score("duty"), score("justice"),
      score("virtue"), score("care"), score("commonGood"),
      ar?.compositeScore ?? "",
      ar?.ethicalStability ?? "",
      vd.hasViolation ? "Yes" : "No",
      vd.violationSeverity ?? "none",
      `"${(Array.isArray(vd.violatedCodes) ? vd.violatedCodes.join("; ") : "")}"`,
      ar?.conflictLevel ?? "",
      ar?._algorithmVersion ?? "",
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export async function generateCasePdf(caseId: string): Promise<PdfExportResult> {
  const { data, error } = await supabase.functions.invoke("export-case-pdf", {
    body: { caseId },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate PDF");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as PdfExportResult;
}
