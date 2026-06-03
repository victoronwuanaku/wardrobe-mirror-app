# Wardrobe Mirror Agent Operating Guide

This file is the canonical first-read. Files listed below are summarized here — do not re-open them to re-verify facts already captured in this document. A project hook will warn on redundant re-reads (see `.claude/hooks/read-dedup.sh`).

This file is the concise operating contract for agents working in this repo.
For deeper project context, schema history, Supabase details, bug history, and rationale, read `CLAUDE.md`.

Use this file for:
- source-of-truth files
- current module ownership
- hard implementation constraints
- verification gates
- Figma/Figma Make sync file order

Do not use this file as a changelog or long-form project context. Keep detailed context in `CLAUDE.md`.

## Deep Context

- Read `CLAUDE.md` before changing Supabase behavior, export formats, scoring, consent/data collection, or research-facing analysis.
- Keep schema details, bug history, and rationale in `CLAUDE.md`; do not duplicate them here.
- When domain or data-contract context changes, update `CLAUDE.md` alongside the code.

## Source of Truth

- The root app is the implementation source of truth.
- Primary root files:
  - `src/app/App.tsx`
  - `src/app/components/mirror/MirrorGame.tsx`
  - `src/app/components/mirror/types.ts`
  - `src/app/components/mirror/constants/`
  - `src/app/components/mirror/lib/`
  - `src/app/components/mirror/ui/`
  - `src/app/components/mirror/screens/`
  - `src/app/components/mirror/questions/`
  - `src/app/styles/wardrobe-mirror.css`
  - `src/styles/index.css`
- `Styled Version/` and `OG/` are legacy directories slated for cleanup. Do not rely on them as source of truth.

## Current Architecture

- The root mirror feature is decomposed under `src/app/components/mirror/`.
- `MirrorGame.tsx` is the orchestrator only: state hooks, event handlers, submission trigger, sharing handlers, and the `gameState` switch.
- Shared contracts live in `types.ts`.
- Static data and pure configuration live in `constants/`:
  - `design.ts`
  - `garments.ts`
  - `archetypes.ts`
  - `baselineQuestions.ts`
  - `questionSteps.ts`
- Pure helpers live in `lib/`:
  - `session.ts`
  - `export.ts`
  - `supabase.ts`
  - `scoring.ts`
- Reusable visual primitives live in `ui/`.
- Whole screen components live in `screens/`.
- Set-specific question renderers live in `questions/`.
- Preserve root app behavior, state flow, question structure, response types, calculations, data export, sharing, and Supabase behavior.
- Do not re-consolidate the mirror feature back into a monolithic `MirrorGame.tsx`.

## Where Changes Belong

- Orchestration, state hooks, cross-screen handlers, and `gameState` branching: `src/app/components/mirror/MirrorGame.tsx`
- Shared TypeScript contracts and response shapes: `src/app/components/mirror/types.ts`
- Design constants, motion helpers, and shared color tokens: `src/app/components/mirror/constants/design.ts`
- Garment option labels, values, icons, and garment label/icon helpers: `src/app/components/mirror/constants/garments.ts`
- Archetype metadata shown in the dashboard: `src/app/components/mirror/constants/archetypes.ts`
- Baseline question copy and options: `src/app/components/mirror/constants/baselineQuestions.ts`
- Per-set question navigation, optional-step visibility, and set category names: `src/app/components/mirror/constants/questionSteps.ts`
- Session ID generation: `src/app/components/mirror/lib/session.ts`
- CSV/JSON export behavior and export row shape: `src/app/components/mirror/lib/export.ts`
- Supabase insert, retry, duplicate handling, and payload mapping: `src/app/components/mirror/lib/supabase.ts`
- Value scoring, persona calculation, and mirror insights: `src/app/components/mirror/lib/scoring.ts`
- Reusable controls and visual primitives: `src/app/components/mirror/ui/`
- Whole-screen layout and tab panels: `src/app/components/mirror/screens/`
- Set-specific question JSX and question-local input behavior: `src/app/components/mirror/questions/`

## Active UI Constraints

### Landing Page

