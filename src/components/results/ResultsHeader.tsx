import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { EthicsAnalysis } from "@/services/aiAnalysis";
import type { CaseSubmission } from "@/services/database";
import { professionalCodes } from "@/services/database";

const stabilityConfig: Record<string, { label: string; className: string }> = {
  "Stable": { label: "Stable", className: "bg-success/10 text-success border-success/30" },
  "Contested": { label: "Contested", className: "bg-warning/10 text-warning border-warning/30" },
  "Ethically Unstable": { label: "Ethically Unstable", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function scoreColor(score: number): string {
  if (score >= 7) return "bg-success text-success-foreground";
  if (score >= 4) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

interface ResultsHeaderProps {
  caseData: CaseSubmission;
  analysis: EthicsAnalysis;
}

export function ResultsHeader({ caseData, analysis }: ResultsHeaderProps) {
  const stability = stabilityConfig[analysis.ethicalStability] || stabilityConfig["Stable"];
  const codeLabels = professionalCodes.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.label;
    return acc;
  }, {});

  return (
    <div className="card-professional-elevated p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Score circle */}
        <div className="flex-shrink-0 text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${scoreColor(analysis.compositeScore)}`}>
            {analysis.compositeScore}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Composite Score / 10</p>
        </div>

        {/* Case info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground mb-1 truncate">{caseData.title}</h1>
          <p className="text-sm text-muted-foreground mb-3">
            Submitted {format(new Date(caseData.created_at), "MMMM d, yyyy 'at' h:mm a")}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {caseData.selected_codes.map((code) => (
              <Badge key={code} variant="secondary" className="text-xs">
                {codeLabels[code] || code}
              </Badge>
            ))}
          </div>

          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${stability.className}`}>
            Ethical Stability: {stability.label}
          </span>
        </div>
      </div>
    </div>
  );
}
