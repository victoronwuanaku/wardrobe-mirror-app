# Wardrobe Mirror Findings

## Scope

Critical review of the core Wardrobe Mirror codebase for survey logic, text-to-output alignment, UI/UX risks, core logic flaws, user challenges, security/privacy concerns, and project-context risks.

Verification performed:

- `pnpm typecheck` passed.
- `pnpm build` passed.
- Build emitted Vite's default chunk-size warning: generated JS is about `603 kB` minified, above the `500 kB` warning threshold.

## Executive Summary

The app is structurally clean and the core feature is well decomposed, but there are several risks that matter in a research-data context. The largest issues are not TypeScript errors; they are data-governance, survey-flow, schema-contract, and output-trust problems.

The top priorities are:

1. Add a real consent gate before collecting or submitting data.
2. Align Supabase schema docs/scripts with the actual app payload.
3. Guard against rapid double taps causing stale auto-advance behavior.
4. Fix stale "Other" companion fields and enforce text requirements consistently.
5. Make dashboard visuals match what the text says they represent.

## Findings

### 1. High: Consent and GDPR Path Is Not Implemented

The app submits rows with `consent_given: null` and `consent_timestamp: null`.

Relevant code:

- `src/app/components/mirror/lib/supabase.ts`
- `CLAUDE.md` already lists the consent screen as deferred.

Why this matters:

- This is a research tool collecting behavioral data.
- The database has consent columns, but the app never captures consent.
- Users can complete the full flow and submit data without an explicit consent step.

Recommendation:

- Add a consent screen before baseline questions.
- Store consent status and timestamp.
- Block survey start, export, and submission until consent is granted.
- Include concise research-purpose, data-use, retention, contact, and withdrawal language.

### 2. High: Supabase Schema Script and App Payload Are Out of Sync

The app submits fields such as `why_favorite_other` and `why_not_wear_other`, but `utils/supabase/create_table.sql` does not define those fields. The SQL script still includes stale fields such as `use_changed` and `brand`.

Relevant files:

- `src/app/components/mirror/lib/supabase.ts`
- `utils/supabase/create_table.sql`
- `CLAUDE.md`

Why this matters:

- A fresh deployment from the SQL script can fail at insert time.
- Project documentation says some fields exist or are populated when the current UI does not collect them.
- Researchers may analyze against the wrong columns.

Recommendation:

- Replace `create_table.sql` with the current deployed schema.
- Remove or clearly mark obsolete fields.
- Add a schema-contract test or fixture that compares generated insert payload keys against expected DB columns.

### 3. High: Public Anonymous Inserts Have No Abuse Controls

The Supabase anon key is public, and the RLS insert policy uses `WITH CHECK (true)`.

Relevant files:

- `utils/supabase/info.tsx`
- `utils/supabase/create_table.sql`
- `src/app/components/mirror/lib/supabase.ts`

Why this matters:

- RLS protects reads, updates, and deletes, which is good.
- But anyone can spam arbitrary insert rows if they discover the project URL and table name.
- This can pollute research data or exhaust free-tier limits.

Recommendation:

- Add stronger database constraints for allowed values.
- Consider an Edge Function for submission validation.
- Add rate limiting or CAPTCHA/Turnstile for public deployment.
- Add monitoring for abnormal insert volume.

### 4. Medium-High: Rapid Taps Can Advance Multiple Questions

Single-choice answers schedule an auto-advance after 800 ms, but previous timers are not cancelled and answering is not locked while the transition is pending.

Relevant code:

- `src/app/components/mirror/MirrorGame.tsx`

Why this matters:

- Fast double taps can schedule multiple `handleContinue` calls.
- This can skip questions or write stale responses.
- The same issue exists in baseline auto-advance.

Recommendation:

- Track a pending-advance timer with `useRef`.
- Clear any previous timer before scheduling a new one.
- Temporarily disable answer buttons while an auto-advance is pending.

### 5. Medium-High: Partial Completion Conflicts With Landing Copy

The landing page tells users they will answer questions about 3 garments, but after Set A and Set B the user can select `Finish Now`.

Relevant files:

- `src/app/components/mirror/screens/WelcomeScreen.tsx`
- `src/app/components/mirror/screens/SetCompleteScreen.tsx`
- `src/app/components/mirror/MirrorGame.tsx`

Why this matters:

- Partial submissions may be valid, but the current copy does not frame them as partial.
- Researchers may receive mixed 1-set, 2-set, and 3-set sessions.
- Dashboard scores/personas become less comparable across participants.

Recommendation:

- Either remove early finish or label the resulting output as partial.
- Add a confirmation when finishing early.
- In exported data, include a clear `setsCompleted` field and consider a `completion_status`.

### 6. Medium: Stale "Other" Text Can Survive Deselection

For multi-select questions, selecting `Other` opens a text field, but if the user later deselects `Other`, companion fields such as `mainUseOther`, `whyFavoriteOther`, or `whyNotWearOther` are not reliably cleared.

Relevant files:

- `src/app/components/mirror/MirrorGame.tsx`
- `src/app/components/mirror/questions/SetAQuestion.tsx`
- `src/app/components/mirror/questions/SetBQuestion.tsx`
- `src/app/components/mirror/questions/SetCQuestion.tsx`

Why this matters:

- Exported data can contain an "Other" text answer even when the corresponding option is not selected.
- This creates analysis ambiguity.

Recommendation:

