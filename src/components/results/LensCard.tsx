import { Shield, Users, Scale, Eye, Heart, Globe } from "lucide-react";
import type { LensScore } from "@/services/aiAnalysis";

const LENS_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  duty: { label: "Deontological / Duty", icon: <Shield className="w-5 h-5" />, description: "Professional obligations and codes" },
  utilitarian: { label: "Utilitarian", icon: <Users className="w-5 h-5" />, description: "Greatest good for greatest number" },
  justice: { label: "Justice / Fairness", icon: <Scale className="w-5 h-5" />, description: "Equitable treatment" },
  virtue: { label: "Virtue Ethics", icon: <Eye className="w-5 h-5" />, description: "Character and integrity" },
  care: { label: "Care Ethics", icon: <Heart className="w-5 h-5" />, description: "Relationships and vulnerable populations" },
  commonGood: { label: "Common Good", icon: <Globe className="w-5 h-5" />, description: "Shared conditions and community welfare" },
};

function barColor(score: number): string {
  if (score >= 7) return "bg-success";
  if (score >= 4) return "bg-warning";
  return "bg-destructive";
}

interface LensCardProps {
  lensKey: string;
  lens: LensScore;
}

export function LensCard({ lensKey, lens }: LensCardProps) {
  const meta = LENS_META[lensKey];
  if (!meta) return null;

  return (
    <div className="card-professional p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-primary mt-0.5">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">{meta.label}</h3>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="text-sm font-bold text-foreground">{lens.score}/10</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor(lens.score)}`}
            style={{ width: `${lens.score * 10}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">1 = Very low ethical alignment · 10 = Very high ethical alignment</p>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{lens.reasoning}</p>
    </div>
  );
}
