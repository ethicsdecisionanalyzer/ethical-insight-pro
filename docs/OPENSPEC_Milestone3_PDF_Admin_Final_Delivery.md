# OpenSpec Proposal: Milestone 3 — PDF Export, Admin Tools & Final Delivery

---

## 1. METADATA

| Field | Value |
|---|---|
| **Proposal ID** | OPENSPEC-EIP-2026-004 |
| **Title** | Milestone 3 — Server PDF Export, Admin Tooling Expansion, QA/Security, and Final Delivery |
| **Author** | Reliy Dev Team |
| **Requested By** | Mark (Book Author / Product Owner) |
| **Priority** | HIGH |
| **Status** | PROPOSED |
| **Date** | 2026-03-01 |
| **Budget** | $850 fixed-scope milestone |
| **Depends On** | Milestone 2 v2.1 (AI-owned lens scoring + canonical lens definitions) |

---

## 2. EXECUTIVE SUMMARY

Milestone 3 delivers production-grade output and operations tooling: a **server-generated PDF report** (case + analysis), persistent PDF storage with secure download, and an expanded admin dashboard to manage **access codes + usage logs** (including deactivate/reset operations). The milestone also includes a focused QA/security hardening pass, UI polish, and a final handoff walkthrough.

This proposal is detailed to remove ambiguity before implementation and includes explicit **"trick tests"** to catch edge conditions, race conditions, and security regressions.

---

## 3. BASELINE AUDIT (CURRENT STATE)

### 3.1 What exists now

1. **Results export path is client-side print only**
   - `src/components/results/ResultsFooterActions.tsx` uses `window.print()`.
   - No server-rendered PDF, no storage persistence, no audit trail.

2. **Admin dashboard exists but is partial**
   - `src/pages/Admin.tsx` currently supports:
     - Verification questions CRUD
     - Users table + usage reset (`usage_count=0`)
     - Recent submissions view
   - Missing access code management UI and usage-log visibility.

3. **Access-code schema already exists (legacy but usable)**
   - `access_codes`, `code_redemptions` tables exist.
   - Security hardening migration limits broad anonymous access.
   - Current frontend does not expose access-code admin operations.

4. **Case + analysis are persistable**
   - `case_submissions.analysis_result` stores final analysis JSON.
   - Good foundation for server-side PDF generation input.

### 3.2 Gap versus Milestone 3 requirements

| Requirement | Current State | Gap |
|---|---|---|
| Server-generated PDF | Not implemented | Full backend export pipeline needed |
| Downloadable + stored PDF | Not implemented | Storage bucket + metadata + retrieval needed |
| Admin access code controls | Not implemented in UI | Add list/log/deactivate/reset flows |
| QA/security review | No milestone-level suite | Add explicit validation + adversarial checks |
| Final delivery/handoff | Not packaged | Add handoff checklist + operator steps |

---

## 4. SCOPE (MILESTONE 3)

### 4.1 In Scope

1. Server-generated PDF export for a case result.
2. Persist generated PDF in Supabase Storage.
3. Download workflow from app UI.
4. Admin dashboard enhancement:
   - View access codes
   - View code usage/redemption logs
   - Deactivate/reactivate codes
   - Reset usage counters
5. QA + security hardening pass.
6. Final UI polish + handoff walkthrough package.

### 4.2 Out of Scope

1. Replacing AI scoring/guardrails logic (Milestone 2 complete).
2. Major redesign of registration/auth flow.
3. Complex analytics warehouse integrations.
4. Bulk CSV import/export tooling (can be a future milestone).

---

## 5. TARGET SOLUTION ARCHITECTURE

### 5.1 High-level flow (PDF export)

```text
Results Page (authenticated user)
  -> invoke edge function export-case-pdf(case_id)
      -> validate JWT + ownership
      -> load case_submissions + analysis_result
      -> generate PDF bytes on server
      -> upload to private storage bucket
      -> insert export metadata row
      -> return signed download URL + export metadata
  -> browser downloads file
```

### 5.2 Why server-generated PDF

1. Eliminates client environment inconsistency from print-to-PDF.
2. Produces stable formatting across users.
3. Creates a persistent audit artifact in storage.
4. Enables ownership checks and secure access control.

---

## 6. DETAILED IMPLEMENTATION SPEC

## 6.1 Database and Storage Changes

### 6.1.1 New table: `case_pdf_exports`

Purpose: track generated files, status, versioning, and audit data.

Proposed columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | default `gen_random_uuid()` |
| `case_submission_id` | uuid fk -> `case_submissions.id` | required |
| `user_id` | uuid fk -> `auth.users.id` | required owner |
| `storage_path` | text | private bucket path |
| `file_size_bytes` | integer | storage/audit |
| `sha256` | text | integrity check |
| `generation_status` | text | `completed` / `failed` |
| `error_message` | text nullable | failure diagnostics |
| `created_at` | timestamptz | default now |

