import { supabase } from "@/integrations/supabase/client";

// Analysis response types
export interface LensScore {
  score: number;
  reasoning: string;
}

export interface ViolationDetection {
  hasViolation: boolean;
  violatedCodes: string[];
  violationSeverity: "none" | "tension" | "single_violation" | "multi_violation";
  violationDetails: string;
}

export interface EthicsAnalysis {
  lensScores: {
    utilitarian: LensScore;
    duty: LensScore;
    justice: LensScore;
    virtue: LensScore;
    care: LensScore;
    commonGood: LensScore;
  };
  compositeScore: number;
  ethicalStability: "Stable" | "Contested" | "Ethically Unstable";
  conflictLevel: 1 | 2 | 3;
  conflictAnalysis: {
    primaryTensions: string[];
    professionalCodeImplications: Record<string, string>;
  };
  violationDetection: ViolationDetection;
  analyticalObservations: string[];
  questionsForReflection: string[];
  warningFlags: string[];
  _internal?: {
    lensAverage: number;
    codeScore: number;
    lensComponent: number;
    codeComponent: number;
    lensStdDev: number;
    weightingFormula: string;
  };
  _guardrailsApplied?: boolean;
  _algorithmVersion?: string;
}

export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
  lensScores?: Record<string, number>;
}

export async function analyzeCase(request: AnalysisRequest): Promise<EthicsAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-case", {
    body: {
      title: request.title,
      narrative: request.narrative,
      stakeholders: request.stakeholders,
      selectedCodes: request.selectedCodes,
      lensScores: request.lensScores,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze case");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as EthicsAnalysis;
}
