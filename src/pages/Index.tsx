import { useNavigate } from "react-router-dom";
import { BookOpen, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // If logged in, redirect to case intake
  if (!authLoading && user) {
    navigate("/case-intake");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="landing" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
