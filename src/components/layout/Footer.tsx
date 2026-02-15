export function Footer() {
  return (
    <footer className="py-6 border-t border-border bg-background-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 Ethical Decision-Making Analyzer. For support, contact ethics-support@example.com</p>
          <p className="flex items-center gap-1">
            <span>🔒</span>
            Your case submissions are confidential and session-based.
          </p>
        </div>
      </div>
    </footer>
  );
}
