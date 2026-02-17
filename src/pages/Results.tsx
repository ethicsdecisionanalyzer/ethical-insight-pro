import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCaseById, CaseSubmission } from "@/services/database";
import type { EthicsAnalysis } from "@/services/aiAnalysis";
import { useAuth } from "@/contexts/AuthContext";

import { ResultsHeader } from "@/components/results/ResultsHeader";
import { ConflictAlert } from "@/components/results/ConflictAlert";
import { LensCard } from "@/components/results/LensCard";
import { CodeImplications } from "@/components/results/CodeImplications";
import { LensRadarChart } from "@/components/results/LensRadarChart";
import { RecommendationsSection } from "@/components/results/RecommendationsSection";
import { WarningFlags } from "@/components/results/WarningFlags";
import { ResultsFooterActions } from "@/components/results/ResultsFooterActions";
import { Scale } from "lucide-react";

const POLL_INTERVAL = 3000;

const Results = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("case_id");
  const sessionId = searchParams.get("session_id");

  const [caseData, setCaseData] = useState<CaseSubmission | null>(null);
  const [analysis, setAnalysis] = useState<EthicsAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!caseId || !sessionId) {
      navigate("/login");
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
          setLoading(false);
          // Stop polling once we have results
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          // Start polling if analysis not ready
          setLoading(false);
          if (!pollRef.current) {
            pollRef.current = setInterval(async () => {
              try {
                const updated = await getCaseById(caseId, sessionId);
                if (updated?.analysis_result) {
                  setCaseData(updated);
                  setAnalysis(updated.analysis_result as unknown as EthicsAnalysis);
                  if (pollRef.current) clearInterval(pollRef.current);
                  pollRef.current = null;
                }
              } catch {
                // Silently retry
              }
            }, POLL_INTERVAL);
          }
        }
      } catch {
        setError("Failed to load case data.");
        setLoading(false);
      }
    };

    loadCase();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [caseId, sessionId, navigate, user, authLoading]);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <Header variant="page" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{error}</h2>
            <Button onClick={() => navigate("/")} variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Waiting for analysis (polling)
  if (!analysis && caseData) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light">
        <Header variant="page" />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <Spinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Analysis in Progress</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Your case "<span className="font-medium">{caseData.title}</span>" is being analyzed across six ethical lenses.
            </p>
            <p className="text-xs text-muted-foreground">This page will update automatically when results are ready.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!analysis || !caseData) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background-light print:bg-white">
      <Header variant="page" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 gap-1 print:hidden">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <h1 className="text-2xl font-bold text-foreground mb-6">Ethics Analysis Results</h1>

            {/* Header with score, case info, stability */}
            <ResultsHeader caseData={caseData} analysis={analysis} />

            {/* Conflict alert banner */}
            <ConflictAlert analysis={analysis} />

            {/* Warning flags */}
            <WarningFlags analysis={analysis} />

            {/* Radar chart */}
            <LensRadarChart analysis={analysis} />

            {/* Six lens cards */}
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Six-Lens Ethical Analysis
            </h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {Object.entries(analysis.lensScores).map(([key, lens]) => (
                <LensCard key={key} lensKey={key} lens={lens} />
              ))}
            </div>

            {/* Professional code implications (collapsible) */}
            <CodeImplications analysis={analysis} />

            {/* Recommendations + Reflection */}
            <RecommendationsSection analysis={analysis} />

            {/* Footer actions */}
            <ResultsFooterActions />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
