# Wardrobe Mirror — Project Context for Claude

For concise agent operating rules, source-of-truth files, hard constraints, and verification gates, read `AGENTS.md`.
This file is the long-form project context for schema details, data contracts, bug history, and rationale.

## What this project is

A mobile-first garment research diagnostic tool built in Figma Make (Vite + React + TypeScript). Used in an academic research context to collect wardrobe behaviour data from participants via three sequential question sets. Data is submitted to a Supabase PostgreSQL database hosted in Frankfurt (EU) for GDPR compliance.

**Researcher email:** hamed.m.nigje@gmail.com
**Active Supabase project:** `tahjilropjzzxolhnhnd.supabase.co` (Wardrobe Research org, eu-central-1, Free tier)

---

## Stack

- Vite 6 + React 18 + TypeScript 5
- Tailwind CSS 4 via `@tailwindcss/vite`
- `motion` 12.23.24 (`motion/react` — successor to framer-motion)
- pnpm (use `pnpm` not `npm`)
- Lucide React icons
- `@supabase/supabase-js` 2.49.4 for data submission (static imports, bundled at build time)

---

## Entry point and file structure

```
src/main.tsx
  └── src/app/App.tsx                                       (thin wrapper)
        └── src/app/components/mirror/MirrorGame.tsx       (orchestrator: state + handlers + gameState switch)
              ├── types.ts                                  (shared interfaces and type aliases)
              ├── constants/  (design.ts, garments.ts, archetypes.ts, baselineQuestions.ts, questionSteps.ts)
              ├── lib/        (session.ts, export.ts, supabase.ts, scoring.ts)
              ├── ui/         (SelectionTile, ContinueButton, SecondaryButton, QuestionScreen, ValueFingerprintRadar)
              ├── screens/    (WelcomeScreen, BaselineScreen, SetIntroScreen, QuestionRunner, SetCompleteScreen, FinalDashboard)
              └── questions/  (shared.tsx + SetAQuestion, SetBQuestion, SetCQuestion)

utils/supabase/info.tsx           (Supabase project URL + publishable key)
src/app/styles/wardrobe-mirror.css   (design tokens, safe-area insets, archetype reveal animation)
package.json                      (must include "motion": "12.23.24")
pnpm-workspace.yaml               (declares onlyBuiltDependencies for @tailwindcss/oxide + esbuild)
Bug.md                            (non-technical bug report for stakeholders)
```

`MirrorGame.tsx` owns state, handlers, and the `gameState` switch. Supporting types, constants, scoring, export/submission helpers, screen components, and question renderers live under `src/app/components/mirror/`.

`Styled Version/` and `OG/` are legacy directories expected to be removed. They are not source-of-truth implementation references.

---

## Design system — DO NOT MODIFY

Colors are defined in the `COLORS` object in `src/app/components/mirror/constants/design.ts` and must match `wardrobe-mirror.css` exactly:
- Gold: `#d4af37`
- Light/cream: `#f5f1e8`
- Olive: `#8a9a5b`
- Dark backgrounds: `#1e293b` / `#0f172a` / `#1a3a2e`

---

## App flow

1. Welcome screen
2. Baseline — 4 questions (wardrobeSize, shoppingFrequency, disposalHabit, primaryDriver). No gender/age.
3. Set A — Recent purchase (6 questions)
4. Set B — Favourite garment (9 questions; last 2 — washFrequency, repaired — are optional)
5. Set C — Ready to dispose (6 questions)
6. Final dashboard — persona archetype, value radar, insights, data export tab

Navigation uses `QUESTION_STEPS` per-set definitions with `renderIndex`, `optional`, and `shouldShow()`. `handleContinue` / `handleBack` traverse visible steps only. Set B render indices are 0–6, 8, 9 (index 7 is a legacy gap; the former `case 10` other-reason screen was removed — `whyFavoriteOther` is captured inline in the `whyFavorite` question).

