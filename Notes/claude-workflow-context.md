# Claude Workflow Context

## Purpose Of This Document

This document explains the work completed so far on the Wardrobe Mirror app in beginner-friendly terms. It is written as a handoff for Claude, Codex, or any future collaborator who needs to understand the current repo, what was fixed, what was cleaned up, and what still needs a later decision.

This context can also be used as source material for a presentation about the project workflow.

## Simple Project Overview

Wardrobe Mirror is a Vite and React web app that was exported or shaped from a Figma Make workflow.

The app experience is a questionnaire game about clothing items. A participant answers Sets A, B, and C. At the end, the app shows results and offers export or submission actions.

The current deployed frontend path is:

```text
src/main.tsx
  -> src/app/App.tsx
    -> src/app/components/mirror/MirrorGame.tsx
```

In simple terms:

- `src/main.tsx` starts the React app.
- `src/app/App.tsx` wraps and displays the main app.
- `MirrorGame.tsx` contains the actual questionnaire experience.
- `src/styles/index.css` loads the visual styling.
- `supabase/functions/server/index.tsx` contains the backend email submission endpoint.

## What The Repo Looked Like Before

The repo had two main problems.

First, the main questionnaire worked through hard-coded question numbers. This was fragile because some questions are conditional. For example, Set B asks whether an item's use changed over time. If the answer was "No", the app still tried to move to a follow-up question that only made sense for "Yes". That could leave the participant on an empty or stuck screen.

Second, the repo had many generated or reference files that were not part of the real deployment path. These files made the project harder to understand because they looked important, but the app did not actually use them.

There were also build-readiness issues. `react` and `react-dom` were not listed as normal dependencies, there was no lockfile at the beginning of the stabilization work, and TypeScript/editor errors were harder to interpret because the project setup was incomplete.

## Workflow Completed So Far

### 1. Repo Context Was Mapped

The first step was to identify how the app actually runs when deployed.

The important discovery was that the real runtime path is small:

```text
main.tsx -> App.tsx -> MirrorGame.tsx
```

This meant the cleanup could preserve the active app while removing unused generated files.

### 2. Critical Questionnaire Flow Was Stabilized

The main fix was inside:

```text
src/app/components/mirror/MirrorGame.tsx
```

The old flow relied on question indexes such as "go to the next number until this limit." That is brittle when questions can be skipped.

The new flow uses explicit question step definitions for Sets A, B, and C. Each step has a stable identity and can optionally say when it should appear.

In beginner terms, the app now asks:

```text
"What is the next visible question for this user?"
```

instead of:

```text
"What is the next number?"
```

This fixed the Set B blocker where answering "No" to "Has its use changed over time?" could get the user stuck.

### 3. Text Question Controls Were Normalized

Several text-entry questions now behave consistently:

- They can continue when text is entered.
- They can be skipped when optional.
- The Enter key works where expected.

This was done without redesigning the app or changing the visual structure.

### 4. Build Setup Was Made More Reliable

The project dependencies were cleaned up so a clean install is more predictable.

Important build-readiness changes:

- `react` and `react-dom` are now normal dependencies.
- `pnpm-lock.yaml` exists for repeatable installs.
- `tsconfig.json` exists for TypeScript/editor stability.
- The package scripts now include:

```text
pnpm run dev
pnpm run build
pnpm run typecheck
```

### 5. Repo Cleanup Was Performed

Unused deployment paths and generated reference folders were removed.

Removed examples include:

- `src/imports`
- `src/app/components/ui`
- `src/app/components/figma`
- unused generated CSS files
- unused shadcn/theme support file
- unused Supabase KV helper
- unused package dependencies

The goal was to leave only the files that support the current deployed app.

## Current Important Files

These files are currently important for the app:

```text
index.html
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
vite.config.ts
src/main.tsx
src/app/App.tsx
src/app/components/mirror/MirrorGame.tsx
src/app/styles/wardrobe-mirror.css
src/styles/index.css
src/styles/tailwind.css
src/styles/theme.css
supabase/functions/server/index.tsx
utils/supabase/info.tsx
```

The `Notes` folder contains project context and handoff material.

## Verification So Far

The app was checked after stabilization and cleanup.

The production build passed with:

```bash
npx pnpm@10.18.3 run build
```

TypeScript also passed through the local TypeScript compiler:

```bash
./node_modules/.bin/tsc --noEmit
```

One note: this folder is not currently a Git repository, so Git status and commit history are not available from this working directory.

## What Was Intentionally Not Changed

Some areas were intentionally left for a future session.

Do not assume these areas are fixed:

- scoring logic
- CSV export correctness
- JSON output changes
- Supabase or Resend email submission reliability
- final results interpretation
- broader component refactoring
- presentation storytelling or slide design

The current work focused on navigation stability, build readiness, and repo cleanup.

## Codex Section

Codex should treat the current app as a compact Vite and React project.

The main working file is:

```text
src/app/components/mirror/MirrorGame.tsx
```

When making future changes:

- Preserve the active runtime path unless the user explicitly asks for a restructure.
- Do not restore `src/imports` or shadcn UI files unless the user needs Figma-generated reference material again.
- Keep scoring, export, and submission changes separate from navigation or cleanup work.
- Prefer small, verifiable changes because `MirrorGame.tsx` still contains many responsibilities.
- Run the build after behavior changes.

Recommended commands:

```bash
npx pnpm@10.18.3 install
npx pnpm@10.18.3 run typecheck
npx pnpm@10.18.3 run build
npx pnpm@10.18.3 dev --host 127.0.0.1
```

If a future presentation is being created, Codex should use this document as the technical source and then translate it into a simple story:

```text
Problem -> Investigation -> Stabilization -> Cleanup -> Current State -> Remaining Work
```

## Presentation-Friendly Storyline

A clear beginner-level presentation could follow this structure:

1. What Wardrobe Mirror is
2. How the app runs
3. What was broken or confusing
4. How the questionnaire flow was fixed
5. How the repo was cleaned for deployment
6. What was verified
7. What remains out of scope
8. What should happen next

The main message is:

```text
The app is now cleaner and more stable for the current deployment path, but scoring, exports, and submission reliability still need their own focused review.
```

## Questions To Clarify Before Creating The Presentation

These questions are not blockers for the repo handoff, but they would help shape the eventual presentation:

- Who is the presentation for: technical developers, a product/design audience, academic reviewers, or general stakeholders?
- Should the presentation focus more on the code cleanup, the questionnaire experience, or the research workflow?
- Should the tone be formal, educational, or project-update style?
- Should the deferred issues be presented as risks, next steps, or a separate future roadmap?
- Do you want screenshots of the app included in the presentation?

## Current Cleanup Answer

Yes, the repo is cleaned up for the current deployment workflow.

That means the unused generated/reference code has been removed, the active app path remains intact, dependencies were reduced, and the build was verified. It does not mean every possible future workflow is preserved. If you later need the removed Figma import/reference files, they would need to come from a backup, a previous copy, or a fresh Figma export.
