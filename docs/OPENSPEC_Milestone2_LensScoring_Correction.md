# OpenSpec Proposal: Milestone 2 Correction
# Transfer Lens Scoring Authority from User Input to Algorithmic Computation

---

## 1. METADATA

| Field | Value |
|---|---|
| **Proposal ID** | OPENSPEC-EIP-2026-002 |
| **Title** | Remove User-Input Lens Scoring; Compute Lens Alignment Scores via AI + Deterministic Guardrails |
| **Author** | Mark (Book Author / System Architect) |
| **Priority** | CRITICAL -- Blocking Milestone 3 |
| **Type** | Architectural Correction (Defect) |
| **Status** | PROPOSED |
| **Date** | 2026-02-24 |
| **Milestone** | 2 (Pre-Milestone 3 Blocker) |
| **Estimated Scope** | 3 files modified, 0 files added, 0 files deleted |
| **Risk Level** | Medium (data flow change across 3 layers, but no schema/DB changes) |

---

## 2. EXECUTIVE SUMMARY

The current Milestone 2 build requires end-users to manually assign 1-10 alignment scores to each of the six ethical lenses via slider inputs on the Case Intake form. This fundamentally violates the book's methodology. The algorithm must be the sole authority for lens scoring. The user's role is to describe the ethical dilemma; the system's role is to analyze it.

This proposal specifies the exact changes required to transfer scoring authority from user input to the AI analysis engine, while preserving the deterministic guardrails layer, the 70/30 weighting formula, and the non-prescriptive output structure.

---

## 3. PROBLEM ANALYSIS

### 3.1 Current Data Flow (INCORRECT)

```
USER                          FRONTEND                      EDGE FUNCTION                    AI (Gemini)
  |                              |                              |                               |
  |-- fills 6 sliders (1-10) -->|                              |                               |
  |-- writes narrative -------->|                              |                               |
  |-- selects codes ----------->|                              |                               |
  |                              |                              |                               |
  |                              |-- POST {title, narrative,-->|                               |
  |                              |    stakeholders,             |                               |
  |                              |    selectedCodes,            |                               |
  |                              |    lensScores: {             |                               |
  |                              |      utilitarian: 5,         |                               |
  |                              |      duty: 7, ...}}         |                               |
  |                              |                              |                               |
  |                              |                              |-- prompt (reasoning only) ---->|
  |                              |                              |                               |
  |                              |                              |<-- {lensReasoning: {...}} ----|
  |                              |                              |                               |
  |                              |                              |-- applyGuardrails(            |
  |                              |                              |     aiOutput,                  |
  |                              |                              |     USER_SCORES) ------------>|
  |                              |                              |                               |
  |                              |                              |   Pairs USER scores with      |
  |                              |                              |   AI reasoning text.           |
  |                              |                              |   Feeds USER scores into       |
  |                              |                              |   70/30 composite formula.     |
  |                              |                              |                               |
  |<------------ structured results with USER-provided scores --|                               |
```

### 3.2 What Is Wrong

| # | Issue | Impact |
|---|-------|--------|
| 1 | Users self-score ethical lens alignment via 6 slider inputs (1-10) | Scores are subjective opinion, not analytical output |
| 2 | AI is explicitly told "Do NOT assign numeric scores" in the system prompt | AI cannot contribute to scoring even though it analyzes the case |
| 3 | `applyGuardrails()` receives user scores as `lensInputScores` parameter | Guardrails layer validates user opinion, not computed analysis |
| 4 | 70/30 formula uses `lensAverage` derived from user input | Composite score reflects user bias, not algorithmic assessment |
| 5 | Standard deviation for stability classification uses user scores | "Stable"/"Contested"/"Ethically Unstable" labels reflect user consistency, not case analysis |
| 6 | Research dataset integrity is compromised | Published aggregate data would reflect self-assessment, not the framework |

### 3.3 Root Cause

The Milestone 2 implementation treated lens scores as a **user input** (like selecting professional codes) rather than as a **computed output** of the analysis engine. The AI prompt was explicitly restricted from producing scores, and a passthrough was built from the frontend sliders directly into the guardrails formula.

### 3.4 Affected Files (Current State)