---

## Data submission — current state

### Static imports (no async loading)
At the top of `src/app/components/mirror/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publishableKey } from '../../../../../utils/supabase/info';
```
Bundled at build time so both local AND Figma get them with no runtime resolution risk.

### `submitToSupabase()` returns a `SubmissionResult`
```typescript
type SubmissionResult = { ok: true } | { ok: false; error: string };
```
- Inserts up to 3 rows (one per completed set) into `wardrobe_responses`
- Retries once after 3 s on failure
- Treats Postgres duplicate-key errors (code `23505`) as success — supports the UNIQUE constraint on `(session_id, set_type)`
- Returns the actual error message on failure for UI surfacing

### Submission status UI on final dashboard
- **`Saving your responses…`** — persistent banner while `emailSent === null`
- **Auto-dismiss thank-you banner** — appears for 3 seconds on success (`"Thank You for contributing to this research."`)
- **`Your data could not be saved.`** — persistent red banner with the actual error string and a "Try again" button on failure; user can dismiss

### Credentials file
`utils/supabase/info.tsx`:
```typescript
export const supabaseUrl = 'https://tahjilropjzzxolhnhnd.supabase.co'
export const publishableKey = 'sb_publishable_GimdOx0qVB4-Dw5u4gngvw_AYNqZxJG'
```

---

## Supabase schema (as deployed in `tahjilropjzzxolhnhnd`)

```sql
CREATE TABLE wardrobe_responses (
  id bigint generated always as identity primary key,
  session_id text NOT NULL,
  completed_at timestamptz NOT NULL,
  wardrobe_size text, shopping_frequency text, disposal_habit text, primary_driver text,
  persona text,
  social_value int2, emotional_value int2, functional_value int2, inflow_outflow_value int2,
  set_type text NOT NULL,
  garment_type text, how_got text, cost text,
  wear_frequency text, main_use text, main_use_other text, why_bought text, why_bought_other text,
  completion_status text,
  how_long_had text, how_long_had_years text, why_favorite text, why_favorite_other text,
  wash_frequency text, repaired text, why_not_wear text, why_not_wear_other text, disposal_plan text,
  use_changed text, brand text, -- LEGACY: retained for historical rows, never written by the app
  consent_given bool, consent_timestamp timestamptz,
  CONSTRAINT valid_set_type CHECK (set_type IN ('A','B','C')),
  CONSTRAINT unique_session_set UNIQUE (session_id, set_type)
);

ALTER TABLE wardrobe_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_only" ON wardrobe_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_no_select" ON wardrobe_responses FOR SELECT TO anon USING (false);
CREATE POLICY "anon_no_update" ON wardrobe_responses FOR UPDATE TO anon USING (false);
CREATE POLICY "anon_no_delete" ON wardrobe_responses FOR DELETE TO anon USING (false);
```

The Supabase advisor will flag `anon_insert_only` as "RLS Policy Always True". This is intentional — anonymous participants must be able to insert from the browser. The explicit deny policies on SELECT / UPDATE / DELETE enforce read protection. Safe to ignore the advisor warning.

---

## Captured CSV data — current state of cells & columns

Audited via `mcp__plugin_supabase_supabase__execute_sql`. As of May 2026 (~14 rows total):

**No column mismatches found.** Every set's data lands in its proper columns:
- Set A rows: `garment_type`, `how_got`, `cost`, `wear_frequency`, `main_use`, `why_bought` (+ optional `why_bought_other`) populated; all B/C-specific columns empty `''`
- Set B rows: `how_long_had`, `why_favorite` (+ optional `why_favorite_other`), `wash_frequency`, `repaired` populated; A/C-specific columns empty `''`. `use_changed`/`brand` are LEGACY and always NULL (not written by the app).
- Set C rows: `how_long_had_years`, `why_not_wear`, `disposal_plan` populated correctly (the earlier bug where `disposal_plan` was dropped is verified fixed); `how_long_had` and A/B-specific columns empty `''`

