# OpenSpec Proposal: Embed Canonical Lens Definitions in AI System Prompt
# Milestone 2 Finalization — Conceptual Layer Lock

---

## 1. METADATA

| Field | Value |
|---|---|
| **Proposal ID** | OPENSPEC-EIP-2026-003 |
| **Title** | Embed Book-Canonical Operational Definitions for All Six Ethical Lenses |
| **Author** | Mark (Book Author / System Architect) |
| **Priority** | CRITICAL — Milestone 2 finalization blocker |
| **Type** | Conceptual Layer Enhancement |
| **Status** | PROPOSED |
| **Date** | 2026-02-25 |
| **Milestone** | 2 (Finalization) |
| **Estimated Scope** | 1 file modified (edge function system prompt) |
| **Risk Level** | Low (prompt-only change, no code logic changes) |
| **Depends On** | OPENSPEC-EIP-2026-002 (lens scoring transfer — COMPLETED) |

---

## 2. EXECUTIVE SUMMARY

With Algorithm v2.0.1 deployed (lens scores now computed by AI, not user input), the next step is to lock the conceptual layer. The current system prompt contains generic one-line lens descriptions. Mark's book defines precise operational definitions with enumerated criteria for each lens. These canonical definitions must govern how the AI scores and reasons about each lens.

This proposal replaces the generic lens descriptions with the book's exact operational definitions, adds a scoring justification requirement tied to operational criteria, and specifies three validation test cases to confirm correct structural behavior.

---

## 3. GAP ANALYSIS

### 3.1 Current State (v2.0.1)

The `SIX ETHICAL LENSES` section of the system prompt contains one-line summaries:

```
1. **Utilitarian / Consequentialist** - Greatest good for greatest number. What produces the best outcomes?
2. **Deontological / Duty** - Professional obligations, rules, codes of conduct. What does duty demand?
3. **Justice / Fairness** - Equitable treatment across all stakeholders. Is the situation fair?
4. **Virtue Ethics** - Character and professional integrity. What would a person of good character do?
5. **Care Ethics** - Relationships and vulnerable populations. Who needs protection?
6. **Common Good** - Shared conditions and community welfare. What serves the broader community?
```

### 3.2 What Is Missing

| Gap | Impact |
|---|---|
| No operational definitions — only philosophical summaries | AI has no structured criteria to evaluate against |
| No enumerated criteria per lens | Scoring basis is vague and non-reproducible |
| No requirement to reference criteria in reasoning | Reasoning may be generic rather than criteria-anchored |
| Risk of AI reinterpreting lens meanings | Framework could drift from book methodology |

### 3.3 Required State (v2.1)

Each lens must include:
1. **Canonical definition** from the book
2. **Enumerated operational criteria** the AI must evaluate against
3. **Explicit instruction** that reasoning must reference these criteria

---

## 4. SPECIFICATION OF CHANGES

### 4.1 File Modified

| File | Change |
|---|---|
| `supabase/functions/analyze-case/index.ts` | Replace `SIX ETHICAL LENSES` section in SYSTEM_PROMPT with canonical definitions; add criteria-anchored reasoning instruction; bump version to 2.1 |

### 4.2 Replace SIX ETHICAL LENSES Section

**Find and replace the entire `## SIX ETHICAL LENSES` section** (the 6 numbered one-liners) with the following:

```
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
```

### 4.3 Add Criteria-Anchored Reasoning Instruction

In the `USER_PROMPT_TEMPLATE`, update the `lensAnalysis` JSON schema description. Change each lens entry from:

```
"reasoning": "<2-3 sentences of analytical reasoning>"
```

To:

```
"reasoning": "<2-3 sentences of analytical reasoning explicitly referencing the operational criteria for this lens>"
```

### 4.4 Bump Algorithm Version

Change `_algorithmVersion` from `"2.0.1"` to `"2.1"`.

Update the guardrails comment block from:
```
// ===== DETERMINISTIC GUARDRAILS (Algorithm v2.0.1 — Mark's Book Spec) =====
```
To:
```
// ===== DETERMINISTIC GUARDRAILS (Algorithm v2.1 — Mark's Book Spec) =====
```