| File | What It Does Wrong |
|---|---|
| `src/pages/CaseIntake.tsx` | Lines 46-53: Initializes `lensScores` state with 6 sliders. Lines 223-268: Renders slider UI. Line 107: Passes `lensScores` to `analyzeCase()`. |
| `src/services/aiAnalysis.ts` | Line 54: `AnalysisRequest` interface includes `lensScores?: Record<string, number>`. Line 62: Sends `lensScores` in request body. |
| `supabase/functions/analyze-case/index.ts` | Line 132: Request handler destructures `lensScores: userLensScores`. Lines 140-142: Falls back to default `{utilitarian:5,...}`. Line 86: `applyGuardrails` takes `lensInputScores` as 2nd parameter. Lines 93-100: Builds lens scores from user input. Line 179: Calls `applyGuardrails(aiOutput, lensInputScores)`. |

---

## 4. PROPOSED DATA FLOW (CORRECT)

```
USER                          FRONTEND                      EDGE FUNCTION                    AI (Gemini)
  |                              |                              |                               |
  |-- writes narrative -------->|                              |                               |
  |-- selects codes ----------->|                              |                               |
  |                              |                              |                               |
  |                              |-- POST {title, narrative,-->|                               |
  |                              |    stakeholders,             |                               |
  |                              |    selectedCodes}            |                               |
  |                              |                              |                               |
  |                              |    (NO lensScores field)     |                               |
  |                              |                              |                               |
  |                              |                              |-- prompt (reasoning + scores)->|
  |                              |                              |                               |
  |                              |                              |<-- {lensAnalysis: {           |
  |                              |                              |       utilitarian: {           |
  |                              |                              |         score: 8,              |
  |                              |                              |         reasoning: "..."},     |
  |                              |                              |       duty: {                  |
  |                              |                              |         score: 3,              |
  |                              |                              |         reasoning: "..."},     |
  |                              |                              |       ...}} --------------------|
  |                              |                              |                               |
  |                              |                              |-- applyGuardrails(aiOutput)   |
  |                              |                              |                               |
  |                              |                              |   Extracts AI scores.          |
  |                              |                              |   Clamps to 1-10.              |
  |                              |                              |   Computes 70/30 composite.    |
  |                              |                              |   Classifies stability.        |
  |                              |                              |   Enforces violation cap.      |
  |                              |                              |                               |
  |<------------ structured results with AI-computed scores ----|                               |
```

### 4.1 Role Separation (Book Methodology)

| Actor | Role | Provides |
|---|---|---|
| **User** | Subject-matter expert describing the dilemma | Narrative text, stakeholder context, applicable professional codes |
| **AI (Gemini)** | Analytical engine | Qualitative reasoning + numeric alignment scores (1-10) per lens |
| **Guardrails Layer** | Deterministic safety net | Score clamping, composite computation, stability classification, violation caps |
| **Output** | Non-prescriptive structured report | Lens cards, radar chart, composite score, conflict alerts, reflective questions |

---

## 5. DETAILED SPECIFICATION OF CHANGES

### 5.1 CHANGE 1: Case Intake Form (Frontend)

**File:** `src/pages/CaseIntake.tsx`

**Objective:** Remove all user-facing lens scoring UI. The form collects narrative context only.

#### 5.1.1 Remove import

```typescript
// CURRENT (line 3):
import { Slider } from "@/components/ui/slider";

// AFTER: Delete this entire import line.
```

#### 5.1.2 Remove state variable

```typescript
// CURRENT (lines 46-53):
const [lensScores, setLensScores] = useState<Record<string, number>>({
  utilitarian: 5,
  duty: 5,
  justice: 5,
  virtue: 5,
  care: 5,
  commonGood: 5,
});

// AFTER: Delete this entire useState block.
```

#### 5.1.3 Remove lensScores from analyzeCase call

```typescript
// CURRENT (lines 103-108 inside handleSubmit):
const analysis = await analyzeCase({
  title,
  narrative,
  stakeholders: stakeholders || "",
  selectedCodes,
  lensScores,        // <-- this line
});

// AFTER:
const analysis = await analyzeCase({
  title,
  narrative,
  stakeholders: stakeholders || "",
  selectedCodes,
});
```

#### 5.1.4 Remove entire Ethical Lens Scoring UI section

