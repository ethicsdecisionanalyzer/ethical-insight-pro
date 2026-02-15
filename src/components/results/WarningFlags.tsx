import { ShieldAlert } from "lucide-react";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

interface WarningFlagsProps {
  analysis: EthicsAnalysis;
}

export function WarningFlags({ analysis }: WarningFlagsProps) {
  if (!analysis.warningFlags || analysis.warningFlags.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5" />
        Warning Flags
      </h3>
      <ul className="space-y-2">
        {analysis.warningFlags.map((flag, i) => (
          <li key={i} className="text-sm text-destructive flex items-start gap-2">
            <span className="mt-0.5 font-bold">⚠️</span>
            {flag}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-destructive/20">
        Consider consulting a supervisor, ethics committee, or legal counsel regarding flagged items.
      </p>
    </div>
  );
}
