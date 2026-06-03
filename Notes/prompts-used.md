# Prompts Used So Far

## User Prompts

1. `analyse the folder to understand the code context`

2. `what are the core challenges or errors with this code`

3. `prompt: outline a plan to fix all critical errors, first understand the context of how the entire repo is supposed to work when deployed. Using that context, outline the plan. Ask necessary questions to obtain max clarity`

4. `go with best case workflow, that allows figma to still understand the core aspects and the outputs do not change significantly`

5. `first explain the following:
Replace hard-coded question-index completion logic with explicit per-set question step definitions inside MirrorGame.tsx.
Fix project install/build readiness section

Also, ignore fixes relating to the scoring logic and export and submission reliability. THose will be revisited in a different session`

6. `make a new planing without those sections`

7. `PLEASE IMPLEMENT THIS PLAN:
# Critical Navigation and Build Stabilization Plan

## Summary
Stabilize the Wardrobe Mirror app for the current Figma Make/Vite + Supabase deployment shape without changing scoring, CSV export, JSON output, or email submission behavior. Keep the active runtime path as src/main.tsx -> src/app/App.tsx -> MirrorGame, preserve the current visual structure, and focus only on questionnaire completion blockers plus install/build readiness.

## Key Changes
- Keep Figma-compatible structure:
  - Leave src/app/App.tsx as the active app wrapper rendering MirrorGame.
  - Keep MirrorGame in src/app/components/mirror/MirrorGame.tsx.
  - Do not wire in files from src/imports; treat them as reference material.

- Replace brittle index navigation:
  - Add explicit per-set step definitions inside MirrorGame.tsx for Sets A, B, and C.
  - Each step should have a stable id, render target, optional flag where relevant, and optional shouldShow(response) condition.
  - Update handleContinue to advance to the next visible step rather than using hard-coded limits like currentQuestionIndex < 11.
  - Update handleBack to move to the previous visible step, respecting skipped conditional questions.

- Fix critical question-flow blockers:
  - Ensure Set B does not get stuck after answering "No" to "Has its use changed over time?".
  - Ensure the optional Set B "What is the brand?" step shows its Continue button on the correct step.
  - Remove any render-time completion behavior such as calling completeSet() from inside a render branch.
  - Keep existing question text, answer values, and UI styling materially unchanged.

- Normalize question controls only where needed:
  - Make text-based steps use the existing textInputValue, Continue, Skip, and Enter behavior consistently.
  - Keep single-choice auto-advance behavior.
  - Keep multi-select steps requiring at least one selected option before continuing.

- Fix install/build readiness:
  - Move react and react-dom from optional peer dependencies into normal dependencies.
  - Generate and commit a lockfile using pnpm, since the repo already contains pnpm-workspace.yaml.
  - Add a minimal tsconfig.json only if needed for stable Vite/React build behavior.
  - Do not add linting, formatting, test frameworks, or broader tooling in this pass.

## Test Plan
- Run dependency install in a clean environment.
- Run the production build command and confirm the app bundles successfully.
- Manually complete Set A from start to finish.
- Manually complete Set B with useChanged = yes, including both entering and skipping the change description.
- Manually complete Set B with useChanged = no and confirm it advances to the next valid step.
- Manually complete Set B through the brand step and confirm Continue/Skip works.
- Manually complete Set C from start to finish.
- Verify finishing after Set A, after Set B, and after Set C still reaches the final results screen.
- Verify existing exports/submission buttons and final tabs still appear, without changing their behavior.

## Assumptions
- Scoring logic is intentionally out of scope.
- CSV escaping/export reliability is intentionally out of scope.
- Supabase/Resend email submission reliability is intentionally out of scope.
- The goal is a stabilization pass, not a full component refactor.
- Figma Make compatibility matters, so the main app shape and active file locations should remain recognizable.`

8. `I created a new folder called notes. In this folder creat md files:

first with the context of the core issues found with the entire repo base
another containging the planning before make the changes and the overview of the changes and outputs
last one with all the prompts used so far`

## Context Provided by User

The user shared IDE context showing these open files:

- `src/app/App.tsx`
- `src/app/components/mirror/MirrorGame.tsx`
- `src/main.tsx`
- `src/app/styles/wardrobe-mirror.css`

The active file was:

- `src/app/App.tsx`

