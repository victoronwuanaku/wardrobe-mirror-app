# Wardrobe Mirror — Final Project Context

## Purpose

This document gives a general-audience overview of the Wardrobe Mirror project workflow: what the app is, what went wrong, how the workflow changed after the Google Sheets failure, and how Claude, Codex, and the developer each contributed.

It is written for future collaborators, reviewers, researchers, or technical helpers who need to understand the project without reading every implementation note.

## Project Overview

Wardrobe Mirror is a browser-based research tool about clothing and wardrobe behaviour. It guides a participant through a structured reflection about:

- a recent purchase
- a favourite garment
- a garment they are ready to let go of

The app then calculates a behavioural persona and value profile from the answers. The research value is not just the participant-facing result; it is the structured dataset created from the answers.

The active app is a Vite, React, and TypeScript project. The root app is the source of truth.

Important runtime path:

```text
src/main.tsx
  -> src/app/App.tsx
    -> src/app/components/mirror/MirrorGame.tsx
```

Important styling path:

```text
src/styles/index.css
  -> src/app/styles/wardrobe-mirror.css
```

`Styled Version/` is reference-only. It is useful for visual context, but it is not the implementation source of truth.

## High-Level Workflow Timeline

### 1. Figma Make Prototype

The project began as a Figma Make-style app: visually strong, fast to prototype, and deployable as a working React/Vite interface.

That workflow was useful for getting the experience on screen quickly. However, the generated/prototype code needed review before being used as a real research tool. The main risks were not visual. They were hidden in navigation, data integrity, and submission reliability.

### 2. Stabilization Phase

The first major review focused on whether participants could safely complete the questionnaire.

The key issue was brittle navigation. The app used hard-coded question numbers even though some questions were conditional. This could send participants to an invalid or empty screen.

The major fix was to replace hard-coded navigation with explicit per-set step definitions. The app now asks:

```text
Which question should be visible for this participant's current answers?
```

instead of:

```text
What is the next question number?
```

This fixed the Set B dead-end where answering "No" to a conditional question could previously trap the participant.

### 3. Google Sheets Data Phase

The next phase focused on the data pipeline. The project moved from an email-based submission path to a Google Apps Script webhook that wrote rows into a Google Sheet.

This had clear benefits at the time:

- the researcher controlled the sheet directly
- no private credentials were exposed in the browser
- data appeared in a familiar spreadsheet format
- the setup was fast and low-cost

The app was updated to build structured rows, quote CSV fields correctly, and keep CSV/JSON download as fallback.

### 4. Google Sheets Failure

The Google Apps Script approach failed because Google flagged the setup. The likely reason was structural: a public, unauthenticated POST endpoint on a consumer Google account looked similar to abusive data-collection infrastructure.

This was not treated as a GDPR finding. It was a platform enforcement event. Still, it revealed that consumer Google Sheets was not reliable enough as research infrastructure.

The failure changed the project direction. The app needed a more stable data destination with proper access control, EU-region hosting, and structured export.

### 5. Supabase Switch

The project switched to Supabase as the current data backend.

Supabase is now used as the structured data store. The browser inserts rows into a PostgreSQL table using the public anon key plus Row Level Security.

The security model is:

- anonymous participants can insert responses
- anonymous users cannot read existing responses
- anonymous users cannot update or delete responses
- the researcher accesses data through the Supabase dashboard
- CSV export can be done from the database table when needed

The active Supabase project is documented in `CLAUDE.md`. The current schema stores one row per completed set and includes the computed persona and value scores.

### 6. Visual And Motion Refinement

After the data workflow stabilized, the root app received a visual-focused pass using the updated Styled Version as reference.

The key rule was that this was not a behavioral rewrite. The root app remained the source of truth. The reference version only informed visual treatment.

Completed visual and interaction work included:

- updated landing page wording and structure
- dark glass visual system
- gold primary action treatment
- baseline question styling
- radio-style baseline selection
- in-card Back button placement
- approved `motion@12.23.24` integration
- screen entrances and small interaction feedback through `motion/react`
- reduced-motion consideration

The important constraint remained: preserve the root app's question flow, response data, scoring, exports, and submission behavior unless explicitly requested.

## Current App State

The current app is a compact Vite/React project where most behavior still lives in:

```text
src/app/components/mirror/MirrorGame.tsx
```

This file contains:

- question definitions
- answer state
- navigation
- scoring
- Supabase submission
- CSV/JSON export
- final dashboard
- most UI rendering

This is not ideal architecture, but it is an intentional current-state constraint. Splitting the file should be treated as a separate refactor with a clear plan.

Current known backend direction:

- Google Apps Script / Google Sheets is no longer the preferred storage path.
- Email/Resend submission is no longer the active data workflow.
- Supabase is the current structured storage path.
- CSV remains important as an export and research-analysis format.

## Claude Workflow

Claude's role in this project was primarily stabilization, diagnosis, and backend/data workflow work.

The Claude workflow followed this pattern:

1. Read the repo and map the real runtime path.
2. Identify hidden functional risks, not just visible UI issues.
3. Propose a scoped plan before making changes.
4. Keep behavior-preserving fixes separate from visual or architectural refactors.
5. Implement only after the plan was agreed.
6. Verify with local build/type checks.
7. Document decisions and remaining risks.

