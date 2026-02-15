import { useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResultsFooterActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print / Export PDF
        </Button>
        <Button onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Analyze Another Case
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
        This analysis is a tool for professional reflection, not a substitute for ethical judgment.
        Always exercise your professional expertise when making decisions.
      </p>
    </div>
  );
}
