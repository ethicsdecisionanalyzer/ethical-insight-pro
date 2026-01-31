// Mock data for frontend demonstration
// This will be replaced with actual Supabase integration in Milestone 2

export interface AccessCode {
  id: string;
  code: string;
  maxUses: number;
  usesCount: number;
  active: boolean;
  createdAt: string;
}

export interface CaseSubmission {
  id: string;
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
  accessCodeUsed: string;
  sessionId: string;
  timestamp: string;
  status: "submitted" | "analyzed";
}

export interface CodeRedemption {
  id: string;
  codeId: string;
  sessionId: string;
  timestamp: string;
}

// Mock access codes
export const mockAccessCodes: AccessCode[] = [
  { id: "1", code: "BOOK-2026-4523", maxUses: 5, usesCount: 2, active: true, createdAt: "2026-01-15" },
  { id: "2", code: "BOOK-2026-7891", maxUses: 5, usesCount: 5, active: false, createdAt: "2026-01-10" },
  { id: "3", code: "BOOK-2026-3456", maxUses: 5, usesCount: 0, active: true, createdAt: "2026-01-20" },
  { id: "4", code: "BOOK-2026-9012", maxUses: 5, usesCount: 3, active: true, createdAt: "2026-01-18" },
  { id: "5", code: "BOOK-2026-5678", maxUses: 5, usesCount: 1, active: true, createdAt: "2026-01-22" },
  { id: "6", code: "BOOK-2026-2345", maxUses: 5, usesCount: 4, active: true, createdAt: "2026-01-25" },
];

// Mock case submissions
export const mockSubmissions: CaseSubmission[] = [
  {
    id: "sub1",
    title: "Pressure to Delay Benzene Exposure Report",
    narrative: "During routine air quality testing, I discovered benzene levels that exceed OSHA limits by 40%...",
    stakeholders: "Factory workers, plant management, OSHA",
    selectedCodes: ["AIHA/ABIH"],
    accessCodeUsed: "BOOK-2026-4523",
    sessionId: "sess-123",
    timestamp: "2026-01-28T14:30:00Z",
    status: "analyzed",
  },
  {
    id: "sub2",
    title: "Conflicting Safety Recommendations",
    narrative: "Two different safety standards provide conflicting guidance on fall protection equipment...",
    stakeholders: "Construction workers, site manager, safety committee",
    selectedCodes: ["BCSP/ASSP"],
    accessCodeUsed: "BOOK-2026-9012",
    sessionId: "sess-456",
    timestamp: "2026-01-29T09:15:00Z",
    status: "submitted",
  },
  {
    id: "sub3",
    title: "Client Pressure to Reduce PPE Requirements",
    narrative: "A client is pushing to reduce personal protective equipment requirements to cut costs...",
    stakeholders: "Client, workers, regulatory bodies",
    selectedCodes: ["BCSP/ASSP", "AIHA/ABIH"],
    accessCodeUsed: "BOOK-2026-4523",
    sessionId: "sess-789",
    timestamp: "2026-01-30T11:45:00Z",
    status: "submitted",
  },
];

// Helper functions
export function generateSessionId(): string {
  return `sess-${Math.random().toString(36).substring(2, 11)}`;
}

export function validateAccessCode(code: string): AccessCode | null {
  const foundCode = mockAccessCodes.find(
    (c) => c.code.toUpperCase() === code.toUpperCase() && c.active && c.usesCount < c.maxUses
  );
  return foundCode || null;
}

export function incrementCodeUsage(codeId: string): void {
  const code = mockAccessCodes.find((c) => c.id === codeId);
  if (code) {
    code.usesCount += 1;
    if (code.usesCount >= code.maxUses) {
      code.active = false;
    }
  }
}

// Professional codes options
export const professionalCodes = [
  { id: "BCSP/ASSP", label: "BCSP/ASSP - Safety Professionals" },
  { id: "AIHA/ABIH", label: "AIHA/ABIH - Industrial Hygienists" },
  { id: "AAOHN", label: "AAOHN - Occupational Health Nurses" },
  { id: "ACOEM", label: "ACOEM - Occupational & Environmental Medicine Physicians" },
];
