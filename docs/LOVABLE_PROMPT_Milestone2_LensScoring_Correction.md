# Lovable Prompt: Milestone 2 Correction — Remove User-Input Lens Scoring, Move Scoring Into Algorithm

---

## Project Context

**Project:** Ethical Insight Pro (ethical-insight-pro)
**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase (auth, database, edge functions), Gemini 2.0 Flash AI
**Book:** "Ethical Decision-making in Occupational and Environmental Health and Safety: A Comparative Case Study Approach" (Wiley, 2026)
**Current Algorithm Version:** 2.0 (deterministic guardrails layer with 70/30 weighting)

---

## Problem Statement

The current Milestone 2 build requires the **user** to manually assign 1–10 alignment scores to each of the six ethical lenses via slider inputs on the Case Intake form. This is architecturally incorrect and diverges from the book's methodology.

**Why this is wrong:**
1. The algorithm — not the user — must determine lens alignment scores based on narrative analysis.
2. User self-scoring produces subjective opinion data, not analytical output.
3. The algorithm loses its analytic authority when it merely echoes back user-provided numbers.
4. The deterministic guardrails layer currently operates on user input instead of computed values, making the 70/30 weighting formula meaningless.
5. The dataset becomes unreliable for research and publication purposes.

**The intended architecture per the book's framework:**
1. User submits narrative (case description + metadata + professional codes).
2. The AI analyzes the case across all six ethical lenses.
3. The AI returns both qualitative reasoning AND numeric alignment scores (1–10) for each lens.
4. The deterministic guardrails layer validates/clamps the AI scores, computes the 70/30 composite, classifies stability, and enforces violation caps.
5. The output presents structured reasoning and the final composite evaluation.

The user's only role is to **describe the ethical dilemma**. The system does all scoring.

---

## Exact Changes Required

### CHANGE 1: Remove User-Input Lens Scoring from Case Intake Form

**File:** `src/pages/CaseIntake.tsx`

**Remove the following:**

1. Remove the `lensScores` state variable and its initialization:
```typescript
// DELETE THIS ENTIRE BLOCK
const [lensScores, setLensScores] = useState<Record<string, number>>({
  utilitarian: 5,
  duty: 5,
  justice: 5,
  virtue: 5,
  care: 5,
  commonGood: 5,
});
```

2. Remove the `Slider` import from the top of the file:
```typescript
// DELETE THIS IMPORT
import { Slider } from "@/components/ui/slider";
```

3. Remove the entire "Ethical Lens Scoring" section from the form JSX. This is the block that starts with:
```tsx
{/* Ethical Lens Scoring */}
<div>
  <label className="block text-sm font-medium text-foreground mb-1">
    Ethical Lens Scoring <span className="text-destructive">*</span>
  </label>
```
...and ends after the closing `</div>` of the `.space-y-5` container that holds all 6 slider groups (utilitarian, duty, justice, virtue, care, commonGood). Remove this entire block including all 6 lens slider groups.

4. Remove `lensScores` from the `analyzeCase()` call in `handleSubmit`:
```typescript
// CHANGE THIS:
const analysis = await analyzeCase({
  title,
  narrative,
  stakeholders: stakeholders || "",
  selectedCodes,
  lensScores,  // <-- DELETE THIS LINE
});

// TO THIS:
const analysis = await analyzeCase({
  title,
  narrative,
  stakeholders: stakeholders || "",
  selectedCodes,
});
```

**Do NOT change anything else in CaseIntake.tsx.** Keep the Case Title, Case Description, Key Stakeholders, Professional Codes checkboxes, Consent checkboxes, and all action buttons exactly as they are.

---

### CHANGE 2: Remove lensScores from the Analysis Service Interface

**File:** `src/services/aiAnalysis.ts`

1. Remove `lensScores` from the `AnalysisRequest` interface:
```typescript
// CHANGE THIS:
export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
  lensScores?: Record<string, number>;  // <-- DELETE THIS LINE
}

// TO THIS:
export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
}
```

