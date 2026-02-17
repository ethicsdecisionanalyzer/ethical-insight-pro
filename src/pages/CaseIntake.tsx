import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, HelpCircle, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { professionalCodes, submitCase, generateSessionId } from "@/services/database";
import { analyzeCase } from "@/services/aiAnalysis";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SubmissionState = "idle" | "submitting" | "analyzing" | "success";

const TITLE_MAX_LENGTH = 200;
const NARRATIVE_MAX_LENGTH = 5000;

const CaseIntake = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [consentNoConfidential, setConsentNoConfidential] = useState(false);
  const [consentAggregateUse, setConsentAggregateUse] = useState(false);

  const isFormValid = title.trim() && narrative.trim() && selectedCodes.length > 0 && consentNoConfidential && consentAggregateUse;

  // Require auth
  if (!authLoading && !user) {
    navigate("/");
    return null;
  }

  // Usage limit check
  const usageExceeded = profile && profile.usage_count >= profile.max_analyses;

  const handleCodeToggle = (codeId: string) => {
    setSelectedCodes((prev) =>
      prev.includes(codeId)
        ? prev.filter((c) => c !== codeId)
        : [...prev, codeId]
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid || !user) return;

    if (usageExceeded) {
      toast({ title: "Limit Reached", description: "You've used all your available analyses.", variant: "destructive" });
      return;
    }

    setSubmissionState("submitting");
    const sessionId = generateSessionId();

    try {
      const submission = await submitCase({
        title,
        narrative,
        stakeholders: stakeholders || undefined,
        selected_codes: selectedCodes,
        session_id: sessionId,
        consent_no_confidential: consentNoConfidential,
        consent_aggregate_use: consentAggregateUse,
        user_id: user.id,
      });

      // Increment usage count
      await supabase
        .from("profiles")
        .update({ usage_count: (profile?.usage_count || 0) + 1 })
        .eq("user_id", user.id);

      await refreshProfile();

      setSubmissionState("analyzing");

      try {
        const analysis = await analyzeCase({
          title,
          narrative,
          stakeholders: stakeholders || "",
          selectedCodes,
        });

        await supabase
          .from("case_submissions")
          .update({ analysis_result: JSON.parse(JSON.stringify(analysis)), status: "analyzed" })
          .eq("id", submission.id);

        setSubmissionState("success");

        setTimeout(() => {
          navigate(`/results?case_id=${submission.id}&session_id=${sessionId}`);
        }, 1500);
      } catch (analysisErr) {
        console.error("Analysis error:", analysisErr);
        setSubmissionState("success");
        toast({ title: "Note", description: "Case submitted but analysis is pending. You can view results later." });
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast({ title: "Error", description: "Failed to submit case. Please try again.", variant: "destructive" });
      setSubmissionState("idle");
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="page" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Usage limit warning */}
            {usageExceeded && (
              <div className="mb-6 p-4 rounded-lg border border-warning/50 bg-warning/5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Analysis Limit Reached</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've used all {profile?.max_analyses} of your available analyses. Contact your instructor or administrator to request additional analyses.
                  </p>
                </div>
              </div>
            )}

            {/* Usage counter */}
            {profile && !usageExceeded && (
              <div className="mb-4 text-sm text-muted-foreground">
                Analyses used: <span className="font-medium text-foreground">{profile.usage_count}</span> / {profile.max_analyses}
              </div>
            )}

            {submissionState === "success" && (
              <div className="alert-success mb-6 flex items-center gap-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">Case submitted successfully!</p>
                  <p className="text-sm opacity-90">Your analysis will be generated shortly. Redirecting...</p>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Submit Your Ethics Case
                  </h1>
                  <p className="text-muted-foreground">
                    Describe the ethical dilemma you're facing. Be as detailed as possible for accurate analysis.
                  </p>
                  <div className="mt-3 p-3 rounded-lg border border-warning/30 bg-warning/5 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">⚠️ Important:</span> Please do not include company names, identifiable individuals, or confidential business information. Describe scenarios in generalized terms.
                  </div>
                </div>

                <div className="card-professional-elevated p-6 space-y-6">
                  {/* Case Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Case Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
                      placeholder="Brief title for your ethics case"
                      className="input-professional"
                      disabled={submissionState !== "idle" || !!usageExceeded}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Example: Reporting Unsafe Conditions vs. Job Security
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {title.length} / {TITLE_MAX_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Case Narrative */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Case Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value.slice(0, NARRATIVE_MAX_LENGTH))}
                      placeholder={`Describe your ethical dilemma in detail. Include:
• What is the situation?
• What are you being asked to do?
• Who are the stakeholders involved?
• What concerns you about this situation?`}
                      className="input-professional min-h-[250px] py-3 resize-y"
                      disabled={submissionState !== "idle" || !!usageExceeded}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted-foreground">
                        {narrative.length} / {NARRATIVE_MAX_LENGTH} characters
                      </span>
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Key Stakeholders <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={stakeholders}
                      onChange={(e) => setStakeholders(e.target.value)}
                      placeholder="E.g., Workers, Management, Clients, Regulatory Bodies"
                      className="input-professional"
                      disabled={submissionState !== "idle" || !!usageExceeded}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Who is affected by or involved in this decision?
                    </p>
                  </div>

                  {/* Professional Codes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Applicable Professional Code(s) <span className="text-destructive">*</span>
                    </label>
                    <div className="space-y-3">
                      {professionalCodes.map((code) => (
                        <label
                          key={code.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCodes.includes(code.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          } ${submissionState !== "idle" || usageExceeded ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <Checkbox
                            checked={selectedCodes.includes(code.id)}
                            onCheckedChange={() => handleCodeToggle(code.id)}
                            disabled={submissionState !== "idle" || !!usageExceeded}
                          />
                          <span className="text-sm">{code.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select the professional code(s) that apply to your role
                    </p>
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground">Required Consent</p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentNoConfidential}
                        onCheckedChange={(checked) => setConsentNoConfidential(checked === true)}
                        disabled={submissionState !== "idle" || !!usageExceeded}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground">
                        I understand submissions must not contain confidential or identifiable information.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={consentAggregateUse}
                        onCheckedChange={(checked) => setConsentAggregateUse(checked === true)}
                        disabled={submissionState !== "idle" || !!usageExceeded}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-muted-foreground">
                        I consent to anonymized, aggregate use of submitted data for research and publication purposes.
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={submissionState !== "idle"}
                      className="sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!isFormValid || submissionState !== "idle" || !!usageExceeded}
                      className="flex-1 sm:flex-none sm:min-w-[200px] sm:order-2 h-12"
                    >
                      {submissionState === "submitting" ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : submissionState === "analyzing" ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Analyzing with AI...
                        </>
                      ) : (
                        "Submit Case for Analysis"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="card-professional p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Need Help?</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Be specific about the ethical conflict
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Include relevant context and constraints
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      Describe what you're being asked to do
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowExampleModal(true)}
                    className="text-primary text-sm font-medium mt-4 hover:underline"
                  >
                    View Example Case →
                  </button>
                </div>

                <div className="card-professional p-5 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-foreground text-sm">Privacy Notice</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your case is stored securely and linked to your account. No personal information is shared externally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Submission?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Your progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Example Case Modal */}
      <Dialog open={showExampleModal} onOpenChange={setShowExampleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Example Ethics Case
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">Title:</p>
              <p className="text-muted-foreground">
                Reporting Unsafe Conditions vs. Job Security
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Description:</p>
              <p className="text-muted-foreground">
                A safety professional discovers significant ventilation deficiencies in a manufacturing facility that could expose workers to harmful chemical concentrations above permissible exposure limits. The plant manager has asked them to delay reporting until after a major production deadline, suggesting that immediate remediation would be too costly and could lead to layoffs. The safety professional must decide whether to report the hazard immediately to regulatory authorities or work within the company's timeline.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Stakeholders:</p>
              <p className="text-muted-foreground">
                Workers, Plant Manager, Safety Professional, Regulatory Bodies, Company Owners
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExampleModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseIntake;
