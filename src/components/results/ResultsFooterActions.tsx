import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { generateCasePdf } from "@/services/database";
import { useAuth } from "@/contexts/AuthContext";

interface ResultsFooterActionsProps {
  caseId: string;
}

export function ResultsFooterActions({ caseId }: ResultsFooterActionsProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await generateCasePdf(caseId);
      const link = document.createElement("a");
      link.href = result.signedUrl;
      link.download = `ethics-analysis-${caseId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "PDF Generated", description: "Your report is downloading." });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Could not generate PDF.",
        variant: "destructive",
      });
    }
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={handleExportPdf} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? "Generating..." : "Download PDF"}
        </Button>
        <Button onClick={() => window.print()} variant="outline" className="gap-2 print:hidden">
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button onClick={() => navigate(isAdmin ? "/admin" : "/case-intake")} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {isAdmin ? "Back to Dashboard" : "Analyze Another Case"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
        This tool provides a structured analytical framework and does not constitute legal, medical, or professional advice. Independent professional judgment remains essential.
      </p>
    </div>
  );
}