**Two quirks (not bugs, design decisions):**
1. **Empty strings instead of NULL** for cells not relevant to a given set type. The code emits `''` for unused columns rather than `null`. Cosmetic for CSV exports; counts() will include these as non-null in Postgres.
2. **Literal `'skipped'` string** when a participant explicitly skips an optional text input (e.g. `why_favorite` in Set B, `how_long_had_years` in Set C). Researcher needs to filter `WHERE why_favorite NOT IN ('', 'skipped')` for analysis.

**Always-NULL columns (by design):**
- `consent_given` and `consent_timestamp` — consent screen is deferred; these stay null until that work lands.

---

## UI features added (May 2026)

| Feature | Where |
|---|---|
| Progress indicator inside set questions (`Set X · Question N of M` + bar) | Above `renderQuestion()` |
| Auto-dismiss thank-you banner (3 s) on success | Above persistent status banner |
| Persistent status banner (Saving / Failed only — Saved handled by auto-dismiss) | After Baseline Comparison section |
| Retry button on submission failure (both Data tab + dashboard) | Failure banner |
| Submission error message surfaced in UI (mono-font under failure line) | Failure banner |
| Archetype reveal animation (slide + fade) | `.archetype-description-reveal` CSS class |
| Safe-area insets on `.wm-screen`/`.wm-screen-centered` and final dashboard header | CSS + `safe-top` className |
| Contrast fix: Reflection Prompt + archetype description → dark glass | Final dashboard |
| 800 ms auto-advance (up from 400 ms) | `handleAnswer`, `handleSkip` |
| Continue button disabled on empty text for forced "Other" follow-ups | `renderOtherInput`, whyBoughtOther, howLongHad |
| Aria-hidden on decorative icons | SelectionTile, archetype tiles |

---

## Bugs fixed this session (May 2026)

All documented in `Bug.md` with plain-language descriptions.

| # | What was wrong | Where |
|---|---|---|
| 1 | Set C rows had 27 cols instead of 28 — `disposal_plan` always `undefined` | `buildResponseRow()` |
| 2 | `useChanged` scorer checked stale option values — zero scoring for all B respondents | `calculateValuesFromMirrorGame()` |
| 3 | Baseline comparison on results dashboard used only `primaryDriver`, ignoring 3 other baseline fields | `baselineValues` block |
| 4 | Persona name prefix mismatch — "YOU" badge never appeared on archetype grid | `isUser` comparison |
| 5 | "Balanced Adapter" missing from `ARCHETYPE_INFO` — fallback persona invisible | `ARCHETYPE_INFO` |
| 6 | Archetype grid had hardcoded duplicate slot for user's persona + "Social Chameleon" was missing entirely | Dashboard archetype grid |
| 7 | Multi-select toggle used stale `currentResponse` (race condition on rapid taps) | `handleMultiSelectToggle` |
| 8 | Continue button advanced even when user selected "Other" but left text empty | mainUse, whyBoughtOther, renderOtherInput, howLongHad |

---

## Scoring methodology (redesigned, June 2026)

Scoring is now a theory-grounded, two-profile model (replacing the old additive scheme). See `docs/scoring-methodology.md` for the summary and `docs/superpowers/specs/2026-06-04-scoring-methodology-redesign-design.md` for the full spec.

