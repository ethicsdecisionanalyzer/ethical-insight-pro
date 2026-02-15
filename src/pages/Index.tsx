import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { validateAccessCode, incrementCodeUsage, generateSessionId } from "@/services/database";
import { toast } from "@/hooks/use-toast";

type ValidationState = "idle" | "loading" | "success" | "error";

const Index = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");

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
        <div className="w-full max-w-md">
          <div className="card-professional-elevated p-8">
            {/* Icon and Heading */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Enter Your Access Code
              </h2>
              <p className="text-muted-foreground text-sm">
                Each book includes a unique access code that allows 5 case submissions. Enter your code below to begin.
              </p>
            </div>

            {/* Input Field */}
            <div className="space-y-4">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  if (validationState === "error") {
                    setValidationState("idle");
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter access code (e.g., BOOK-2026-XXXX)"
                className={`input-professional font-mono text-center tracking-wider ${
                  validationState === "error" ? "error" : ""
                }`}
                disabled={validationState === "loading" || validationState === "success"}
              />

              <Button
                onClick={handleValidate}
                disabled={!accessCode.trim() || validationState === "loading" || validationState === "success"}
                className="w-full h-12 text-base font-medium"
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
                <div className="alert-error flex items-start gap-2 animate-fade-in">
                  <span className="shrink-0">❌</span>
                  <span>Invalid or expired code. Please check your code and try again.</span>
                </div>
              )}

              {validationState === "success" && (
                <div className="alert-success flex items-start gap-2 animate-fade-in">
                  <span className="shrink-0">✓</span>
                  <span>Code validated successfully! Redirecting...</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Find your access code on the inside cover of your textbook.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
