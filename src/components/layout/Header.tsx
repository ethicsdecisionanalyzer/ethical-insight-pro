import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface HeaderProps {
  variant?: "landing" | "page";
}

export function Header({ variant = "landing" }: HeaderProps) {
  const { user, profile, signOut } = useAuth();

  if (variant === "landing") {
    return (
      <header className="pt-12 pb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Ethical Decision-Making Analyzer
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          A companion tool for occupational health and safety professionals
        </p>
        <div className="decorative-line" />
      </header>
    );
  }

  return (
    <header className="py-4 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              Ethical Decision-Making Analyzer
            </Link>
            <nav className="text-sm text-muted-foreground mt-1">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span>Submit Case</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {profile?.full_name || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
