import { FileText, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

interface CodeImplicationsProps {
  analysis: EthicsAnalysis;
}

export function CodeImplications({ analysis }: CodeImplicationsProps) {
  const implications = analysis.conflictAnalysis.professionalCodeImplications;
  if (!implications || Object.keys(implications).length === 0) return null;

  return (
    <Collapsible className="card-professional mb-6">
      <CollapsibleTrigger className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors rounded-lg">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Professional Code Implications</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              These are professional obligations, not algorithmic determinations
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pb-5">
        <div className="space-y-3 pt-2 border-t border-border">
          {Object.entries(implications).map(([code, implication]) => (
            <div key={code} className="bg-muted/50 rounded-lg p-4">
              <span className="font-semibold text-sm text-primary">{code}</span>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{implication}</p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
