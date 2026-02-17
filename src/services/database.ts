import { supabase } from "@/integrations/supabase/client";

// Types matching our database schema
export interface AccessCode {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

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
  access_code_used: string;
  session_id: string;
  consent_no_confidential: boolean;
  consent_aggregate_use: boolean;
}

// Session helpers
export function generateSessionId(): string {
  return `sess-${Math.random().toString(36).substring(2, 11)}`;
}

// Access code validation
export async function validateAccessCode(code: string): Promise<AccessCode | null> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .ilike("code", code)
    .eq("active", true)
    .single();

  if (error || !data) return null;
  if (data.uses_count >= data.max_uses) return null;

  return data as AccessCode;
}

// Increment usage + create redemption
export async function incrementCodeUsage(codeId: string, sessionId: string): Promise<void> {
  const { data: current } = await supabase
    .from("access_codes")
    .select("uses_count, max_uses")
    .eq("id", codeId)
    .single();

  if (!current) throw new Error("Code not found");

  const newCount = current.uses_count + 1;

  await supabase
    .from("access_codes")
    .update({
      uses_count: newCount,
      active: newCount < current.max_uses,
    })
    .eq("id", codeId);

  await supabase
    .from("code_redemptions")
    .insert({ code_id: codeId, session_id: sessionId });
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
      access_code_used: data.access_code_used,
      session_id: data.session_id,
      consent_no_confidential: data.consent_no_confidential,
      consent_aggregate_use: data.consent_aggregate_use,
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
export async function createAccessCode(code: string, maxUses: number): Promise<AccessCode> {
  const { data, error } = await supabase
    .from("access_codes")
    .insert({ code, max_uses: maxUses })
    .select()
    .single();

  if (error) throw error;
  return data as AccessCode;
}

export async function searchAccessCodes(query?: string): Promise<AccessCode[]> {
  let q = supabase.from("access_codes").select("*").order("created_at", { ascending: false });

  if (query) {
    q = q.ilike("code", `%${query}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as AccessCode[];
}

export async function resetAccessCode(codeId: string): Promise<void> {
  const { error } = await supabase
    .from("access_codes")
    .update({ uses_count: 0, active: true })
    .eq("id", codeId);

  if (error) throw error;
}

export async function deactivateAccessCode(codeId: string): Promise<void> {
  const { error } = await supabase
    .from("access_codes")
    .update({ active: false })
    .eq("id", codeId);

  if (error) throw error;
}

export async function getAdminStats(): Promise<{
  totalCodes: number;
  activeCodes: number;
  totalSubmissions: number;
  todayRedemptions: number;
}> {
  const [codesRes, submissionsRes, redemptionsRes] = await Promise.all([
    supabase.from("access_codes").select("*"),
    supabase.from("case_submissions").select("id", { count: "exact", head: true }),
    supabase
      .from("code_redemptions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().split("T")[0]),
  ]);

  const codes = (codesRes.data || []) as AccessCode[];

  return {
    totalCodes: codes.length,
    activeCodes: codes.filter((c) => c.active).length,
    totalSubmissions: submissionsRes.count || 0,
    todayRedemptions: redemptionsRes.count || 0,
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

// Professional codes options (static)
export const professionalCodes = [
  { id: "BCSP/ASSP", label: "BCSP/ASSP - Safety Professionals" },
  { id: "AIHA/ABIH", label: "AIHA/ABIH - Industrial Hygienists" },
  { id: "AAOHN", label: "AAOHN - Occupational Health Nurses" },
  { id: "ACOEM", label: "ACOEM - Occupational & Environmental Medicine Physicians" },
];