2. Remove `lensScores` from the `analyzeCase` function body:
```typescript
// CHANGE THIS:
body: {
  title: request.title,
  narrative: request.narrative,
  stakeholders: request.stakeholders,
  selectedCodes: request.selectedCodes,
  lensScores: request.lensScores,  // <-- DELETE THIS LINE
},

// TO THIS:
body: {
  title: request.title,
  narrative: request.narrative,
  stakeholders: request.stakeholders,
  selectedCodes: request.selectedCodes,
},
```

**Do NOT change any of the response interfaces** (`LensScore`, `EthicsAnalysis`, `ViolationDetection`). They are correct as-is because the output structure remains the same — only the source of the scores changes.

---

### CHANGE 3: Update the Supabase Edge Function to Compute Lens Scores via AI

**File:** `supabase/functions/analyze-case/index.ts`

This is the most critical change. The AI must now return numeric scores alongside its reasoning, and the guardrails layer must consume those AI-generated scores instead of user-provided ones.

#### 3A. Update the SYSTEM_PROMPT

Replace the line:
```
CRITICAL: You provide QUALITATIVE REASONING ONLY. All numeric scores, classifications, and labels are computed deterministically by a post-processing guardrails layer. Do NOT assign numeric scores. Do NOT classify ethical stability. Do NOT use prescriptive language.
```

With:
```
CRITICAL: You provide QUALITATIVE REASONING and NUMERIC ALIGNMENT SCORES (1–10) for each ethical lens. You do NOT classify ethical stability — that is computed deterministically by a post-processing guardrails layer. Do NOT use prescriptive language ("should", "must", "recommended"). Use analytical framing only.

For each lens, you must assign an integer score from 1 to 10 that represents how well the described situation aligns with that ethical perspective:
- 1–3: The situation significantly conflicts with this ethical lens
- 4–6: The situation shows mixed alignment or tension with this lens
- 7–10: The situation aligns well with this ethical lens

Base your scores strictly on the narrative content provided. Be analytically rigorous. Different lenses WILL often produce different scores for the same case — this is expected and correct. Do not default to middle scores; differentiate meaningfully based on the case specifics.
```

#### 3B. Update the USER_PROMPT_TEMPLATE JSON schema

Change the `lensReasoning` section in the expected JSON output from:
```json
"lensReasoning": {
  "utilitarian": "<2-3 sentences of analytical reasoning>",
  "duty": "<2-3 sentences of analytical reasoning>",
  ...
}
```

To:
```json
"lensAnalysis": {
  "utilitarian": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" },
  "duty": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" },
  "justice": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" },
  "virtue": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" },
  "care": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" },
  "commonGood": { "score": <integer 1-10>, "reasoning": "<2-3 sentences of analytical reasoning>" }
}
```

Also update the CRITICAL REMINDERS at the bottom of the prompt. Remove:
```
- Do NOT include any numeric scores. Scores are computed deterministically.
```
Replace with:
```
- Include a numeric alignment score (integer 1-10) for each lens based on your analysis of the narrative.
```

#### 3C. Update the applyGuardrails function signature and logic

Change the function signature from:
```typescript
function applyGuardrails(
  raw: Record<string, unknown>,
  lensInputScores: Record<string, number>
): Record<string, unknown> {
```

To:
```typescript
function applyGuardrails(
  raw: Record<string, unknown>
): Record<string, unknown> {
```

Change the lens score extraction logic inside applyGuardrails. Replace:
```typescript
// 1. Build lens scores from USER-PROVIDED inputs (integers 1-10)
const lensScores: Record<string, Record<string, unknown>> = {};
const lensReasoning = (raw.lensReasoning ?? {}) as Record<string, string>;

for (const key of lensKeys) {
  lensScores[key] = {
    score: clampScore(lensInputScores[key] ?? 5),
    reasoning: lensReasoning[key] || "No analysis provided.",
  };
}
```

With:
```typescript
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
```

#### 3D. Remove userLensScores from the request handler

In the `serve()` handler, change:
```typescript
const { title, narrative, stakeholders, selectedCodes, lensScores: userLensScores } = await req.json();
```

To:
```typescript
const { title, narrative, stakeholders, selectedCodes } = await req.json();
```

