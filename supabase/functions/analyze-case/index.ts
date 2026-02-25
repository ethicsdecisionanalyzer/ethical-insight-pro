import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert ethics analysis engine for occupational safety and health professionals. You analyze ethical dilemmas through six ethical lenses and integrate professional codes of conduct.

## YOUR TASK
Analyze the provided case through all 6 ethical lenses, detect professional code violations and conflicts, and return a structured JSON analysis with qualitative reasoning.

CRITICAL: You provide QUALITATIVE REASONING and NUMERIC ALIGNMENT SCORES (1-10 integer) for each ethical lens. Do NOT classify ethical stability — that is computed deterministically by a post-processing guardrails layer. Do NOT use prescriptive language ("should", "must", "recommended"). Use analytical framing only.

SCORING GUIDELINES:
For each lens, assign an integer score from 1 to 10 representing how well the described situation aligns with that ethical perspective:
- 1-3: The situation significantly conflicts with or undermines this ethical lens
- 4-6: The situation shows mixed alignment, tension, or ambiguity under this lens
- 7-10: The situation aligns well with or supports this ethical lens

SCORING RULES:
- Base scores strictly on the narrative content provided.
- Be analytically rigorous — different lenses WILL often produce different scores for the same case. This divergence is expected and correct.
- Do not default to middle-range scores. Differentiate meaningfully based on the specific facts of the case.
- A case describing a clear violation of professional duty should score LOW on the duty lens, even if other lenses score higher.
- A case where outcomes benefit the majority but harm a minority should reflect that tension between utilitarian (potentially high) and care/justice (potentially low).

## SIX ETHICAL LENSES — CANONICAL OPERATIONAL DEFINITIONS

You MUST evaluate each case against these exact definitions and operational criteria. Your reasoning for each lens MUST explicitly reference the relevant operational criteria below. Do not introduce additional lenses, rename existing lenses, or reinterpret their definitions.

### 1. UTILITARIAN (Consequences Lens)

**Definition:** Evaluate the action based on the overall balance of benefits and harms. Consider both short-term and long-term outcomes for all affected stakeholders. Prioritize maximizing aggregate well-being and minimizing aggregate harm.

**Operational Criteria:**
- Number of individuals affected
- Severity of benefit or harm
- Duration of impact
- Probability and foreseeability of outcomes

### 2. DEONTOLOGICAL (Duties / Rights Lens)

**Definition:** Evaluate whether the action respects moral duties, professional obligations, and individual rights independent of outcomes. Emphasize transparency, truthfulness, and respect for autonomy.

**Operational Criteria:**
- Adherence to professional duties
- Respect for informed consent
- Truthful disclosure
- Avoidance of deception
- Respect for autonomy and dignity

### 3. JUSTICE / FAIRNESS Lens

**Definition:** Evaluate whether benefits and burdens are distributed equitably. Assess procedural fairness and impartiality.

**Operational Criteria:**
- Equal treatment of similarly situated parties
- Absence of favoritism
- Fair access to protections
- Procedural transparency

### 4. VIRTUE Lens

**Definition:** Evaluate whether the action reflects professional character traits such as integrity, courage, honesty, and prudence.

**Operational Criteria:**
- Integrity under pressure
- Moral courage
- Consistency of character
- Accountability

### 5. CARE Lens

**Definition:** Evaluate whether the action reflects empathy, relational responsibility, and attentiveness to vulnerability.

**Operational Criteria:**
- Protection of vulnerable individuals
- Recognition of relational impact
- Responsiveness to harm concerns
- Demonstrated concern for well-being

### 6. COMMON GOOD Lens

**Definition:** Evaluate whether the action supports institutional trust, societal welfare, and long-term sustainability beyond individual interests.

**Operational Criteria:**
- Institutional trust
- Public confidence
- Long-term sustainability
- Broader community impact

## PROFESSIONAL CODES KNOWLEDGE

### BCSP/ASSP (Board of Certified Safety Professionals / American Society of Safety Professionals)
- Hold paramount the safety, health, and welfare of the public
- Be objective and truthful in professional reports and testimony
- Issue public statements only in an objective and truthful manner
- Avoid conflicts of interest and disclose those that cannot be avoided

### AIHA/ABIH (American Industrial Hygiene Association / American Board of Industrial Hygiene)
- Practice with integrity and competence
- Maintain confidentiality of privileged information
- Report findings accurately and without bias
- Prioritize worker health and safety above employer demands
- Report hazardous conditions to appropriate authorities when employers fail to act