- **Anchor:** Theory of Consumption Values (Sheth et al. 1991) for functional/social/emotional; circular-economy literature for the 4th axis (`inflowOutflow`, shown as **"Circularity"**).
- **Two profiles:** baseline → *expectation* profile; Sets A/B/C → *reflected* (behavioural) profile; archetype assigned from the reflected profile via **prototype distance** (not the old threshold cascade).
- **Per-axis normalization:** `score = 50 + 50·(Σ w·s / Σ w)` — 50 = neutral, signed evidence, completion-invariant.
- **Now scored** (previously deferred): `washFrequency`, `howLongHad` (Set B categorical + Set C years), and `cost` are mapped to constructs. `brand` remains legacy/never-written. The old `TODO (research team decision)` in scoring is resolved.
- **Code:** `lib/scoring.ts` (public API, unchanged signatures) delegates to `lib/scoring-engine.ts` (pure functions) + `lib/scoring-config.ts` (weight tables + prototypes as data). Unit-tested in `tests/scoring-engine.test.ts` and `tests/scoring.test.ts`.
- **Storage:** reflected values still write to the existing `*_value` columns + `persona` (no DB migration). Pre-redesign rows are not directly comparable to new rows.
- **Caveat:** weights/prototypes are expert-set v1 priors — *theory-aligned, not yet empirically validated*.

## Known deferred issues

- **Consent screen** — `consent_given` and `consent_timestamp` columns exist in the DB schema but are always `null`. GDPR open exposure remains.
- **Scoring calibration** — the redesigned scoring's item weights and archetype prototype coordinates are expert-set starting values; the research team should review for face validity and ideally calibrate against a participant sample.

---

## Workflow notes

- Use `AGENTS.md` as the concise operating guide for future implementation work
- Always use `pnpm dev` to run locally
- `pnpm typecheck` runs cleanly with zero errors after the May 2026 fixes
- The Supabase publishable key (`sb_publishable_...`) is intentionally public-facing — RLS enforces insert-only access, so exposure is safe by design
- Do not add gender/age fields back to the baseline — these were deliberately removed
- Do not add `useChangeDescription` back to Set B — deliberately removed
- Email path via Resend Edge Function was removed entirely — researcher accesses data via Supabase dashboard only
- When syncing local changes to Figma, push these files in order:
  - `src/app/components/mirror/MirrorGame.tsx`
  - `src/app/components/mirror/types.ts`
  - `src/app/components/mirror/constants/design.ts`
  - `src/app/components/mirror/constants/garments.ts`
  - `src/app/components/mirror/constants/archetypes.ts`
  - `src/app/components/mirror/constants/baselineQuestions.ts`
  - `src/app/components/mirror/constants/questionSteps.ts`
  - `src/app/components/mirror/lib/session.ts`
  - `src/app/components/mirror/lib/export.ts`
  - `src/app/components/mirror/lib/supabase.ts`
  - `src/app/components/mirror/lib/scoring.ts`
  - `src/app/components/mirror/ui/SelectionTile.tsx`
  - `src/app/components/mirror/ui/ContinueButton.tsx`
  - `src/app/components/mirror/ui/SecondaryButton.tsx`
  - `src/app/components/mirror/ui/QuestionScreen.tsx`
  - `src/app/components/mirror/ui/ValueFingerprintRadar.tsx`
  - `src/app/components/mirror/screens/WelcomeScreen.tsx`
  - `src/app/components/mirror/screens/BaselineScreen.tsx`
  - `src/app/components/mirror/screens/SetIntroScreen.tsx`
  - `src/app/components/mirror/screens/QuestionRunner.tsx`
  - `src/app/components/mirror/screens/SetCompleteScreen.tsx`
  - `src/app/components/mirror/screens/FinalDashboard.tsx`
  - `src/app/components/mirror/questions/shared.tsx`
  - `src/app/components/mirror/questions/SetAQuestion.tsx`
  - `src/app/components/mirror/questions/SetBQuestion.tsx`
  - `src/app/components/mirror/questions/SetCQuestion.tsx`
  - `utils/supabase/info.tsx`
  - `package.json`
  - `src/app/styles/wardrobe-mirror.css`
  - `pnpm-workspace.yaml`
  - `CLAUDE.md`
- If MCP Supabase plugin is connected (`/mcp` shows it), Claude can query/migrate the active project directly without dashboard clicks
