import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      // Already logged in — redirect based on role
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const }).then(({ data }) => {
        if (data === true) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/case-intake", { replace: true });
        }
      });
    }
  }, [user, authLoading, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check if user is admin and redirect accordingly
    const userId = signInData.user?.id;
    if (userId) {
      const { data: roleData } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin" as const,
      });
      if (roleData === true) {
        navigate("/admin", { replace: true });
        return;
      }
    }

    navigate("/case-intake", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <Header variant="landing" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card-professional-elevated p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Sign In</h2>
              <p className="text-muted-foreground text-sm">
                Sign in to submit and view your ethics case analyses.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-professional"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input-professional"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="alert-error flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading || !email.trim() || !password.trim()} className="w-full h-12 text-base font-medium">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button onClick={() => navigate("/verify")} className="text-primary hover:underline font-medium">
              Get started
            </button>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