---

## 5. WHAT MUST NOT CHANGE

- **Guardrails logic** — `clampScore()`, `standardDeviation()`, composite formula, violation cap, stability classification — all unchanged
- **70/30 weighting** — unchanged
- **Professional codes knowledge** — unchanged (already correct)
- **Violation detection rules** — unchanged
- **Non-advisory language constraint** — unchanged
- **Scoring guidelines and scoring rules** — unchanged (added in v2.0.1)
- **All frontend components** — unchanged
- **All response interfaces** — unchanged
- **Database schema** — unchanged

---

## 6. VALIDATION TEST CASES

Mark has specified three test cases that must be run through the live system to confirm structural behavior.

### Test Case 1: Voluntary Noise Reduction Implementation

| Field | Value |
|---|---|
| **Title** | Voluntary Noise Reduction Implementation |
| **Narrative** | A manufacturing company identifies that employee exposure to intermittent impulse noise is below regulatory limits but still associated with potential long-term hearing damage. The company voluntarily installs additional acoustic dampening panels and upgrades personal protective equipment without waiting for regulatory mandate. Workers are informed transparently about risks and mitigation steps. |
| **Professional Codes** | BCSP/ASSP, AIHA/ABIH |

**Expected Behavior:**
- High scores across all 6 lenses (7-10 range)
- Low standard deviation (< 2.5)
- No code violations detected
- High composite score (> 7.0)
- Stability: **Stable**

### Test Case 2: Suppressed Exposure Data

| Field | Value |
|---|---|
| **Title** | Suppressed Exposure Data |
| **Narrative** | An industrial hygienist discovers airborne contaminant measurements exceeding internal safety guidelines but below regulatory limits. Senior management instructs the hygienist not to disclose the findings to employees to avoid "unnecessary alarm." The hygienist complies and omits the data from the report. |
| **Professional Codes** | AIHA/ABIH, BCSP/ASSP |

**Expected Behavior:**
- Low Duty / Justice / Care scores (1-4 range)
- Code violation detected (multi_violation — both AIHA/ABIH and BCSP/ASSP violated)
- Composite score capped at **<= 4.9**
- Stability: **Ethically Unstable**

### Test Case 3: Resource Allocation Trade-Off

| Field | Value |
|---|---|
| **Title** | Resource Allocation Trade-Off |
| **Narrative** | A safety director must allocate limited budget between upgrading outdated ventilation systems at one facility or implementing a company-wide mental health support program. Both initiatives would improve worker well-being, but only one can be funded this year. |
| **Professional Codes** | BCSP/ASSP, ACOEM |

**Expected Behavior:**
- Divergent lens scores (some high, some lower)
- Higher standard deviation (> 2.5) OR tension detected
- No outright code violation
- Stability: **Contested**

---

## 7. IMPLEMENTATION CONSTRAINTS

1. These exact definitions must be encoded in the AI system prompt — no paraphrasing.
2. The AI must justify each score with reasoning tied explicitly to the operational criteria.
3. Numeric scores remain 1-10 and pass through the deterministic guardrails layer unchanged except for clamping.
4. No additional lenses may be introduced.
5. No renaming or reinterpretation of lens names without explicit approval from Mark.

---

## 8. DELIVERABLES

| # | Deliverable | File |
|---|---|---|
| 1 | Replace generic lens descriptions with canonical operational definitions | `supabase/functions/analyze-case/index.ts` |
| 2 | Add criteria-anchored reasoning requirement to prompt template | `supabase/functions/analyze-case/index.ts` |
| 3 | Bump algorithm version to 2.1 | `supabase/functions/analyze-case/index.ts` |
| 4 | Run 3 test cases and document results | Test execution log |
| 5 | Deploy updated edge function | Supabase deployment |

---

## 9. APPROVAL

- [ ] Mark (Book Author / System Architect) — Canonical definitions verified
- [ ] Development — Implementation confirmed
- [ ] QA — Three test cases pass expected structural behavior

---

*End of OpenSpec Proposal OPENSPEC-EIP-2026-003*
