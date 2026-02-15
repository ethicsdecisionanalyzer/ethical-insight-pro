import { supabase } from "@/integrations/supabase/client";

// Analysis response types
export interface LensScore {
  score: number;
  reasoning: string;
  codeInfluence?: string;
  codeConstraint?: boolean;
}

export interface EthicsAnalysis {
  lensScores: {
    duty: LensScore;
    utilitarian: LensScore;
    rights: LensScore;
    justice: LensScore;
    virtue: LensScore;
    care: LensScore;
  };
  compositeScore: number;
  ethicalStability: "unstable" | "stable" | "robust";
  conflictLevel: 1 | 2 | 3;
  conflictAnalysis: {
    primaryTensions: string[];
    professionalCodeImplications: Record<string, string>;
  };
  recommendedActions: string[];
  questionsForReflection: string[];
  warningFlags: string[];
}

export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
}

export async function analyzeCase(request: AnalysisRequest): Promise<EthicsAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-case", {
    body: {
      title: request.title,
      narrative: request.narrative,
      stakeholders: request.stakeholders,
      selectedCodes: request.selectedCodes,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze case");
  }

  // Handle error responses from the edge function
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as EthicsAnalysis;
}