Remove the default lens scores block:
```typescript
// DELETE THIS ENTIRE BLOCK
const lensInputScores = userLensScores ?? {
  utilitarian: 5, duty: 5, justice: 5, virtue: 5, care: 5, commonGood: 5,
};
```

Change the guardrails call from:
```typescript
const enforced = applyGuardrails(aiOutput, lensInputScores);
```

To:
```typescript
const enforced = applyGuardrails(aiOutput);
```

---

## What Must NOT Change

Preserve all of the following exactly as they are:

1. **Deterministic guardrails layer logic** — The `clampScore()`, `standardDeviation()`, composite score formula (70% code + 30% lens), violation cap at 4.9, conflict/stability classification thresholds — all remain identical.
2. **70/30 weighting** — `lensComponent = lensAverage * 0.30` and `codeComponent = codeScore * 0.70` — no change.
3. **Non-prescriptive output structure** — All results components (`LensCard`, `LensRadarChart`, `ResultsHeader`, `ConflictAlert`, `WarningFlags`, `CodeImplications`, `RecommendationsSection`, `ResultsFooterActions`) remain unchanged. They already consume the `lensScores` object from the analysis response generically.
4. **Professional code violation detection** — The violation detection logic, severity classification, and code compliance scoring remain deterministic.
5. **EthicsAnalysis response interface** in `aiAnalysis.ts` — The shape of the response object sent to the frontend does not change.
6. **All authentication, authorization, usage limits, consent flows, admin dashboard** — No changes.
7. **The `_internal`, `_guardrailsApplied`, `_algorithmVersion` metadata fields** — Preserve for research dataset integrity.

---

## Validation Criteria

After implementing these changes, verify:

1. The Case Intake form has NO slider inputs for ethical lenses. The form collects only: Case Title, Case Description, Key Stakeholders, Professional Codes, and Consent checkboxes.
2. Submitting a case sends only `title`, `narrative`, `stakeholders`, and `selectedCodes` to the edge function (no `lensScores` in the request payload).
3. The edge function prompts Gemini to return `lensAnalysis` with both `score` and `reasoning` for each of the 6 lenses.
4. The `applyGuardrails()` function extracts scores from the AI output (not from user input), clamps them 1-10, and computes the composite score using the existing 70/30 formula.
5. The Results page displays all 6 lens cards with AI-generated scores and reasoning, the radar chart, composite score, stability classification, conflict alerts, and all other existing output sections — all unchanged in appearance and structure.
6. The composite score cap at 4.9 for violations still works.
7. The ethical stability classification (Stable / Contested / Ethically Unstable) still works based on standard deviation of the AI-generated scores.

---

## Files Modified (Summary)

| File | Action |
|------|--------|
| `src/pages/CaseIntake.tsx` | Remove lens slider UI, remove lensScores state, remove Slider import |
| `src/services/aiAnalysis.ts` | Remove lensScores from AnalysisRequest interface and function body |
| `supabase/functions/analyze-case/index.ts` | Update AI prompt to return scores, update guardrails to use AI scores, remove user score passthrough |

| File | Action |
|------|--------|
| `src/pages/Results.tsx` | NO CHANGE |
| `src/components/results/*` | NO CHANGE (all 7 result components) |
| `src/services/database.ts` | NO CHANGE |
| `src/contexts/AuthContext.tsx` | NO CHANGE |
| `src/pages/Admin.tsx` | NO CHANGE |

---

## Architectural Rationale

This correction restores the book's intended methodology:

- **User Role:** Submit narrative context only. The user is the subject-matter expert describing the dilemma, not the analyst scoring it.
- **AI Role:** Analyze the narrative through all six ethical lenses and assign evidence-based alignment scores with structured reasoning.
- **Guardrails Role:** Validate AI output (clamp scores, compute composite, classify stability, enforce violation caps). The guardrails layer is a deterministic safety net over AI output — not a pass-through for user opinions.
- **Output Role:** Present non-prescriptive, structured analytical results for professional reflection.

This separation ensures the dataset remains analytically valid for research and publication, and the algorithm maintains its analytic authority as designed in the book's framework.