- Centralize multi-select handling.
- When removing `other`, clear the matching companion field and `textInputValue`.
- Add tests for select-other, type-text, deselect-other, continue.

### 7. Medium: "Other" Text Requirement Is Inconsistent

Some "Other" flows disable Continue until text is entered. Others allow the user to select `Other` and continue with an empty companion value.

Relevant files:

- `src/app/components/mirror/questions/SetBQuestion.tsx`
- `src/app/components/mirror/questions/SetCQuestion.tsx`

Why this matters:

- The app claims forced "Other" follow-ups are protected, but this is only partly true.
- Empty or `skipped` values can appear where the researcher likely expects real text.

Recommendation:

- For every required `Other` companion input, disable Continue until trimmed text exists.
- If skipping is allowed, show a distinct Skip button and store a distinct skip marker intentionally.

### 8. Medium: Dashboard Text Does Not Match Radar Output

The dashboard legend says the chart compares "Initial Self-Assessment" and "Reflective Result", but `ValueFingerprintRadar` only renders final values and only includes three dimensions: social, emotional, and functional. It omits inflow/outflow.

Relevant files:

- `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
- `src/app/components/mirror/screens/FinalDashboard.tsx`

Why this matters:

- Users may believe they are seeing baseline-vs-final comparison when they are not.
- The fourth scoring dimension is hidden from the radar.
- This undermines trust in the output.

Recommendation:

- Either update the legend/copy to match the current chart, or render both baseline and final polygons.
- Include inflow/outflow in the visualization or explain why it is excluded.

### 9. Medium: Scoring Logic Needs Methodological Review

The scoring model is deterministic and transparent, but some mappings are crude or under-justified.

Relevant file:

- `src/app/components/mirror/lib/scoring.ts`

Examples:

- Any non-empty Set B `whyFavorite` answer adds emotional value, including options like `comfortable` and `easy-to-style`.
- Cost over 100 adds emotional value only.
- `washFrequency` and some duration fields are collected but not scored.

Why this matters:

- The output persona may feel authoritative while being driven by weak assumptions.
- Research analysis may conflate raw data collection with validated scoring.

Recommendation:

- Document each scoring rule as a research decision.
- Add scoring unit tests with named scenarios.
- Consider separating "research raw scores" from "participant-facing reflective archetype."

### 10. Medium: Question Metadata and Renderer Are Drifting

`QUESTION_STEPS.B` skips render indices and does not include the `case 10` renderer currently present in `SetBQuestion`.

Relevant files:

- `src/app/components/mirror/constants/questionSteps.ts`
- `src/app/components/mirror/questions/SetBQuestion.tsx`
- `CLAUDE.md`

Why this matters:

- Dead render cases confuse maintainers.
- Progress indicators depend on `QUESTION_STEPS`, so metadata must be exact.
- Documentation currently says Set B indices are consecutive, but the code has gaps.

Recommendation:

- Remove unreachable render cases or wire them intentionally.
- Update `CLAUDE.md` to match current implementation.
- Add a lightweight invariant test that every `QUESTION_STEPS` render index has a matching renderer case.

### 11. Medium-Low: Mobile Short-Screen Layouts May Clip Content

Several full-screen containers use `overflow: hidden` while centering content.

Relevant file:

- `src/app/styles/wardrobe-mirror.css`

Why this matters:

- Long question cards can become inaccessible on small phones, browser zoom, or landscape orientation.
- This is especially risky for multi-select screens with many options.

Recommendation:

- Prefer scrollable content containers for question screens.
- Test at small mobile heights, not just standard portrait sizes.
- Avoid fixed centered layouts for long survey cards.

### 12. Low: Naming and Comments Still Refer to Removed Email Flow

The code still uses `emailSent` for Supabase submission status, and the file header says data is automatically emailed.

Relevant file:

- `src/app/components/mirror/MirrorGame.tsx`

Why this matters:

- Misleading naming causes future mistakes.
- New contributors may reintroduce assumptions about an email path.

Recommendation:

- Rename `emailSent` to `submissionSucceeded` or `submissionStatus`.
- Update stale comments.

## UI/UX Improvement Opportunities

- Auto-advance after selection is efficient but can feel unforgiving. Consider a short selected state plus an undo/back affordance that is reliable.
- The `Finish Now` path should explain consequences before submitting partial data.
- The final dashboard is visually rich, but the Data tab is researcher-facing while the rest is participant-facing. Consider separating participant output from researcher export controls.
- Error messages expose raw Supabase error strings to users. Useful during testing, but production copy should be friendlier while preserving diagnostics behind a collapsible details section.
- The share fallback uses `alert()`, which is abrupt on mobile. A toast or inline confirmation would feel better.

## Security and Privacy Notes

- Public Supabase publishable keys are expected for browser apps, but public insert surfaces still need abuse controls.
- RLS read protection is important and appears to be the intended design.
- No XSS sink was found in the React rendering path; user input is rendered through React text nodes, not `dangerouslySetInnerHTML`.
- CSV export correctly quotes commas, quotes, and newlines.
- Browser console logs include session identifiers during submission; remove or gate these logs for production.

## Recommended Fix Order

1. Add consent gate and consent persistence.
2. Bring SQL schema, docs, and app payload into one contract.
3. Add auto-advance timer cancellation and tap locking.
4. Normalize all `Other` handling.
5. Decide whether partial completion is acceptable and update UX/data labels.
6. Fix dashboard/radar alignment.
7. Review and test scoring methodology.
8. Clean stale docs, comments, and variable names.

