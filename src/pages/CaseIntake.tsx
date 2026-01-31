import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, HelpCircle, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { professionalCodes } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SubmissionState = "idle" | "submitting" | "success";

const TITLE_MAX_LENGTH = 200;
const NARRATIVE_MAX_LENGTH = 5000;

const CaseIntake = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const codeId = searchParams.get("code_id");
  const sessionId = searchParams.get("session_id");
  const accessCode = searchParams.get("code") || "";

  // Redirect if no valid session
  if (!codeId || !sessionId) {
    navigate("/");
    return null;
  }

  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);

  const isFormValid = title.trim() && narrative.trim() && selectedCodes.length > 0;

  const handleCodeToggle = (codeId: string) => {
    setSelectedCodes((prev) =>
      prev.includes(codeId)
        ? prev.filter((c) => c !== codeId)
        : [...prev, codeId]
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setSubmissionState("submitting");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real app, this would create a CaseSubmission record
    setSubmissionState("success");

    // Redirect after showing success (for now, back to home with message)
    setTimeout(() => {
      navigate("/?submitted=true");
    }, 2000);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="page" accessCode={accessCode} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Banner */}
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
                      disabled={submissionState !== "idle"}
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
                      disabled={submissionState !== "idle"}
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
                      disabled={submissionState !== "idle"}
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
                          } ${submissionState !== "idle" ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <Checkbox
                            checked={selectedCodes.includes(code.id)}
                            onCheckedChange={() => handleCodeToggle(code.id)}
                            disabled={submissionState !== "idle"}
                          />
                          <span className="text-sm">{code.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select the professional code(s) that apply to your role
                    </p>
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
                      disabled={!isFormValid || submissionState !== "idle"}
                      className="flex-1 sm:flex-none sm:min-w-[200px] sm:order-2 h-12"
                    >
                      {submissionState === "submitting" ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Submitting...
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
                {/* Help Card */}
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

                {/* Privacy Notice */}
                <div className="card-professional p-5 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-foreground text-sm">Privacy Notice</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your case is stored securely and identified only by session ID. No personal information is required.
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
              Are you sure you want to cancel? Your case details will be lost.
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Example Ethics Case
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Title</h4>
              <p className="text-foreground">Pressure to Delay Benzene Exposure Report</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Case Description</h4>
              <p className="text-foreground text-sm leading-relaxed">
                During routine air quality testing, I discovered benzene levels that exceed OSHA limits by 40%. 
                Management wants me to label the report as "preliminary findings" and delay official reporting 
                until after the annual safety audit in 3 months. They've implied my contract renewal depends on 
                cooperation. Workers are currently exposed daily to these levels.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Key Stakeholders</h4>
              <p className="text-foreground text-sm">Factory workers, plant management, OSHA, my professional license</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Professional Code</h4>
              <span className="badge-neutral">AIHA/ABIH - Industrial Hygienists</span>
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
