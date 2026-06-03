# Core Issues and Repo Context

## Deployment Context

Wardrobe Mirror is a Figma Make-exported Vite React app. The active runtime path is:

```text
src/main.tsx -> src/app/App.tsx -> src/app/components/mirror/MirrorGame.tsx
```

`App.tsx` renders `MirrorGame`, and `src/styles/index.css` pulls in Tailwind, theme styles, and the Wardrobe Mirror visual system. The `src/imports` folder contains reference/prototype material from Figma or pasted sources and is not part of the active runtime path.

The deployed frontend is expected to be a static Vite SPA. Completed research data is posted from the browser to a Supabase Edge Function:

```text
/make-server-cfcad018/send-research-data
```

That function uses Resend to email CSV and JSON submissions to the researcher.

## Core Issues Found

The main app behavior was concentrated in one large file, `MirrorGame.tsx`, which contained types, constants, question rendering, state transitions, final dashboard UI, exports, share logic, scoring, and email submission. This made small flow changes risky because navigation, response data, and rendering were tightly coupled.

The most critical user-facing problem was brittle question navigation. The app used hard-coded question indexes and limits such as `currentQuestionIndex < 11` to determine when a set was complete. Conditional questions made this unsafe.

Set B had a concrete blocker: if a user answered "No" to "Has its use changed over time?", the app advanced to a conditional step that only rendered when the answer was "Yes". That produced an empty question screen and could trap the user.

There were mismatches between actual question indexes and footer controls. The optional Set B brand step rendered at one index, while the footer Continue logic checked another, so the expected Continue button could appear at the wrong time or not be used consistently.

Some render branches performed state-changing work directly, such as completing a set from inside a render switch branch. That is unsafe in React and can cause warnings, flicker, or repeated state transitions.

Project setup was also deployment-fragile. `react` and `react-dom` were listed as optional peer dependencies instead of normal dependencies, which means a clean install might not provide the packages the app imports directly. There was also no lockfile, so installs were not reproducible.

## Deferred Issues

The following areas were identified but intentionally deferred for a later session:

- Scoring logic mismatches between UI answer values and scoring expectations.
- CSV escaping and export reliability.
- Supabase/Resend submission reliability and backend logging hygiene.
- Larger component decomposition or architectural refactor.