Indexes:
- `(case_submission_id, created_at desc)`
- `(user_id, created_at desc)`

RLS:
- owner can `select` own rows
- admin can `select` all rows
- insert via edge function/service role only

### 6.1.2 Storage bucket

- Bucket name: `case-pdf-exports` (private)
- Path convention: `user_id/case_id/export-YYYYMMDD-HHmmss.pdf`

### 6.1.3 Code-redemption logging hardening (for admin logs)

Enhance `code_redemptions` with explicit user context where possible:

| Change | Rationale |
|---|---|
| Add `user_id` nullable fk | enables true per-user audit logs |
| Add index on `(code_id, created_at desc)` | faster admin log table |
| Admin-read policy explicit | deterministic access for admin tools |

---

## 6.2 Edge Function: `export-case-pdf`

### 6.2.1 Responsibilities

1. Authenticate caller from bearer token.
2. Validate caller owns the target case (or is admin).
3. Reject export if `analysis_result` absent.
4. Build deterministic PDF document payload.
5. Generate PDF bytes server-side.
6. Upload file to private storage.
7. Insert metadata row into `case_pdf_exports`.
8. Return signed URL + metadata JSON.

### 6.2.2 Request/response contract

Request:

```json
{ "caseId": "<uuid>" }
```

Success response:

```json
{
  "exportId": "<uuid>",
  "storagePath": "<path>",
  "signedUrl": "<temporary download url>",
  "expiresIn": 3600,
  "fileSizeBytes": 123456,
  "generatedAt": "<iso timestamp>"
}
```

Failure codes:

| Status | Condition |
|---|---|
| 400 | invalid/missing caseId |
| 401 | unauthenticated |
| 403 | case not owned by caller |
| 404 | case not found |
| 409 | analysis not ready |
| 500 | generation/upload failure |

### 6.2.3 PDF content specification (black/white)

Sections (in order):

1. Cover header (case title, timestamp, algorithm version)
2. Case narrative summary
3. Stakeholders
4. Selected professional codes
5. Composite score + stability + conflict level
6. Six-lens table (score + reasoning)
7. Violation detection block
8. Code implication summaries
9. Analytical observations
10. Reflection questions
11. Warning flags
12. Non-advisory disclaimer

Rules:
- Monochrome layout only.
- Escape/normalize unsafe text.
- Paginate long sections safely.

---

## 6.3 Frontend Changes

### 6.3.1 Results page export UX

Files:
- `src/components/results/ResultsFooterActions.tsx`
- `src/pages/Results.tsx` (or dedicated hook/service)

Changes:

1. Replace `window.print()` primary export with server export action.
2. Add button states:
   - `Generate PDF`
   - `Generating...`
   - `Download PDF`
3. On success, auto-trigger download from signed URL.
4. On failure, toast with actionable error.
5. Keep optional fallback print button only if explicitly retained.

### 6.3.2 Service layer

File:
- `src/services/database.ts` (or new `src/services/pdfExport.ts`)

Add methods:

1. `generateCasePdf(caseId: string)`
2. `getLatestCasePdfExport(caseId: string)`

---

## 6.4 Admin Dashboard Enhancements

### 6.4.1 New tabs

File:
- `src/pages/Admin.tsx`

Add tabs:

1. `Access Codes`
2. `Usage Logs`

### 6.4.2 Access Codes tab requirements

Columns:
- Code
- Active
- Uses count
- Max uses
- Remaining
- Created at
- Actions

Actions:
1. Deactivate/reactivate code
2. Reset uses_count to `0`
3. Optional edit max uses (if approved)

### 6.4.3 Usage Logs tab requirements

Source:
- `code_redemptions` joined to `access_codes`
- include user metadata when available

Columns:
- Timestamp
- Code
- User/session
- Event type (redeem/reset/deactivate if logged)

### 6.4.4 Admin service functions

Extend `src/services/database.ts` with:

1. `getAccessCodes()`
2. `toggleAccessCode(id, active)`
3. `resetAccessCodeUsage(id)`
4. `getCodeRedemptionLogs(limit, offset)`

---

## 6.5 Security Review Requirements

Mandatory controls:

1. Edge function ownership enforcement for export.
2. Private storage bucket only (no public read).
3. Signed URL TTL <= 1 hour.
4. RLS coverage for new table + updated policies.
5. Admin-only write actions for access code state changes.
6. Input validation for IDs and user-provided text.
7. No secrets in logs or client payloads.

---

## 7. TRICK TEST PLAN (REQUIRED)

These are intentionally adversarial and must be executed before acceptance.

### 7.1 PDF generation trick tests

1. **Unauthorized export attempt**
   - User A requests export for User B case.
   - Expected: `403`, no storage write, no metadata row.

2. **Analysis-missing export**
   - Case exists but `analysis_result` is null.
   - Expected: `409`, clear error.