Delete the entire JSX block between the Professional Codes section and the Consent Checkboxes section. This is the block that begins with:

```tsx
{/* Ethical Lens Scoring */}
<div>
  <label className="block text-sm font-medium text-foreground mb-1">
    Ethical Lens Scoring <span className="text-destructive">*</span>
  </label>
```

And ends with the closing `</div>` after the last slider group (commonGood). This includes:
- The section header and description text
- All 6 lens slider groups (utilitarian, duty, justice, virtue, care, commonGood)
- Each slider with its label, description, value display, min/max labels

**What remains in the form (in order):**
1. Case Title (text input) -- unchanged
2. Case Description (textarea) -- unchanged
3. Key Stakeholders (text input, optional) -- unchanged
4. Applicable Professional Code(s) (checkboxes) -- unchanged
5. Required Consent (2 checkboxes) -- unchanged
6. Action Buttons (Cancel + Submit) -- unchanged

#### 5.1.5 No changes to form validation

The current `isFormValid` check is:
```typescript
const isFormValid = title.trim() && narrative.trim() && selectedCodes.length > 0 && consentNoConfidential && consentAggregateUse;
```
This does NOT reference `lensScores`, so it remains correct as-is.

---

### 5.2 CHANGE 2: Analysis Service Interface (Frontend)

**File:** `src/services/aiAnalysis.ts`

**Objective:** Remove `lensScores` from the request contract. Response contract is unchanged.

#### 5.2.1 Update AnalysisRequest interface

```typescript
// CURRENT (lines 49-55):
export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
  lensScores?: Record<string, number>;
}

// AFTER:
export interface AnalysisRequest {
  title: string;
  narrative: string;
  stakeholders: string;
  selectedCodes: string[];
}
```

#### 5.2.2 Update analyzeCase function body

```typescript
// CURRENT (lines 58-64):
body: {
  title: request.title,
  narrative: request.narrative,
  stakeholders: request.stakeholders,
  selectedCodes: request.selectedCodes,
  lensScores: request.lensScores,
},

// AFTER:
body: {
  title: request.title,
  narrative: request.narrative,
  stakeholders: request.stakeholders,
  selectedCodes: request.selectedCodes,
},
```

#### 5.2.3 Response interfaces: NO CHANGES

The following interfaces are CORRECT and must NOT be modified:

- `LensScore` (has `score: number` and `reasoning: string`) -- this is the output shape, which remains the same regardless of score source.
- `EthicsAnalysis` -- the full response shape consumed by all result components.
- `ViolationDetection` -- unchanged.

---

### 5.3 CHANGE 3: Supabase Edge Function (Backend)

**File:** `supabase/functions/analyze-case/index.ts`

**Objective:** Instruct AI to return numeric scores alongside reasoning. Rewire guardrails to consume AI-generated scores instead of user-provided scores. Preserve all deterministic logic.

This is the most critical and detailed change.

#### 5.3.1 Update SYSTEM_PROMPT

**Find this paragraph:**
```
CRITICAL: You provide QUALITATIVE REASONING ONLY. All numeric scores, classifications, and labels are computed deterministically by a post-processing guardrails layer. Do NOT assign numeric scores. Do NOT classify ethical stability. Do NOT use prescriptive language.
```

**Replace with:**
```
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
```

#### 5.3.2 Update USER_PROMPT_TEMPLATE JSON structure

**Find the expected JSON structure in the USER_PROMPT_TEMPLATE:**
```json
{
  "lensReasoning": {
    "utilitarian": "<2-3 sentences of analytical reasoning>",
    "duty": "<2-3 sentences of analytical reasoning>",
    "justice": "<2-3 sentences of analytical reasoning>",
    "virtue": "<2-3 sentences of analytical reasoning>",
    "care": "<2-3 sentences of analytical reasoning>",
    "commonGood": "<2-3 sentences of analytical reasoning>"
  },
```

**Replace with:**
```json
{
  "lensAnalysis": {
    "utilitarian": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" },
    "duty": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" },
    "justice": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" },
    "virtue": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" },
    "care": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" },
    "commonGood": { "score": "<integer 1-10>", "reasoning": "<2-3 sentences of analytical reasoning>" }
  },
```

