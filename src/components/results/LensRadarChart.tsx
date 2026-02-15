import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { EthicsAnalysis } from "@/services/aiAnalysis";

const LENS_LABELS: Record<string, string> = {
  duty: "Duty",
  utilitarian: "Utilitarian",
  rights: "Rights",
  justice: "Justice",
  virtue: "Virtue",
  care: "Care",
};

interface LensRadarChartProps {
  analysis: EthicsAnalysis;
}

export function LensRadarChart({ analysis }: LensRadarChartProps) {
  const data = Object.entries(analysis.lensScores).map(([key, lens]) => ({
    lens: LENS_LABELS[key] || key,
    score: lens.score,
    fullMark: 10,
  }));

  return (
    <div className="card-professional p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Lens Score Distribution</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="lens"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {analysis.conflictLevel >= 2 && (
        <p className="text-sm text-muted-foreground mt-3">
          Score divergence indicates {analysis.conflictLevel === 3 ? "severe" : "significant"} tension between ethical frameworks. The wider the shape, the more balanced the ethical assessment.
        </p>
      )}
    </div>
  );
}