Claude's major contributions included:

- identifying the brittle question-navigation model
- replacing hard-coded question indexes with visible-step navigation
- fixing the Set B dead-end
- improving build/install readiness
- auditing the data pipeline
- identifying CSV and submission risks
- helping move from Google Sheets after the platform failure
- documenting the current Supabase architecture
- writing stakeholder-friendly bug reports

Claude's working style was technical and corrective: find what can break the research workflow, fix it narrowly, and document the decision boundary.

## Codex Workflow

Codex's role was primarily root-app implementation, visual integration, Figma-context interpretation, motion integration, and workflow documentation.

The Codex workflow followed this pattern:

1. Treat the root app as the source of truth.
2. Inspect local files before asking questions.
3. Use `Styled Version/` only as visual reference.
4. Preserve behavior unless the user explicitly requests a behavioral change.
5. Make narrowly scoped edits.
6. Verify with local TypeScript and Vite build commands.
7. Keep `AGENTS.md` updated with rules future agents must follow.

Codex's major contributions included:

- importing the updated landing page structure and copy into the root app
- preserving root flow while applying the reference visual style
- adding the approved `motion` package after the CSS-only pass
- integrating `motion/react` for screen and control motion
- restoring and refining Back button behavior and placement
- changing baseline options to the requested radio/bullet-style UI
- documenting Figma/Figma Make limits and key file-copy considerations
- maintaining the distinction between root implementation and Styled Version reference

Codex's working style was implementation-focused: preserve the working app, apply the requested interface changes, verify, and document operational context for future sessions.

## Developer / Researcher Workflow

The developer/researcher provided the decisions and external setup that AI tools could not safely invent or complete alone.

Key developer inputs included:

- confirming the root app as the implementation source of truth
- defining `Styled Version/` as reference-only
- approving scope boundaries before implementation
- choosing when work should be visual-only versus behavioral
- providing screenshots as visual targets
- updating the local Styled Version when the reference changed
- confirming that the Google Sheets path had failed
- participating in the switch to a more stable backend path
- authorizing external services where required
- deciding that the app should preserve current research logic while improving presentation

The developer's role was not passive. The human workflow supplied the research intent, infrastructure ownership, visual judgment, and final decision-making authority.

## Planning Principles Used

Several planning principles shaped the project and should continue to guide future work.

### Source of truth must stay explicit

The root app is the source of truth. Reference folders and Figma-generated material can guide design, but they should not silently replace root behavior.

### Prototype does not mean production-ready

Figma Make helped produce a working prototype. It did not replace code review, data-flow review, privacy review, or backend resilience planning.

### Visual work and data work should stay separate

The app has research consequences. A visual change should not accidentally change response schemas, scoring, exports, or submission behavior.

### Data integrity matters more than convenience

The Google Sheets workflow was convenient, but its platform risk made it unsuitable after the failure. Supabase is more appropriate because it provides structured storage, access control, and export.

### Human approval is required at major forks

Major decisions were not left to an AI assistant:

- whether to keep or replace submission infrastructure
- what backend to use
- which visual reference to follow
- when to add a dependency
- what should remain out of scope

This made the project easier to audit later.

## Current Critical Constraints

Future collaborators should observe these constraints:

- Do not treat `Styled Version/` as implementation source.
- Do not reintroduce Google Apps Script as the main data path without a new risk review.
- Do not reintroduce the Resend/email path as the main submission path.
- Do not add gender/age fields back unless the research schema explicitly changes.
- Do not change scoring or response schemas during visual-only work.
- Do not split `MirrorGame.tsx` casually; plan it as a separate refactor.
- Keep `motion` as the approved motion library, not `framer-motion`.
- Prefer local verification with:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build
```

## Open Issues And Deferred Work

The following items remain important but should be handled as their own planned passes:

- consent screen and consent timestamp handling
- final privacy notice and data retention policy
- component decomposition of `MirrorGame.tsx`
- scoring review for fields that are collected but not currently scored
- deeper final dashboard motion and layout refinement
- formal handoff between local root code, Figma Make, and any published `figma.site` workflow

## Practical Figma Notes

Figma Make and Figma design files are related but not the same workflow.

Important distinctions:

- Vite HMR console messages only show that the local preview updated.
- They do not prove that files were copied into Figma.
- Figma MCP can create or update editable Figma design files.
- Figma MCP should not be assumed to directly sync local code into Figma Make source.
- `figma.site` publishing is a separate deployment concern.

If manually copying the current root implementation into Figma Make, the key files are:

```text
src/app/App.tsx
src/app/components/mirror/MirrorGame.tsx
src/app/styles/wardrobe-mirror.css
src/styles/index.css
utils/supabase/info.tsx
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
CLAUDE.md
AGENTS.md
```

## Recommended Handoff Summary

Wardrobe Mirror is now best understood as a research app that moved through three maturity stages:

```text
Visual prototype
  -> stabilized questionnaire
  -> resilient research-data workflow
  -> visual polish on the stabilized root app
```

The major lesson is that the app's visible interface and its research reliability are different concerns. The project became stronger when those concerns were separated: first stabilize the flow, then fix data integrity, then replace fragile infrastructure, then apply visual polish without changing the research logic.

Future work should continue that pattern.
