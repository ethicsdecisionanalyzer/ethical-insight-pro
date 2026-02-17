import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Verify = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState<{ id: string; question: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  useEffect(() => {
    // If already logged in and verified, go to case intake
    if (user) {
      navigate("/case-intake");
      return;
    }

    const loadQuestion = async () => {
      const { data } = await supabase
        .from("verification_questions")
        .select("id, question")
        .eq("active", true)
        .limit(1)
        .single();
      setQuestion(data);
      setLoadingQuestion(false);
    };
    loadQuestion();
  }, [user, navigate]);

  const handleVerify = async () => {
    if (!answer.trim() || !question) return;
    setStatus("loading");

    // Check answer (case-insensitive)
    const { data } = await supabase
      .from("verification_questions")
      .select("answer")
      .eq("id", question.id)
      .single();

    if (data && data.answer.toLowerCase().trim() === answer.toLowerCase().trim()) {
      setStatus("success");
      // Store verification in sessionStorage so register page knows
      sessionStorage.setItem("book_verified", "true");
      setTimeout(() => navigate("/register"), 1000);
    } else {
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && answer.trim()) handleVerify();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="landing" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card-professional-elevated p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Book Verification
              </h2>
              <p className="text-muted-foreground text-sm">
                Answer the following question to verify you have the textbook. This is required before registration.
              </p>
            </div>

            {loadingQuestion ? (
              <p className="text-center text-muted-foreground text-sm">Loading...</p>
            ) : question ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground">{question.question}</p>
                </div>

                <input
                  type="text"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Your answer"
                  className={`input-professional ${status === "error" ? "error" : ""}`}
                  disabled={status === "loading" || status === "success"}
                />

                <Button
                  onClick={handleVerify}
                  disabled={!answer.trim() || status === "loading" || status === "success"}
                  className="w-full h-12 text-base font-medium gap-2"
                >
                  {status === "loading" ? "Verifying..." : (
                    <>Verify <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>

                {status === "error" && (
                  <div className="alert-error flex items-start gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Incorrect answer. Please check your textbook and try again.</span>
                  </div>
                )}

                {status === "success" && (
                  <div className="alert-success flex items-start gap-2 animate-fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Verified! Redirecting to registration...</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm">No verification question available.</p>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
              Sign in
            </button>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Verify;