#### 5.3.3 Update CRITICAL REMINDERS in USER_PROMPT_TEMPLATE

**Find:**
```
- Do NOT include any numeric scores. Scores are computed deterministically.
```

**Replace with:**
```
- Include a numeric alignment score (integer 1-10) for each lens based on your analysis of the narrative. Scores will be validated and clamped by the deterministic guardrails layer.
```

**Keep unchanged:**
```
- Do NOT classify stability. Classification is computed deterministically.
- Do NOT use prescriptive language ("should", "must", "recommended"). Use analytical framing only.
- For violationSeverity: use "none" if no issues, "tension" for ambiguity, "single_violation" for one code violated, "multi_violation" for 2+ codes violated.
```

#### 5.3.4 Update the guardrails layer comment block

**Find:**
```typescript
// ===== DETERMINISTIC GUARDRAILS (Algorithm v2.0 — Mark's Book Spec) =====
// All numeric scoring, classification, and weighting is handled here.
// AI provides qualitative reasoning only.
```

**Replace with:**
```typescript
// ===== DETERMINISTIC GUARDRAILS (Algorithm v2.0.1 — Mark's Book Spec) =====
// AI provides qualitative reasoning AND numeric lens alignment scores.
// This layer validates, clamps, and applies deterministic composite scoring,
// stability classification, and violation enforcement.
```

#### 5.3.5 Update applyGuardrails function signature

**Find:**
```typescript
function applyGuardrails(
  raw: Record<string, unknown>,
  lensInputScores: Record<string, number>
): Record<string, unknown> {
```

**Replace with:**
```typescript
function applyGuardrails(
  raw: Record<string, unknown>
): Record<string, unknown> {
```

#### 5.3.6 Update lens score extraction inside applyGuardrails

**Find (the first section inside the function, after `lensKeys`):**
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

**Replace with:**
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

**Note:** The `clampScore()` function already handles edge cases (NaN, out-of-range, non-integer). It clamps to 1-10 and rounds. This provides the deterministic guardrail over AI output -- the same safety net that was previously applied to user input.

#### 5.3.7 Update the algorithm version tag

**Find:**
```typescript
    _algorithmVersion: "2.0",
```

**Replace with:**
```typescript
    _algorithmVersion: "2.0.1",
```

#### 5.3.8 Update the serve() request handler

**Find:**
```typescript
    const { title, narrative, stakeholders, selectedCodes, lensScores: userLensScores } = await req.json();
```

**Replace with:**
```typescript
    const { title, narrative, stakeholders, selectedCodes } = await req.json();
```

**Find and DELETE entirely:**
```typescript
    // Default lens scores if not provided (backwards compatibility)
    const lensInputScores = userLensScores ?? {
      utilitarian: 5, duty: 5, justice: 5, virtue: 5, care: 5, commonGood: 5,
    };
```

**Find:**
```typescript
    const enforced = applyGuardrails(aiOutput, lensInputScores);
```

**Replace with:**
```typescript
    const enforced = applyGuardrails(aiOutput);
```

---

## 6. WHAT MUST NOT CHANGE (PRESERVATION LIST)

This section is critical. The following must remain exactly as they are:

### 6.1 Deterministic Guardrails Logic (all preserved)
- `clampScore()` function -- unchanged
- `standardDeviation()` function -- unchanged
- Code compliance score mapping (`multi_violation` -> 1, `single_violation` -> 3, `tension` -> 6, `none` -> 9) -- unchanged
- Composite formula: `lensComponent = lensAverage * 0.30`, `codeComponent = codeScore * 0.70` -- unchanged
- Violation cap: `if (anyViolation) { finalScore = Math.min(finalScore, 4.9); }` -- unchanged
- Stability classification thresholds (stdDev > 2.5 -> Contested, violation -> Ethically Unstable) -- unchanged
- Multi-code violation override -- unchanged

### 6.2 Response Shape (unchanged)
- `EthicsAnalysis` interface in `aiAnalysis.ts` -- unchanged
- `LensScore` interface (`{score: number, reasoning: string}`) -- unchanged
- `_internal` metadata fields (lensAverage, codeScore, lensComponent, codeComponent, lensStdDev, weightingFormula) -- unchanged
- `_guardrailsApplied` flag -- unchanged