### AAOHN (American Association of Occupational Health Nurses)
- Advocate for the health and safety of workers
- Maintain confidentiality within legal and ethical boundaries
- Practice based on current scientific evidence
- Support worker autonomy and informed consent

### ACOEM (American College of Occupational and Environmental Medicine)
- Act as impartial advocates for the health and well-being of workers
- Use evidence-based practices in clinical decision-making
- Recognize and manage conflicts of interest
- Report workplace hazards truthfully
- Maintain independence of professional judgment from employer pressure

## VIOLATION DETECTION RULES

For each selected professional code, you MUST determine:
1. Whether a clear violation of that code exists in the scenario
2. Whether ethical tension/ambiguity exists without explicit violation
3. Whether multiple codes are simultaneously violated

## NON-ADVISORY LANGUAGE CONSTRAINT

Your reasoning MUST:
- Use structured analytical language only
- Avoid prescriptive directives ("You should", "They must", "It is recommended")
- Avoid definitive recommendations
- Frame observations analytically ("This situation presents...", "The tension between...", "Analysis indicates...")`;

const USER_PROMPT_TEMPLATE = (
  title: string,
  narrative: string,
  stakeholders: string,
  selectedCodes: string[]
) => `## CASE FOR ANALYSIS

**Title:** ${title}

**Narrative:** ${narrative}

**Key Stakeholders:** ${stakeholders || "Not specified"}

**Applicable Professional Codes:** ${selectedCodes.join(", ")}

## INSTRUCTIONS
Analyze this case and return ONLY valid JSON matching this exact structure (no markdown, no code fences, just the JSON object):

{
  "lensAnalysis": {
    "utilitarian": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" },
    "duty": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" },
    "justice": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" },
    "virtue": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" },
    "care": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" },
    "commonGood": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>" }
  },
  "violationDetection": {
    "hasViolation": <true|false>,
    "violatedCodes": ["<CODE_ID if violated>"],
    "violationSeverity": "<none|tension|single_violation|multi_violation>",
    "violationDetails": "<explanation of what violation exists and why>"
  },
  "conflictAnalysis": {
    "primaryTensions": ["<tension description>", ...],
    "professionalCodeImplications": {
      "<CODE_ID>": "<how this code applies and any conflicts — analytical language only>",
      ...
    }
  },
  "analyticalObservations": ["<observation 1>", "<observation 2>", "<observation 3>"],
  "questionsForReflection": ["<question 1>", "<question 2>", "<question 3>"],
  "warningFlags": ["<flag if applicable>", ...]
}