- The root landing/welcome page should match the updated reference landing page structure and wording:
  - `The Wardrobe Mirror`
  - `A research tool exploring your relationship`
  - `with clothing and wardrobe behavior`
  - `How It Works`
  - `Answer questions about 3 specific garments from your wardrobe`
  - `Select your answer to continue through each question`
  - `Discover insights about your wardrobe patterns at the end`
  - CTA label: `Begin`
  - Footer: `Wardrobe Mirror Research`
- Keep the CTA wired to the existing root `handleStartGame` function so the current baseline flow remains intact.

### Non-Landing Screens

- Do not change non-landing wording or structure unless explicitly requested.
- Restyle only: layout polish, colors, typography, spacing, cards, buttons, progress indicators, and selection states.
- For screens without a direct Styled Version match, use the nearest visual pattern:
  - dark animated gradient background
  - soft radial overlays
  - glass cards
  - gold primary actions
  - subdued glass secondary actions
  - serif headings and muted sans-serif body text

## Current State

- The visual refactor and module decomposition are complete.
- `MirrorGame.tsx` is no longer the place for screen JSX, question JSX, constants, scoring, exports, or Supabase insert details.
- The app currently depends on `motion@12.23.24`; this dependency is approved.
- Behavior preservation is the default requirement for future changes:
  - same screen flow
  - same question structure
  - same response schemas
  - same scoring behavior
  - same CSV/JSON export shape
  - same Supabase payload shape
  - same sharing behavior
- Current verification gates are `pnpm typecheck` and `pnpm build`.

## Figma / Figma Make Notes

- Vite HMR console messages only confirm local preview hot updates; they do not confirm files were copied into Figma.
- Figma MCP can push, create, and update editable Figma design files via Figma tools.
- Figma MCP should not be treated as a direct code-sync mechanism for Figma Make source or `figma.site` publishing.

### Manual Figma Make Sync Order

- If manually copying the current root implementation into Figma Make, sync these files in order:
  - `src/app/App.tsx`
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
  - `src/app/styles/wardrobe-mirror.css`
  - `src/styles/index.css`
  - `package.json`
  - `pnpm-lock.yaml`
  - `CLAUDE.md`
  - `AGENTS.md`

## Cleanup Notes

- `Styled Version/` and `OG/` are legacy directories expected to be removed.
- Do not use them as implementation references.
- After deletion, remove any remaining references to them from project docs.

## Implementation Constraints

- Keep edits scoped to the root app unless asked otherwise.
- Do not edit `Styled Version/`, `OG/`, `dist/`, or `node_modules/`.
- `Styled Version/` and `OG/` may be deleted in cleanup; future work should not depend on them.
- Edit `supabase/`, `utils/`, `Notes/`, `Bug.md`, or `guidelines/` only when explicitly requested or directly required by the task.
- Prefer reusable CSS classes in `src/app/styles/wardrobe-mirror.css` over repeated inline styles.
- Keep Tailwind utility usage compatible with the current root setup.
- Do not add new dependencies beyond the approved `motion` package unless explicitly requested.
- Do not change response schemas, export formats, Supabase payload shape, or calculation logic during visual work.
- Keep pure helpers React-free where they are already extracted.
- Keep screen/question extractions behavior-identical; do not "clean up" JSX in a way that changes visual fidelity.

## Verification

Required command gates:

- Run `pnpm typecheck` after code changes before moving on.
- Run `pnpm build` after phase-sized changes, after dependency/config changes, and before final handoff.
- If `pnpm` misbehaves, use the direct fallbacks:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build
```

- Smoke-test any change that touches UI flow, navigation, export, sharing, Supabase submission, or screen/question rendering.
- This repo may not be a git repo. Do not assume commit, branch, or PR steps exist.
- If a verification command fails after a focused change, revert or isolate the most recent change before stacking unrelated fixes.

Manual smoke review should cover:

- Landing page matches the updated reference structure and copy.
- `Begin` advances to the existing baseline flow.
- Baseline questions still advance and store answers.
- Set A, B, and C question flows still work.
- Back buttons still work.
- Set completion continue/finish behavior still works.
- Final dashboard, insights, share, and data tabs render.
- CSV and JSON export buttons still trigger downloads.
- Desktop and mobile layouts have no clipped text, overlap, or broken spacing.
