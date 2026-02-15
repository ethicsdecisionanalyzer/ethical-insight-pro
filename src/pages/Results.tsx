import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Shield, Scale, Heart, Users, Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCaseById, CaseSubmission } from "@/services/database";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

const LENS_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  duty: { label: "Duty / Deontological", icon: <Shield className="w-5 h-5" />, description: "Professional obligations and codes" },
  utilitarian: { label: "Utilitarian", icon: <Users className="w-5 h-5" />, description: "Greatest good for greatest number" },
  rights: { label: "Rights-Based", icon: <Scale className="w-5 h-5" />, description: "Individual rights protection" },
  justice: { label: "Justice / Fairness", icon: <Scale className="w-5 h-5" />, description: "Equitable treatment" },
  virtue: { label: "Virtue Ethics", icon: <Eye className="w-5 h-5" />, description: "Character and integrity" },
  care: { label: "Care Ethics", icon: <Heart className="w-5 h-5" />, description: "Relationships and vulnerable populations" },
};

const stabilityColors: Record<string, string> = {
  robust: "bg-green-100 text-green-800 border-green-300",
  stable: "bg-yellow-100 text-yellow-800 border-yellow-300",
  unstable: "bg-red-100 text-red-800 border-red-300",
};

const conflictLabels: Record<number, string> = {
  1: "Minor Tension",
  2: "Significant Conflict",
  3: "Ethical Dilemma",
};

function scoreColor(score: number): string {
  if (score >= 7) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("case_id");
  const sessionId = searchParams.get("session_id");

  const [caseData, setCaseData] = useState<CaseSubmission | null>(null);
  const [analysis, setAnalysis] = useState<EthicsAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || !sessionId) {
      navigate("/");
      return;
    }

    const loadCase = async () => {
      try {
        const data = await getCaseById(caseId, sessionId);
        if (!data) {
          setError("Case not found or access denied.");
          setLoading(false);
          return;
        }
        setCaseData(data);
        if (data.analysis_result) {
          setAnalysis(data.analysis_result as unknown as EthicsAnalysis);
        } else {
          setError("Analysis not yet available. Please check back shortly.");
        }
      } catch {
        setError("Failed to load case data.");
      }
      setLoading(false);
    };

    loadCase();
  }, [caseId, sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <Header variant="page" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <Header variant="page" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {error || "Analysis not available"}
            </h2>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="page" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back + Title */}
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Ethics Analysis Results
              </h1>
              <p className="text-muted-foreground text-sm">
                {caseData?.title}
              </p>
            </div>

            {/* Summary Banner */}
            <div className="card-professional-elevated p-6 mb-6">
              <div className="flex flex-wrap items-center gap-6">
                {/* Composite Score */}
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${scoreColor(analysis.compositeScore)}`}>
                    {analysis.compositeScore}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Composite Score</p>
                </div>

                {/* Stability + Conflict */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${stabilityColors[analysis.ethicalStability]}`}>
                      {analysis.ethicalStability.charAt(0).toUpperCase() + analysis.ethicalStability.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Conflict Level {analysis.conflictLevel}: {conflictLabels[analysis.conflictLevel]}
                    </span>
                  </div>
                  {analysis.warningFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.warningFlags.map((flag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lens Scores Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {Object.entries(analysis.lensScores).map(([key, lens]) => {
                const meta = LENS_META[key];
                return (
                  <div key={key} className="card-professional p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-primary">{meta.icon}</span>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{meta.label}</h3>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm ${scoreColor(lens.score)}`}>
                          {lens.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-2">{lens.reasoning}</p>
                    {lens.codeInfluence && (
                      <p className="text-xs text-primary bg-primary/5 rounded p-2 mt-2">
                        <strong>Code Influence:</strong> {lens.codeInfluence}
                      </p>
                    )}
                    {lens.codeConstraint && (
                      <p className="text-xs text-red-700 bg-red-50 rounded p-2 mt-2">
                        ⚠️ Score constrained by professional code violation
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Conflict Analysis */}
            <div className="card-professional p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Conflict Analysis
              </h2>

              {analysis.conflictAnalysis.primaryTensions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-2">Primary Tensions</h3>
                  <ul className="space-y-2">
                    {analysis.conflictAnalysis.primaryTensions.map((t, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys(analysis.conflictAnalysis.professionalCodeImplications).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Professional Code Implications</h3>
                  <div className="space-y-3">
                    {Object.entries(analysis.conflictAnalysis.professionalCodeImplications).map(([code, implication]) => (
                      <div key={code} className="bg-muted/50 rounded-lg p-3">
                        <span className="font-medium text-sm text-primary">{code}</span>
                        <p className="text-sm text-foreground mt-1">{implication}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations + Reflection */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="card-professional p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendedActions.map((action, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-professional p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Questions for Reflection
                </h3>
                <ul className="space-y-2">
                  {analysis.questionsForReflection.map((q, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => navigate("/")} variant="outline">
                Submit Another Case
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
