import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

const conflictConfig: Record<number, { title: string; description: string }> = {
  2: { title: "Significant Ethical Conflict Detected", description: "Lens scores show 3–5 point divergence, indicating meaningful tension between ethical perspectives." },
  3: { title: "Ethical Dilemma — Severe Conflict", description: "Lens scores diverge by more than 5 points or professional code violations detected. Consultation recommended." },
};

interface ConflictAlertProps {
  analysis: EthicsAnalysis;
}

export function ConflictAlert({ analysis }: ConflictAlertProps) {
  if (analysis.conflictLevel < 2) return null;

  const config = conflictConfig[analysis.conflictLevel];

  return (
    <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/5">
      <ShieldAlert className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{config.description}</p>

        {analysis.conflictAnalysis.primaryTensions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Primary Tensions:</p>
            <ul className="space-y-1">
              {analysis.conflictAnalysis.primaryTensions.map((t, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.conflictLevel === 3 && (
          <p className="text-sm font-medium mt-2">
            ⚠️ Consider consulting a supervisor, ethics committee, or legal counsel.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