3. **Long narrative stress**
   - >4,500 chars narrative + long lens reasoning.
   - Expected: clean pagination, no text truncation corruption.

4. **Control character payload**
   - Narrative contains tabs/newlines/unicode punctuation.
   - Expected: PDF renders safely; no malformed file.

5. **Markup/script injection string**
   - Include `<script>alert(1)</script>` in narrative.
   - Expected: literal escaped text, never executable.

6. **Concurrent click race**
   - Trigger export 3 times rapidly.
   - Expected: deterministic behavior (single latest success policy or controlled multiple exports) with no orphan DB rows.

7. **Storage upload failure simulation**
   - Force upload error.
   - Expected: `generation_status=failed`, error logged, no false success URL.

8. **Expired signed URL**
   - Attempt download after expiration.
   - Expected: denied; user can regenerate or refresh URL.

### 7.2 Admin trick tests

9. **Deactivate already inactive code**
   - Expected: idempotent success/no-op, no crash.

10. **Reset usage while redemption in-flight**
    - Expected: no negative/inconsistent count; deterministic final value.

11. **View logs with missing user_id (legacy rows)**
    - Expected: row still rendered with fallback identity label.

12. **Non-admin calling admin mutation**
    - Expected: RLS/permission denial.

13. **Manual API attempt to set uses_count < 0**
    - Expected: constraint/policy rejects invalid value.

14. **Large log volume pagination**
    - Seed >5,000 logs.
    - Expected: page remains responsive; pagination works.

### 7.3 End-to-end governance tests

15. **Canonical analysis fidelity in exported PDF**
    - Export must match stored `analysis_result` values (no silent recomputation).

16. **Algorithm version traceability**
    - PDF contains `_algorithmVersion` from stored result.

17. **Cross-check score math**
    - Composite and stability printed in PDF match stored final values exactly.

18. **Redaction compliance check**
    - Confirm PDF includes warning/disclaimer language and does not leak credentials or hidden fields.

---

## 8. VALIDATION COMMANDS (IMPLEMENTATION PHASE)

At milestone implementation completion, run:

1. `npm run test`
2. `npm run lint`
3. `npm run build`
4. Edge function local smoke test for `export-case-pdf`
5. Manual admin flow verification in browser

No milestone sign-off if any required validator fails.

---

## 9. DEPLOYMENT + ROLLBACK PLAN

## 9.1 Deployment order

1. Apply DB migration(s) (table + policies + indexes).
2. Create storage bucket and policies.
3. Deploy `export-case-pdf` edge function.
4. Deploy frontend changes.
5. Run post-deploy smoke tests (export + admin actions).

## 9.2 Rollback plan

1. Revert frontend to prior commit (print-only path remains fallback).
2. Disable edge function route if failing.
3. Keep existing data; migration rollback only if severe schema defect.

---

## 10. FINAL POLISH + HANDOFF WALKTHROUGH

Deliver handoff packet containing:

1. Architecture overview (PDF pipeline + admin tools)
2. Admin operator guide (deactivate/reset/read logs)
3. Security model summary (RLS + signed URLs)
4. Test evidence matrix including trick tests
5. Known limitations + recommended next milestone backlog

Walkthrough agenda (live):

1. Generate PDF from an analyzed case
2. Download and verify persisted file path
3. Admin deactivates code + resets usage
4. Review usage logs
5. Review security controls and test results

---

## 11. ACCEPTANCE CRITERIA

Milestone 3 is accepted when all are true:

1. PDF export is generated on server (not browser print) and includes case + analysis.
2. Exported PDF is stored in Supabase storage and retrievable by authorized user.
3. Admin can view access codes, usage counts/logs, deactivate/reactivate codes, reset usage.
4. Security checks pass (ownership/RLS/signed URL/private bucket).
5. Trick tests pass and evidence is documented.
6. Lint/tests/build pass on final branch.
7. Handoff walkthrough completed.

---

## 12. BUDGET ALLOCATION ($850)

| Workstream | Allocation |
|---|---:|
| Server PDF pipeline (edge + storage + metadata) | $330 |
| Admin dashboard access-code/log tooling | $240 |
| QA + security hardening + trick tests | $180 |
| Final polish + handoff walkthrough package | $100 |
| **Total** | **$850** |

---

## 13. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| PDF library limitations in edge runtime | Medium | choose Deno-compatible PDF lib and keep layout deterministic |
| RLS misconfiguration blocks admin actions | High | stage migration + explicit admin policy tests |
| Race conditions around resets/redemptions | Medium | transactional updates and trick tests |
| Large narratives break PDF formatting | Medium | pagination + stress tests |

---

## 14. APPROVAL

- [ ] Mark — Scope approved
- [ ] Reliy Dev Team — Implementation approved
- [ ] QA — Trick tests passed
- [ ] Final delivery accepted

---

*End of OpenSpec Proposal OPENSPEC-EIP-2026-004*