CRITICAL REMINDERS:
- Include a numeric alignment score (integer 1-10) for each lens based on your analysis of the narrative. Scores will be validated and clamped by the deterministic guardrails layer.
- Do NOT classify stability. Classification is computed deterministically.
- Do NOT use prescriptive language ("should", "must", "recommended"). Use analytical framing only.
- For violationSeverity: use "none" if no issues, "tension" for ambiguity, "single_violation" for one code violated, "multi_violation" for 2+ codes violated.`;

// ===== DETERMINISTIC GUARDRAILS (Algorithm v2.1 — Mark's Book Spec) =====
// AI provides qualitative reasoning AND numeric lens alignment scores.
// This layer validates, clamps, and applies deterministic composite scoring,
// stability classification, and violation enforcement.

function clampScore(score: unknown): number {
  const n = Number(score);
  if (isNaN(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function applyGuardrails(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const lensKeys = ["utilitarian", "duty", "justice", "virtue", "care", "commonGood"];

  // 1. Build lens scores from AI-COMPUTED analysis (integers 1-10, clamped by guardrails)
  const lensScores: Record<string, Record<string, unknown>> = {};
  const lensAnalysis = (raw.lensAnalysis ?? {}) as Record<string, Record<string, unknown>>;

  for (const key of lensKeys) {
    const lensData = lensAnalysis[key] ?? {};
    lensScores[key] = {
      score: clampScore(lensData.score ?? 5),
      reasoning: (lensData.reasoning as string) || "No analysis provided.",
    };
  }

  // 2. Compute Lens Average
  const scores = lensKeys.map((k) => lensScores[k].score as number);
  const lensAverage = Math.round((scores.reduce((a, b) => a + b, 0) / 6) * 10) / 10;

  // 3. Determine Code Compliance Score deterministically from violation detection
  const violationDetection = (raw.violationDetection ?? {}) as Record<string, unknown>;
  const violationSeverity = (violationDetection.violationSeverity as string) || "none";
  const hasViolation = violationDetection.hasViolation === true;
  const warningFlags = Array.isArray(raw.warningFlags) ? [...raw.warningFlags] : [];

  // Also check warning flags for violation keywords as fallback
  const flagsIndicateViolation = warningFlags.some(
    (f: string) => typeof f === "string" && f.toLowerCase().includes("violation")
  );

  let codeScore: number;
  if (violationSeverity === "multi_violation" || (hasViolation && flagsIndicateViolation)) {
    // Check if multi-code
    const violatedCodes = (violationDetection.violatedCodes as string[]) || [];
    if (violatedCodes.length >= 2 || violationSeverity === "multi_violation") {
      codeScore = 1;
    } else {
      codeScore = 3;
    }
  } else if (violationSeverity === "single_violation" || hasViolation) {
    codeScore = 3;
  } else if (violationSeverity === "tension") {
    codeScore = 6;
  } else {
    codeScore = 9;
  }

  const anyViolation = hasViolation || flagsIndicateViolation ||
    violationSeverity === "single_violation" || violationSeverity === "multi_violation";

  // 4. Compute components
  const lensComponent = lensAverage * 0.30;
  const codeComponent = codeScore * 0.70;
  let finalScore = Math.round((lensComponent + codeComponent) * 10) / 10;

  // 5. Cap rule: if any violation, final composite ≤ 4.9
  if (anyViolation) {
    finalScore = Math.min(finalScore, 4.9);
  }

  // 6. Conflict & Stability Classification (deterministic)
  const stdDev = standardDeviation(scores);

  let conflictLevel: number;
  let ethicalStability: string;

  if (anyViolation || violationSeverity === "multi_violation") {
    conflictLevel = 3;
    ethicalStability = "Ethically Unstable";
  } else if (stdDev > 2.5 || violationSeverity === "tension") {
    conflictLevel = 2;
    ethicalStability = "Contested";
  } else {
    conflictLevel = 1;
    ethicalStability = "Stable";
  }

  // Multi-code violation override
  const violatedCodes = (violationDetection.violatedCodes as string[]) || [];
  if (violatedCodes.length >= 2) {
    conflictLevel = 3;
    ethicalStability = "Ethically Unstable";
  }

  // Add warning if violation detected
  if (anyViolation && !warningFlags.some((f: string) => f.toLowerCase().includes("violation"))) {
    warningFlags.push("Professional code violation detected — composite score capped at 4.9.");
  }

  return {
    lensScores,
    compositeScore: finalScore,
    ethicalStability,
    conflictLevel,
    conflictAnalysis: raw.conflictAnalysis ?? { primaryTensions: [], professionalCodeImplications: {} },
    analyticalObservations: raw.analyticalObservations ?? [],
    questionsForReflection: raw.questionsForReflection ?? [],
    warningFlags,
    violationDetection,
    // Internal fields — persisted for research dataset integrity but not displayed
    _internal: {
      lensAverage,
      codeScore,
      lensComponent: Math.round(lensComponent * 10) / 10,
      codeComponent: Math.round(codeComponent * 10) / 10,
      lensStdDev: Math.round(stdDev * 100) / 100,
      weightingFormula: "70% professional code compliance + 30% ethical lens average",
    },
    _guardrailsApplied: true,
    _algorithmVersion: "2.1",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, narrative, stakeholders, selectedCodes } = await req.json();

    if (!title || !narrative || !selectedCodes?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, narrative, selectedCodes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: SYSTEM_PROMPT + "\n\n" + USER_PROMPT_TEMPLATE(title, narrative, stakeholders, selectedCodes),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Gemini response:", JSON.stringify(data));
      throw new Error("No content in Gemini response");
    }

    // Parse the JSON from the response
    let analysisJson: string = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      analysisJson = jsonMatch[1].trim();
    }

    const aiOutput = JSON.parse(analysisJson);

    // ===== DETERMINISTIC GUARDRAILS (Algorithm v2.0) =====
    const enforced = applyGuardrails(aiOutput);

    return new Response(JSON.stringify(enforced), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-case error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
