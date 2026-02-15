import { CheckCircle, Lightbulb } from "lucide-react";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

interface RecommendationsSectionProps {
  analysis: EthicsAnalysis;
}

export function RecommendationsSection({ analysis }: RecommendationsSectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <div className="card-professional p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Recommended Actions
        </h3>
        <ul className="space-y-2">
          {analysis.recommendedActions.map((action, i) => (
            <li key={i} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-success mt-0.5 font-bold">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-professional p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          Questions for Reflection
        </h3>
        <ul className="space-y-2">
          {analysis.questionsForReflection.map((q, i) => (
            <li key={i} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-warning mt-0.5 font-bold">?</span>
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
