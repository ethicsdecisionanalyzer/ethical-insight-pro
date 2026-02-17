import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, BookOpen, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { validateAccessCode, incrementCodeUsage, generateSessionId } from "@/services/database";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type ValidationState = "idle" | "loading" | "success" | "error";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");

  // If logged in, redirect to case intake
  if (!authLoading && user) {
    navigate("/case-intake");
    return null;
  }

  const handleValidate = async () => {
    if (!accessCode.trim()) return;

    setValidationState("loading");

    try {
      const validCode = await validateAccessCode(accessCode);

      if (validCode) {
        const sessionId = generateSessionId();
        await incrementCodeUsage(validCode.id, sessionId);
        setValidationState("success");

        setTimeout(() => {
          navigate(`/case-intake?code_id=${validCode.id}&session_id=${sessionId}&code=${validCode.code}`);
        }, 1000);
      } else {
        setValidationState("error");
      }
    } catch (err) {
      console.error("Validation error:", err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      setValidationState("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && accessCode.trim()) {
      handleValidate();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="landing" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* New registration path */}
          <div className="card-professional-elevated p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Get Started
              </h2>
              <p className="text-muted-foreground text-sm">
                Verify your textbook and create an account to submit up to 5 ethics case analyses.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate("/verify")} className="flex-1 h-12 text-base font-medium gap-2">
                <BookOpen className="w-4 h-4" />
                Verify & Register
              </Button>
              <Button onClick={() => navigate("/login")} variant="outline" className="flex-1 h-12 text-base font-medium gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          </div>

          {/* Legacy access code path */}
          <div className="card-professional p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-medium text-foreground">Have an Access Code?</h3>
              </div>
              <p className="text-muted-foreground text-xs">
                If you have a printed access code from your book, you can still use it here.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  if (validationState === "error") setValidationState("idle");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter access code (e.g., BOOK-2026-XXXX)"
                className={`input-professional font-mono text-center tracking-wider text-sm h-10 ${
                  validationState === "error" ? "error" : ""
                }`}
                disabled={validationState === "loading" || validationState === "success"}
              />

              <Button
                onClick={handleValidate}
                disabled={!accessCode.trim() || validationState === "loading" || validationState === "success"}
                variant="secondary"
                className="w-full h-10"
              >
                {validationState === "loading" ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Validating...
                  </>
                ) : (
                  "Validate Code"
                )}
              </Button>

              {validationState === "error" && (
                <div className="alert-error flex items-start gap-2 animate-fade-in text-sm">
                  <span className="shrink-0">❌</span>
                  <span>Invalid or expired code.</span>
                </div>
              )}

              {validationState === "success" && (
                <div className="alert-success flex items-start gap-2 animate-fade-in text-sm">
                  <span className="shrink-0">✓</span>
                  <span>Code validated! Redirecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
