import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-6 border-t border-border bg-background-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <p>© 2026 Ethical Decision-Making Analyzer.</p>
            <Link to="/about" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              About / Information
            </Link>
          </div>
          <p className="flex items-center gap-1">
            <span>🔒</span>
            Your case submissions are confidential and session-based.
          </p>
        </div>
      </div>
    </footer>
  );
}
