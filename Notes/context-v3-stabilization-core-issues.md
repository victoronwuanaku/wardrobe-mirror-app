# Context V3: Core Issues And Stabilization Work

## Scope

This document focuses only on the core issues found in the Wardrobe Mirror repo and the stabilization tasks completed on May 6, 2026.

It is based mainly on:

- `Notes/core-issues-context.md`
- `Notes/stabilization-plan-and-changes.md`
- the chat history around identifying critical errors and implementing the stabilization plan

It does not try to summarize every later cleanup task or every prompt in the conversation.

## Beginner Summary

Wardrobe Mirror is a React app built with Vite. The app asks participants questions about clothing items and then shows a final results screen.

The app currently runs through this path:

```text
src/main.tsx
  -> src/app/App.tsx
    -> src/app/components/mirror/MirrorGame.tsx
```

That means `MirrorGame.tsx` is the main file controlling the questionnaire experience.

The main stabilization goal was simple:

```text
Make the questionnaire flow reliable without changing scoring, exports, submission, or the final output behavior.
```

## Repo Context Found Before Fixing

The app was originally shaped like a Figma Make or Figma-generated Vite React project.

The frontend is a static Vite app. It also has a Supabase Edge Function for email submission:

```text
supabase/functions/server/index.tsx
```

The active frontend path was much smaller than the whole repo looked at first. The important runtime files were:

```text
src/main.tsx
src/app/App.tsx
src/app/components/mirror/MirrorGame.tsx
src/styles/index.css
src/app/styles/wardrobe-mirror.css
```

The `src/imports` folder was identified as reference or prototype material, not part of the active deployment path at the time of the stabilization plan.

## Core Issues Identified

### 1. Too Much Logic In One File

Most of the app behavior lived inside:

```text
src/app/components/mirror/MirrorGame.tsx
```

That file contained:

- question rendering
- question navigation
- response state
- scoring-related code
- final results UI
- export logic
- email submission logic
- helper functions

This made the app fragile because changing one part of the questionnaire could accidentally affect another part.

### 2. Brittle Question Navigation

The most critical issue was that the app relied on hard-coded question indexes.

In beginner terms, the app was behaving like this:

```text
"Move from question 1 to 2 to 3 until a fixed number is reached."
```

That works only if every question always appears.

The problem is that some questions are conditional. Some should appear only when the user gives a specific answer.

Because of that, hard-coded indexes could send the user to a question that should not be visible.

### 3. Set B Could Get Stuck

Set B had a concrete blocker.

The app asks:

```text
Has its use changed over time?
```

If the user answered `No`, the app could still move to the follow-up step that only makes sense when the answer is `Yes`.

That created an empty or invalid question screen and could trap the user in the flow.

### 4. Optional Brand Step Had Control Mismatch

The optional Set B brand question had a mismatch between:

- the step where the question rendered
- the step where the footer Continue button logic expected it

This could make the Continue or Skip behavior appear at the wrong time.

### 5. Render-Time Completion Was Unsafe

Some branches called completion logic while rendering a question.

In React, rendering should describe the UI. It should not directly trigger state-changing navigation like completing a set.

Doing that can create repeated state changes, warnings, flicker, or confusing behavior.

### 6. Install And Build Setup Was Fragile

The project setup was not ready enough for a clean install.

Two important packages:

```text
react
react-dom
```

were listed as optional peer dependencies instead of normal dependencies, even though the app imports and uses them directly.

There was also no lockfile at the start of the stabilization work, so installs were not fully reproducible.

## Stabilization Plan

The plan was intentionally narrow.

The work should:

- keep the active runtime path the same
- keep `MirrorGame.tsx` as the main app file
- preserve the visual structure
- preserve current question text and answer values
- avoid scoring changes
- avoid CSV export changes
- avoid JSON output changes
- avoid Supabase or email submission changes

The central technical plan was:

```text
Replace hard-coded question-index completion logic with explicit per-set question step definitions.
```

Each question step would have:

- a stable `id`
- a `renderIndex` pointing to the existing render branch
- an optional flag where useful
- an optional `shouldShow(response)` condition

Then the app could calculate:

```text
"Which questions are visible for this user right now?"
```

and move only through those visible questions.

## Stabilization Changes Completed

### 1. Added Explicit Question Step Metadata

Inside `MirrorGame.tsx`, explicit step definitions were added for:

- Set A
- Set B
- Set C

These step definitions describe the intended question order without relying only on magic numbers.

### 2. Added Visible-Step Calculation

A helper was added:

```text
getVisibleQuestionSteps(set, response)
```

This helper returns the list of steps that should actually appear for the current set and current answers.

That is what allows conditional questions to be skipped safely.

### 3. Updated Continue Navigation

`handleContinue` was changed so it:

- finds the current visible step
- moves to the next visible step
- completes the set only when there is no next visible step

This replaced brittle logic such as:

```text
currentQuestionIndex < 11
```

### 4. Updated Back Navigation

`handleBack` was changed so it:

- moves to the previous visible step
- respects skipped conditional questions
- returns to the set intro if there is no previous visible question

This keeps backward movement consistent with forward movement.

### 5. Fixed Set B `useChanged = no`

The Set B dead-end was fixed.

Now, if the user answers `No` to the use-changed question, the app skips the conditional follow-up and advances to the next valid step.

### 6. Fixed Text-Based Step Controls

Text-based questions were normalized only where needed.

The affected steps included:

- Set A: "Please specify why you bought it"
- Set B: "Why is it your favorite?"
- Set B: "What is the brand?"
- Set C: "How long have you had it?"

These steps now use consistent Continue, Skip, and Enter behavior where appropriate.

### 7. Removed Render-Time Completion Behavior

Completion behavior was moved out of render branches.

The app now completes a set through navigation logic instead of triggering completion while React is rendering UI.

### 8. Improved Install And Build Readiness

`react` and `react-dom` were moved into normal dependencies.

A pnpm lockfile was generated:

```text
pnpm-lock.yaml
```

This makes installs more predictable and better suited for deployment.

## Verification Completed At That Stage

Dependency installation was run with:

```bash
npx pnpm@10.18.3 install
```

The production build passed at the stabilization stage with:

```bash
npx pnpm@10.18.3 run build
```

The app was also run locally with:

```bash
npx pnpm@10.18.3 dev --host 127.0.0.1
```

Local URL used:

```text
http://127.0.0.1:5173/
```

## What Was Intentionally Not Fixed

These areas were identified but intentionally left for a different session:

- scoring logic
- CSV export reliability
- JSON output reliability
- Supabase submission reliability
- Resend email behavior
- final results interpretation
- large component refactoring

This was important because the goal was stabilization, not a complete rewrite.

## Why This Work Matters

Before the stabilization work, the app could get stuck because the navigation system did not understand conditional questions.

After the stabilization work, the app navigation is based on visible question steps. That makes the questionnaire flow safer while keeping the existing design and output behavior mostly unchanged.

The main improvement can be summarized like this:

```text
The app moved from number-based navigation to question-step-based navigation.
```

That is the core technical story from yesterday's work.

## Presentation Angle

If this becomes a presentation, the clearest storyline is:

1. The repo looked large, but the active app path was small.
2. The main app logic lived in `MirrorGame.tsx`.
3. The biggest user-facing risk was broken conditional navigation.
4. Set B had a real dead-end when `useChanged = no`.
5. The fix was to define visible question steps explicitly.
6. Continue and Back now follow the visible path.
7. Scoring, export, and submission were intentionally deferred.

The one-sentence takeaway:

```text
Yesterday's work stabilized the questionnaire flow and build readiness without changing the research outputs.
```