### 6.3 Frontend Results Components (zero changes)
- `src/pages/Results.tsx` -- unchanged
- `src/components/results/ResultsHeader.tsx` -- unchanged
- `src/components/results/LensCard.tsx` -- unchanged
- `src/components/results/LensRadarChart.tsx` -- unchanged
- `src/components/results/ConflictAlert.tsx` -- unchanged
- `src/components/results/WarningFlags.tsx` -- unchanged
- `src/components/results/CodeImplications.tsx` -- unchanged
- `src/components/results/RecommendationsSection.tsx` -- unchanged
- `src/components/results/ResultsFooterActions.tsx` -- unchanged

### 6.4 Authentication, Authorization, Database Schema (zero changes)
- `src/contexts/AuthContext.tsx` -- unchanged
- `src/pages/Login.tsx`, `Register.tsx`, `Verify.tsx`, `ResetPassword.tsx`, `ForgotPassword.tsx` -- unchanged
- `src/pages/Admin.tsx` -- unchanged
- `src/services/database.ts` -- unchanged
- `src/integrations/supabase/types.ts` -- unchanged (no DB schema change)
- `supabase/` migration files -- no new migrations needed
- `case_submissions.analysis_result` column stores JSON; the shape of that JSON does not change

### 6.5 Other Untouched Files
- `src/pages/Index.tsx` (landing page) -- unchanged
- `src/pages/About.tsx` -- unchanged
- All `src/components/ui/*` components -- unchanged
- `src/components/layout/*` -- unchanged
- All config files (vite, tailwind, tsconfig, eslint, postcss) -- unchanged

---

## 7. AI PROMPT BEFORE / AFTER COMPARISON

### 7.1 What the AI was asked to return BEFORE:

```json
{
  "lensReasoning": {
    "utilitarian": "string (reasoning only)",
    "duty": "string (reasoning only)",
    "justice": "string (reasoning only)",
    "virtue": "string (reasoning only)",
    "care": "string (reasoning only)",
    "commonGood": "string (reasoning only)"
  },
  "violationDetection": { ... },
  "conflictAnalysis": { ... },
  "analyticalObservations": [ ... ],
  "questionsForReflection": [ ... ],
  "warningFlags": [ ... ]
}
```

### 7.2 What the AI will be asked to return AFTER:

```json
{
  "lensAnalysis": {
    "utilitarian": { "score": 8, "reasoning": "string" },
    "duty": { "score": 3, "reasoning": "string" },
    "justice": { "score": 6, "reasoning": "string" },
    "virtue": { "score": 4, "reasoning": "string" },
    "care": { "score": 7, "reasoning": "string" },
    "commonGood": { "score": 5, "reasoning": "string" }
  },
  "violationDetection": { ... },
  "conflictAnalysis": { ... },
  "analyticalObservations": [ ... ],
  "questionsForReflection": [ ... ],
  "warningFlags": [ ... ]
}
```

**Key change:** `lensReasoning` (flat string map) becomes `lensAnalysis` (structured object map with score + reasoning per lens). Everything else in the AI response remains the same.

---

## 8. GUARDRAILS LAYER BEFORE / AFTER COMPARISON

### 8.1 Score Source BEFORE:
```
User slider input -> frontend state -> request body -> applyGuardrails(raw, USER_SCORES) -> composite
```

### 8.2 Score Source AFTER:
```
AI analysis output -> applyGuardrails(raw) -> extract from raw.lensAnalysis -> clampScore() -> composite
```

### 8.3 Composite Formula (UNCHANGED):
```
lensAverage = mean(6 lens scores)
lensComponent = lensAverage * 0.30
codeComponent = codeScore * 0.70
compositeScore = lensComponent + codeComponent
if (anyViolation) compositeScore = min(compositeScore, 4.9)
```

---

## 9. EDGE CASES AND FALLBACK HANDLING

