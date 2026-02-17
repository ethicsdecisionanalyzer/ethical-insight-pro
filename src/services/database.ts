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