| Scenario | Current Behavior | After Change |
|---|---|---|
| AI returns no score for a lens | N/A (user provides all scores) | `clampScore(undefined)` returns 5 (safe default) |
| AI returns score outside 1-10 | N/A | `clampScore()` clamps to 1-10 range |
| AI returns non-numeric score | N/A | `clampScore(NaN)` returns 5 |
| AI returns `lensReasoning` instead of `lensAnalysis` (old format) | Would work | Fallback: `raw.lensAnalysis ?? {}` returns empty, all scores default to 5, reasoning shows "No analysis provided." -- degraded but not broken |
| AI returns no response / parse error | Existing error handling throws | No change -- same error path |
| Gemini rate limit (429) | Returns user-friendly rate limit message | No change |

---

## 10. TESTING AND VALIDATION CRITERIA

### 10.1 Frontend Validation
- [ ] Case Intake form renders with NO slider inputs
- [ ] Form has exactly: Case Title, Case Description, Key Stakeholders, Professional Codes, Consent, Submit/Cancel
- [ ] Form validation works: requires title + narrative + at least 1 code + both consents
- [ ] No TypeScript compilation errors
- [ ] No console errors on form load or submission

### 10.2 Data Flow Validation
- [ ] Network request to `analyze-case` edge function contains NO `lensScores` field in body
- [ ] Request body contains only: `title`, `narrative`, `stakeholders`, `selectedCodes`

### 10.3 Edge Function Validation
- [ ] AI prompt requests `lensAnalysis` with score + reasoning per lens
- [ ] AI response is parsed and scores are extracted from `lensAnalysis`
- [ ] `clampScore()` is applied to each AI-provided score
- [ ] Composite score is computed using AI-derived `lensAverage` (not user input)
- [ ] Response includes `_algorithmVersion: "2.0.1"`
- [ ] Response includes `_guardrailsApplied: true`

### 10.4 Results Page Validation
- [ ] All 6 lens cards display with AI-computed scores (1-10) and reasoning
- [ ] Radar chart renders correctly with AI-computed scores
- [ ] Composite score circle displays the 70/30 weighted result
- [ ] Ethical Stability badge shows correct classification
- [ ] Conflict alerts appear when lens score divergence exceeds thresholds
- [ ] Warning flags appear when violations are detected
- [ ] Violation cap (composite <= 4.9) triggers correctly on violation cases

### 10.5 Regression Checks
- [ ] Login/Register/Verify flow works
- [ ] Usage counter increments on submission
- [ ] Admin dashboard loads and shows submissions
- [ ] About page renders correctly
- [ ] Print styling still works on Results page

---

## 11. DEPLOYMENT NOTES

### 11.1 Edge Function Redeployment Required

The Supabase edge function `analyze-case` must be redeployed after changes. If using Lovable's integrated Supabase deployment, this happens automatically. If manually deployed:

```bash
supabase functions deploy analyze-case
```

### 11.2 No Database Migration Required

The `case_submissions.analysis_result` column stores arbitrary JSON. The shape of the stored JSON does not change (the `EthicsAnalysis` response interface is unchanged). No migration needed.

### 11.3 No Environment Variable Changes

`GEMINI_API_KEY` remains the only required secret. No new secrets or config.

### 11.4 Backward Compatibility

Previously submitted cases (with user-provided lens scores stored in `analysis_result`) will continue to display correctly on the Results page because the stored JSON already matches the `EthicsAnalysis` interface shape. The source of the scores changes, but the stored format does not.

---

## 12. SUMMARY OF DELIVERABLES

| # | Deliverable | File | Type |
|---|---|---|---|
| 1 | Remove lens slider UI from intake form | `src/pages/CaseIntake.tsx` | Frontend |
| 2 | Remove lensScores from request interface | `src/services/aiAnalysis.ts` | Frontend |
| 3 | Update AI prompt to return scores | `supabase/functions/analyze-case/index.ts` | Backend |
| 4 | Rewire guardrails to use AI scores | `supabase/functions/analyze-case/index.ts` | Backend |
| 5 | Bump algorithm version to 2.0.1 | `supabase/functions/analyze-case/index.ts` | Backend |

**Total lines added:** ~25
**Total lines removed:** ~45
**Net change:** ~-20 lines (simpler codebase)

---

## 13. APPROVAL

- [ ] Mark (Book Author / System Architect) -- Methodology alignment
- [ ] Development -- Technical feasibility confirmed
- [ ] QA -- Test plan accepted

---

*End of OpenSpec Proposal OPENSPEC-EIP-2026-002*
